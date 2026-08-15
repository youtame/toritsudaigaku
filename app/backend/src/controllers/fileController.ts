// src/controllers/fileController.ts
import { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { files, filePermissions, users } from "../db/schema";
import { s3Service } from "../services/s3Service";
import { v4 as uuidv4 } from "uuid";

export const fileController = {
    /**
     * Get all files accessible by the authenticated user.
     * JOINS 'files' and 'file_permissions' to ensure security.
     */
    // src/controllers/fileController.ts

    async getMyFiles(req: Request, res: Response) {
        try {
            const userId = (req.session as any)?.userId;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Query database for files the user has permission to access
            const userFiles = await db
                .select({
                    id: files.id,
                    userId: files.userId,
                    s3Key: files.s3Key,
                    originalName: files.originalName,
                    fileSize: files.fileSize,
                    mimeType: files.mimeType,
                    createdAt: files.createdAt,
                })
                .from(files)
                .innerJoin(
                    filePermissions,
                    eq(files.id, filePermissions.fileId),
                )
                .where(eq(filePermissions.userId, userId));

            // Generate presigned download URLs for each file
            const filesWithUrls = await Promise.all(
                userFiles.map(async (file) => {
                    const downloadUrl = await s3Service.getDownloadUrl(
                        file.s3Key,
                        file.originalName,
                    );

                    return {
                        id: file.id,
                        originalName: file.originalName,
                        fileSize: file.fileSize,
                        mimeType: file.mimeType,
                        createdAt: file.createdAt,
                        downloadUrl: downloadUrl,
                        isOwner: file.userId === userId,
                    };
                }),
            );

            return res.status(200).json({ files: filesWithUrls });
        } catch (error) {
            console.error("Error fetching files:", error);
            return res.status(500).json({ error: "Failed to retrieve files" });
        }
    },

    /**
     * Request a presigned URL for uploading a new file directly to S3.
     * Also registers the file and owner permissions in PostgreSQL.
     */
    async requestUploadUrl(req: Request, res: Response) {
        try {
            const MAX_FILE_SIZE = 50 * 1024 * 1024;

            const ALLOWED_MIME_TYPES = [
                "text/plain",
                "text/markdown",
                "text/x-markdown",
                "application/pdf",
                "application/json",
                "image/jpeg",
                "image/png",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ];

            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { originalName, fileSize, mimeType } = req.body;

            if (!originalName || !fileSize || !mimeType) {
                return res
                    .status(400)
                    .json({ error: "Missing required file metadata" });
            }

            if (Number(fileSize) > MAX_FILE_SIZE) {
                return res.status(400).json({
                    error: "File size exceeds the maximum limit (50MB)",
                });
            }

            if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                return res
                    .status(400)
                    .json({ error: "Invalid or unsupported file type" });
            }

            // Generate a unique S3 key to avoid file name collisions
            const s3Key = `uploads/${uuidv4()}-${originalName}`;

            // 3. Insert file metadata into database
            const [newFile] = await db
                .insert(files)
                .values({
                    userId: userId,
                    s3Key: s3Key,
                    originalName: originalName,
                    fileSize: Number(fileSize),
                    mimeType: mimeType,
                })
                .returning();

            // 4. Grant access permission to the uploader (owner)
            await db.insert(filePermissions).values({
                fileId: newFile.id,
                userId: userId,
            });

            // 5. Generate presigned upload URL
            const uploadUrl = await s3Service.getUploadUrl(s3Key, mimeType);

            return res.status(201).json({
                fileId: newFile.id,
                uploadUrl: uploadUrl,
                s3Key: s3Key,
            });
        } catch (error) {
            console.error("Error requesting upload URL:", error);
            return res
                .status(500)
                .json({ error: "Failed to initialize upload" });
        }
    },

    /**
     * Share file access with another user by adding a record to 'file_permissions'.
     */
    async shareFilePermission(req: Request, res: Response) {
        try {
            const currentUserId = req.session?.userId;
            const { fileId } = req.params;
            const { targetEmail } = req.body;

            if (!currentUserId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const [file] = await db
                .select()
                .from(files)
                .where(
                    and(eq(files.id, fileId), eq(files.userId, currentUserId)),
                );

            if (!file) {
                return res
                    .status(403)
                    .json({ error: "Forbidden: You do not own this file" });
            }

            const [targetUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, targetEmail));

            if (!targetUser) {
                return res.status(404).json({ error: "Target user not found" });
            }

            await db.insert(filePermissions).values({
                fileId: fileId,
                userId: targetUser.id,
            });

            return res
                .status(200)
                .json({ message: "Permission granted successfully" });
        } catch (error) {
            console.error("Error sharing file permission:", error);
            return res
                .status(500)
                .json({ error: "Failed to share permission" });
        }
    },

    /**
     * Delete a file from both S3 and PostgreSQL.
     */
    async deleteFile(req: Request, res: Response) {
        try {
            const currentUserId = req.session.userId;
            const { fileId } = req.params;

            if (!currentUserId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Ensure the user owns the file before deleting
            const [file] = await db
                .select()
                .from(files)
                .where(
                    and(eq(files.id, fileId), eq(files.userId, currentUserId)),
                );

            if (!file) {
                return res
                    .status(404)
                    .json({ error: "File not found or access denied" });
            }

            // 1. Delete object from AWS S3
            await s3Service.deleteFile(file.s3Key);

            // 2. Delete record from PostgreSQL
            // Cascade delete in schema will automatically remove entries from 'file_permissions'
            await db.delete(files).where(eq(files.id, fileId));

            return res
                .status(200)
                .json({ message: "File deleted successfully" });
        } catch (error) {
            console.error("Error deleting file:", error);
            return res.status(500).json({ error: "Failed to delete file" });
        }
    },

    /**
     * Get a presigned download URL for a specific file (if user has access).
     */
    async getDownloadUrl(req: Request, res: Response) {
        try {
            const userId = req.session.userId;
            const { fileId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Check if user has permission to access this file
            const [permission] = await db
                .select({
                    s3Key: files.s3Key,
                    originalName: files.originalName,
                })
                .from(files)
                .innerJoin(
                    filePermissions,
                    eq(files.id, filePermissions.fileId),
                )
                .where(
                    and(
                        eq(files.id, fileId),
                        eq(filePermissions.userId, userId),
                    ),
                );

            if (!permission) {
                return res
                    .status(403)
                    .json({ error: "Access denied or file not found" });
            }

            // Generate presigned download URL
            const downloadUrl = await s3Service.getDownloadUrl(
                permission.s3Key,
                permission.originalName,
            );

            return res.status(200).json({ downloadUrl });
        } catch (error) {
            console.error("Error getting download URL:", error);
            return res
                .status(500)
                .json({ error: "Failed to generate download URL" });
        }
    },

    /**
     * Revoke file access permission from a specific user.
     */
    async revokePermission(req: Request, res: Response) {
        try {
            const currentUserId = req.session.userId;
            const { fileId, targetUserId } = req.params;

            if (!currentUserId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Verify that the requester is the owner of the file
            const [file] = await db
                .select()
                .from(files)
                .where(
                    and(eq(files.id, fileId), eq(files.userId, currentUserId)),
                );

            if (!file) {
                return res
                    .status(403)
                    .json({ error: "Forbidden: You do not own this file" });
            }

            // Cannot revoke permission from oneself (owner)
            if (targetUserId === currentUserId) {
                return res.status(400).json({
                    error: "Cannot revoke permission from the file owner",
                });
            }

            // Delete permission record for target user
            await db
                .delete(filePermissions)
                .where(
                    and(
                        eq(filePermissions.fileId, fileId),
                        eq(filePermissions.userId, targetUserId),
                    ),
                );

            return res
                .status(200)
                .json({ message: "Permission revoked successfully" });
        } catch (error) {
            console.error("Error revoking permission:", error);
            return res
                .status(500)
                .json({ error: "Failed to revoke permission" });
        }
    },
};

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
    async getMyFiles(req: Request, res: Response) {
        try {
            const userId = req.user?.id; // Assuming auth middleware attaches user info
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Query database for files the user has permission to access
            const userFiles = await db
                .select({
                    id: files.id,
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

            // Generate a unique S3 key to avoid file name collisions
            const s3Key = `uploads/${uuidv4()}-${originalName}`;

            // 1. Insert file metadata into database
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

            // 2. Grant access permission to the uploader (owner)
            await db.insert(filePermissions).values({
                fileId: newFile.id,
                userId: userId,
            });

            // 3. Generate presigned upload URL
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
            const currentUserId = req.user?.id;
            const { fileId } = req.params;
            const { targetUserId } = req.body;

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

            // Grant permission to the target user
            await db.insert(filePermissions).values({
                fileId: fileId,
                userId: targetUserId,
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
};

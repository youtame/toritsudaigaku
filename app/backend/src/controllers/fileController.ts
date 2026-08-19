// src/controllers/fileController.ts
import { Request, Response } from "express";
import { eq, and, like, or, inArray } from "drizzle-orm";
import { db } from "../db";
import { files, filePermissions, users } from "../db/schema";
import { s3Service } from "../services/s3Service";
import { v4 as uuidv4 } from "uuid";

export const fileController = {
    async getMyFiles(req: Request, res: Response) {
        try {
            const userId = (req.session as any)?.userId;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const userFiles = await db
                .select({
                    id: files.id,
                    userId: files.userId,
                    s3Key: files.s3Key,
                    originalName: files.originalName,
                    fileSize: files.fileSize,
                    mimeType: files.mimeType,
                    isEncrypted: files.isEncrypted,
                    encryptionMetadata: files.encryptionMetadata,
                    createdAt: files.createdAt,
                })
                .from(files)
                .innerJoin(
                    filePermissions,
                    eq(files.id, filePermissions.fileId),
                )
                .where(eq(filePermissions.userId, userId));

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
                        isEncrypted: file.isEncrypted,
                        encryptionMetadata: file.encryptionMetadata,
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

            const {
                originalName,
                fileSize,
                mimeType,
                isEncrypted,
                encryptionMetadata,
            } = req.body;

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

            const effectiveMimeType = isEncrypted
                ? "application/json"
                : mimeType;

            if (!ALLOWED_MIME_TYPES.includes(mimeType) && !isEncrypted) {
                return res
                    .status(400)
                    .json({ error: "Invalid or unsupported file type" });
            }

            const s3Key = `uploads/${uuidv4()}-${originalName.split("/").pop()}`;

            const [newFile] = await db
                .insert(files)
                .values({
                    userId: userId,
                    s3Key: s3Key,
                    originalName: originalName,
                    fileSize: Number(fileSize),
                    mimeType: mimeType,
                    isEncrypted: Boolean(isEncrypted),
                    encryptionMetadata: encryptionMetadata || null,
                })
                .returning();

            await db.insert(filePermissions).values({
                fileId: newFile.id,
                userId: userId,
            });

            const uploadUrl = await s3Service.getUploadUrl(
                s3Key,
                effectiveMimeType,
            );

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
     * Share file access. Automatically shares all parent placeholder folders too.
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

            const pathParts = file.originalName.split("/");
            const placeholderNames: string[] = [];

            if (pathParts.length > 1) {
                for (let i = 1; i < pathParts.length; i++) {
                    const parentPath = pathParts.slice(0, i).join("/");
                    placeholderNames.push(`${parentPath}/.placeholder`);
                }
            }

            const fileIdsToShare = [fileId];

            if (placeholderNames.length > 0) {
                const parentPlaceholders = await db
                    .select({ id: files.id })
                    .from(files)
                    .where(
                        and(
                            eq(files.userId, currentUserId),
                            inArray(files.originalName, placeholderNames),
                        ),
                    );

                parentPlaceholders.forEach((p) => fileIdsToShare.push(p.id));
            }

            for (const idToShare of fileIdsToShare) {
                const [existingPerm] = await db
                    .select()
                    .from(filePermissions)
                    .where(
                        and(
                            eq(filePermissions.fileId, idToShare),
                            eq(filePermissions.userId, targetUser.id),
                        ),
                    );

                if (!existingPerm) {
                    await db.insert(filePermissions).values({
                        fileId: idToShare,
                        userId: targetUser.id,
                    });
                }
            }

            return res.status(200).json({
                message:
                    "Permission granted successfully (including parent folders)",
            });
        } catch (error) {
            console.error("Error sharing file permission:", error);
            return res
                .status(500)
                .json({ error: "Failed to share permission" });
        }
    },

    /**
     * Delete a file or folder (Cascade deletes all files/subfolders if it's a folder).
     */
    async deleteFile(req: Request, res: Response) {
        try {
            const currentUserId = req.session.userId;
            const { fileId } = req.params;

            if (!currentUserId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const [targetFile] = await db
                .select()
                .from(files)
                .where(eq(files.id, fileId));

            if (!targetFile) {
                return res.status(404).json({ error: "File not found" });
            }

            if (targetFile.originalName.endsWith("/.placeholder")) {
                const folderPrefix = targetFile.originalName.replace(
                    "/.placeholder",
                    "/",
                );

                const allSubFiles = await db
                    .select()
                    .from(files)
                    .where(like(files.originalName, `${folderPrefix}%`));

                for (const file of allSubFiles) {
                    if (file.userId === currentUserId) {
                        await s3Service.deleteFile(file.s3Key);
                        await db.delete(files).where(eq(files.id, file.id));
                    } else {
                        const fileName =
                            file.originalName.split("/").pop() ||
                            `salvaged-${file.id}`;
                        await db
                            .update(files)
                            .set({ originalName: fileName })
                            .where(eq(files.id, file.id));
                    }
                }
            } else {
                if (targetFile.userId !== currentUserId) {
                    return res.status(403).json({ error: "Access denied" });
                }
                await s3Service.deleteFile(targetFile.s3Key);
                await db.delete(files).where(eq(files.id, fileId));
            }

            return res.status(200).json({ message: "Processed successfully" });
        } catch (error) {
            console.error("Error deleting file:", error);
            return res.status(500).json({ error: "Failed to delete" });
        }
    },

    async getDownloadUrl(req: Request, res: Response) {
        try {
            const userId = req.session.userId;
            const { fileId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const [permission] = await db
                .select({
                    s3Key: files.s3Key,
                    originalName: files.originalName,
                    isEncrypted: files.isEncrypted,
                    encryptionMetadata: files.encryptionMetadata,
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

            const downloadUrl = await s3Service.getDownloadUrl(
                permission.s3Key,
                permission.originalName,
            );

            return res.status(200).json({
                downloadUrl,
                isEncrypted: permission.isEncrypted,
                encryptionMetadata: permission.encryptionMetadata,
            });
        } catch (error) {
            console.error("Error getting download URL:", error);
            return res
                .status(500)
                .json({ error: "Failed to generate download URL" });
        }
    },

    async revokePermission(req: Request, res: Response) {
        try {
            const currentUserId = req.session.userId;
            const { fileId, targetUserId } = req.params;

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

            if (targetUserId === currentUserId) {
                return res.status(400).json({
                    error: "Cannot revoke permission from the file owner",
                });
            }

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

    async createFolder(req: Request, res: Response) {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { folderName, currentPath } = req.body;

            if (!folderName) {
                return res
                    .status(400)
                    .json({ error: "Folder name is required" });
            }

            if (folderName.includes("/")) {
                return res
                    .status(400)
                    .json({ error: "Folder name cannot contain slashes" });
            }

            const basePath = currentPath ? `${currentPath}/` : "";
            const placeholderName = `${basePath}${folderName}/.placeholder`;
            const s3Key = `uploads/${uuidv4()}-folder-${folderName}`;

            const [newFile] = await db
                .insert(files)
                .values({
                    userId: userId,
                    s3Key: s3Key,
                    originalName: placeholderName,
                    fileSize: 0,
                    mimeType: "text/plain",
                    isEncrypted: false,
                    encryptionMetadata: null,
                })
                .returning();

            await db.insert(filePermissions).values({
                fileId: newFile.id,
                userId: userId,
            });

            return res.status(201).json({
                message: "Folder created successfully",
                folderId: newFile.id,
            });
        } catch (error) {
            console.error("Error creating folder:", error);
            return res.status(500).json({ error: "Failed to create folder" });
        }
    },
};

// src/controllers/fileController.ts
import { Request, Response } from "express";
import { fileService } from "../services/fileService";

const getUserId = (req: Request): string | undefined => {
    return (req.session as any)?.userId;
};

export const fileController = {
    async getMyFiles(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const filesWithUrls = await fileService.getFilesForUser(userId);
            return res.status(200).json({ files: filesWithUrls });
        } catch (error: any) {
            console.error("Error fetching files:", error);
            return res.status(500).json({ error: "Failed to retrieve files" });
        }
    },

    async getFilesPath(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const targetPath = (req.query.path as string) || "";

            const files = await fileService.getFilesPath(userId, targetPath);
            return res.status(200).json({ files });
        } catch (error: any) {
            console.error("Error fetching files by path:", error);
            return res.status(500).json({
                error: "Failed to retrieve files for the specified path",
            });
        }
    },

    async getRecentFiles(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const limitParam = req.params.limit;
            const limit = limitParam ? parseInt(limitParam, 10) : 5;
            const safeLimit = isNaN(limit) || limit <= 0 ? 5 : limit;

            const filesWithUrls = await fileService.getRecentFilesForUser(
                userId,
                safeLimit,
            );
            return res.status(200).json({ files: filesWithUrls });
        } catch (error: any) {
            console.error("Error fetching recent files:", error);
            return res
                .status(500)
                .json({ error: "Failed to retrieve recent files" });
        }
    },

    async requestUploadUrl(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const result = await fileService.requestUploadUrl(userId, req.body);
            return res.status(201).json(result);
        } catch (error: any) {
            console.error("Error requesting upload URL:", error);
            if (error.message === "MISSING_METADATA")
                return res
                    .status(400)
                    .json({ error: "Missing required file metadata" });
            if (error.message === "FILE_TOO_LARGE")
                return res.status(400).json({
                    error: "File size exceeds the maximum limit (100MB)",
                });
            if (error.message === "INVALID_MIME_TYPE")
                return res
                    .status(400)
                    .json({ error: "Invalid or unsupported file type" });
            return res
                .status(500)
                .json({ error: "Failed to initialize upload" });
        }
    },

    async shareFilePermission(req: Request, res: Response) {
        try {
            const currentUserId = getUserId(req);
            const { fileId } = req.params;
            const { targetEmail } = req.body;

            if (!currentUserId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            await fileService.shareFilePermission(
                currentUserId,
                fileId,
                targetEmail,
            );
            return res.status(200).json({
                message:
                    "Permission granted successfully (including parent folders)",
            });
        } catch (error: any) {
            console.error("Error sharing file permission:", error);
            if (error.message === "FORBIDDEN_NOT_OWNER")
                return res
                    .status(403)
                    .json({ error: "Forbidden: You do not own this file" });
            if (error.message === "TARGET_USER_NOT_FOUND")
                return res.status(404).json({ error: "Target user not found" });
            return res
                .status(500)
                .json({ error: "Failed to share permission" });
        }
    },

    async deleteFile(req: Request, res: Response) {
        try {
            const currentUserId = getUserId(req);
            const { fileId } = req.params;

            if (!currentUserId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            await fileService.deleteFile(currentUserId, fileId);
            return res.status(200).json({ message: "Processed successfully" });
        } catch (error: any) {
            console.error("Error deleting file:", error);
            if (error.message === "FILE_NOT_FOUND")
                return res.status(404).json({ error: "File not found" });
            if (error.message === "ACCESS_DENIED")
                return res.status(403).json({ error: "Access denied" });
            return res.status(500).json({ error: "Failed to delete" });
        }
    },

    async getDownloadUrl(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const { fileId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const result = await fileService.getDownloadUrl(userId, fileId);
            return res.status(200).json(result);
        } catch (error: any) {
            console.error("Error getting download URL:", error);
            if (error.message === "ACCESS_DENIED")
                return res
                    .status(403)
                    .json({ error: "Access denied or file not found" });
            return res
                .status(500)
                .json({ error: "Failed to generate download URL" });
        }
    },

    async revokePermission(req: Request, res: Response) {
        try {
            const currentUserId = getUserId(req);
            const { fileId, targetUserId } = req.params;

            if (!currentUserId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            await fileService.revokePermission(
                currentUserId,
                fileId,
                targetUserId,
            );
            return res
                .status(200)
                .json({ message: "Permission revoked successfully" });
        } catch (error: any) {
            console.error("Error revoking permission:", error);
            if (error.message === "FORBIDDEN_NOT_OWNER")
                return res
                    .status(403)
                    .json({ error: "Forbidden: You do not own this file" });
            if (error.message === "CANNOT_REVOKE_SELF")
                return res.status(400).json({
                    error: "Cannot revoke permission from the file owner",
                });
            return res
                .status(500)
                .json({ error: "Failed to revoke permission" });
        }
    },

    async createFolder(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { folderName, currentPath } = req.body;
            const folderId = await fileService.createFolder(
                userId,
                folderName,
                currentPath,
            );

            return res.status(201).json({
                message: "Folder created successfully",
                folderId,
            });
        } catch (error: any) {
            console.error("Error creating folder:", error);
            if (error.message === "FOLDER_NAME_REQUIRED")
                return res
                    .status(400)
                    .json({ error: "Folder name is required" });
            if (error.message === "INVALID_FOLDER_NAME")
                return res
                    .status(400)
                    .json({ error: "Folder name cannot contain slashes" });
            return res.status(500).json({ error: "Failed to create folder" });
        }
    },

    async getStorageUsage(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const usageData = await fileService.getStorageData(userId);
            return res.status(200).json({ usage: usageData });
        } catch (error: any) {
            console.error("Error fetching storage usage:", error);
            return res
                .status(500)
                .json({ error: "Failed to retrieve storage usage" });
        }
    },

    async searchFiles(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const query = (req.query.q as string) || "";
            if (!query.trim()) {
                return res.status(400).json({ error: "Search query is required" });
            }

            const targetPath = (req.query.path as string) || undefined;
            const limit = 20;

            const files = await fileService.searchFiles(userId, query, targetPath, limit);

            return res.status(200).json({ files });
        } catch (error: any) {
            console.error("Error searching files:", error);
            return res.status(500).json({ error: "Failed to search files" });
        }
    },
};

// src/services/fileService.ts
import { db } from "../db";
import { files, filePermissions, users } from "../db/schema";
import { eq, and, not, like, desc, inArray } from "drizzle-orm";
import { s3Service } from "./s3Service";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
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

function getCategoryLabel(mimeType: string, isEncrypted: boolean): string {
    if (isEncrypted) return "encrypted";
    if (mimeType.startsWith("image/")) return "images";
    if (
        mimeType.includes("pdf") ||
        mimeType.includes("wordprocessingml") ||
        mimeType.includes("spreadsheetml") ||
        mimeType.includes("text")
    )
        return "documents";
    return "others";
}

export const fileService = {
    // 1. Get Files
    async getFilesForUser(userId: string) {
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
            .innerJoin(filePermissions, eq(files.id, filePermissions.fileId))
            .where(eq(filePermissions.userId, userId));

        return await Promise.all(
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
    },

    // 2. Get Files by Path
    async getFilesPath(userId: string, currentPath: string) {
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
            .innerJoin(filePermissions, eq(files.id, filePermissions.fileId))
            .where(eq(filePermissions.userId, userId));

        const normalizedPath = currentPath
            ? currentPath.replace(/\/+$/, "") + "/"
            : "";
        const depth = normalizedPath ? normalizedPath.split("/").length - 1 : 0;

        const filteredFiles = userFiles.filter((file) => {
            const name = file.originalName;

            if (!normalizedPath) {
                if (!name.includes("/")) return true;
                if (
                    name.endsWith("/.placeholder") &&
                    name.split("/").length === 2
                )
                    return true;
                return false;
            }

            if (name.startsWith(normalizedPath)) {
                const relativePath = name.slice(normalizedPath.length);
                if (!relativePath) return false;

                const parts = relativePath.split("/");
                if (parts.length === 1) return true;
                if (parts.length === 2 && parts[1] === ".placeholder")
                    return true;
            }

            return false;
        });

        return await Promise.all(
            filteredFiles.map(async (file) => {
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
    },

    // 3. Get Recent Files
    async getRecentFilesForUser(userId: string, limit: number) {
        const recentUserFiles = await db
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
            .innerJoin(filePermissions, eq(files.id, filePermissions.fileId))
            .where(
                and(
                    eq(filePermissions.userId, userId),
                    not(like(files.originalName, "%/.placeholder")),
                ),
            )
            .orderBy(desc(files.createdAt))
            .limit(limit);

        return await Promise.all(
            recentUserFiles.map(async (file) => {
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
    },

    // 4. Request S3 Upload URL
    async requestUploadUrl(userId: string, body: any) {
        const {
            originalName,
            fileSize,
            mimeType,
            isEncrypted,
            encryptionMetadata,
        } = body;

        if (!originalName || !fileSize || !mimeType) {
            throw new Error("MISSING_METADATA");
        }

        if (Number(fileSize) > MAX_FILE_SIZE) {
            throw new Error("FILE_TOO_LARGE");
        }

        const effectiveMimeType = isEncrypted ? "application/json" : mimeType;

        if (!ALLOWED_MIME_TYPES.includes(mimeType) && !isEncrypted) {
            throw new Error("INVALID_MIME_TYPE");
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

        return {
            fileId: newFile.id,
            uploadUrl,
            s3Key,
        };
    },

    // 5. Share File Permission
    async shareFilePermission(
        currentUserId: string,
        fileId: string,
        targetEmail: string,
    ) {
        const [file] = await db
            .select()
            .from(files)
            .where(and(eq(files.id, fileId), eq(files.userId, currentUserId)));

        if (!file) throw new Error("FORBIDDEN_NOT_OWNER");

        const [targetUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, targetEmail));

        if (!targetUser) throw new Error("TARGET_USER_NOT_FOUND");

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
    },

    // 6. Delte File or Folder
    async deleteFile(currentUserId: string, fileId: string) {
        const [targetFile] = await db
            .select()
            .from(files)
            .where(eq(files.id, fileId));

        if (!targetFile) throw new Error("FILE_NOT_FOUND");

        if (targetFile.originalName.endsWith("/.placeholder")) {
            if (targetFile.userId !== currentUserId) {
                throw new Error("ACCESS_DENIED");
            }

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
                    await db
                        .delete(filePermissions)
                        .where(
                            and(
                                eq(filePermissions.fileId, file.id),
                                eq(filePermissions.userId, currentUserId),
                            ),
                        );
                }
            }
            await db.delete(files).where(eq(files.id, fileId));
        } else {
            if (targetFile.userId !== currentUserId)
                throw new Error("ACCESS_DENIED");
            await s3Service.deleteFile(targetFile.s3Key);
            await db.delete(files).where(eq(files.id, fileId));
        }
    },

    // 7. Get S3 Downloads URL
    async getDownloadUrl(userId: string, fileId: string) {
        const [permission] = await db
            .select({
                s3Key: files.s3Key,
                originalName: files.originalName,
                isEncrypted: files.isEncrypted,
                encryptionMetadata: files.encryptionMetadata,
            })
            .from(files)
            .innerJoin(filePermissions, eq(files.id, filePermissions.fileId))
            .where(
                and(eq(files.id, fileId), eq(filePermissions.userId, userId)),
            );

        if (!permission) throw new Error("ACCESS_DENIED");

        const downloadUrl = await s3Service.getDownloadUrl(
            permission.s3Key,
            permission.originalName,
        );

        return {
            downloadUrl,
            isEncrypted: permission.isEncrypted,
            encryptionMetadata: permission.encryptionMetadata,
        };
    },

    // 8. Revoke File Permission
    async revokePermission(
        currentUserId: string,
        fileId: string,
        targetUserId: string,
    ) {
        const [file] = await db
            .select()
            .from(files)
            .where(and(eq(files.id, fileId), eq(files.userId, currentUserId)));

        if (!file) throw new Error("FORBIDDEN_NOT_OWNER");
        if (targetUserId === currentUserId)
            throw new Error("CANNOT_REVOKE_SELF");

        await db
            .delete(filePermissions)
            .where(
                and(
                    eq(filePermissions.fileId, fileId),
                    eq(filePermissions.userId, targetUserId),
                ),
            );
    },

    // 9. Create Folder
    async createFolder(
        userId: string,
        folderName: string,
        currentPath: string,
    ) {
        if (!folderName) throw new Error("FOLDER_NAME_REQUIRED");
        if (folderName.includes("/")) throw new Error("INVALID_FOLDER_NAME");

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

        return newFile.id;
    },

    // 10. Get Storage Data
    async getStorageData(userId: string) {
        const rawFiles = await db
            .select({
                fileSize: files.fileSize,
                mimeType: files.mimeType,
                isEncrypted: files.isEncrypted,
                originalName: files.originalName,
            })
            .from(files)
            .innerJoin(filePermissions, eq(files.id, filePermissions.fileId))
            .where(eq(filePermissions.userId, userId));

        const categoryMap: Record<string, number> = {};
        let totalSize = 0;

        for (const file of rawFiles) {
            if (file.originalName.endsWith("/.placeholder")) continue;

            const label = getCategoryLabel(file.mimeType, file.isEncrypted);

            categoryMap[label] = (categoryMap[label] || 0) + file.fileSize;
            totalSize += file.fileSize;
        }

        return {
            totalSize,
            categories: Object.entries(categoryMap).map(([label, size]) => ({
                label,
                size,
                percentage: totalSize > 0 ? (size / totalSize) * 100 : 0,
            })),
        };
    },
};

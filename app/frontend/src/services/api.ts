// src/services/api.ts

const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/files";

const backendUrl = `${baseUrl}/api/files`;

export interface FileItem {
    id: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
    isOwner?: boolean;
    isEncrypted?: boolean;
    downloadUrl?: string;
}

export interface UploadUrlResponse {
    fileId: string;
    uploadUrl: string;
    s3key: string;
}

export const fileApi = {
    async getMyFiles(): Promise<FileItem[]> {
        const response = await fetch(`${backendUrl}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Error: Failed to retrieve files data.");
        }

        const data = await response.json();
        return data.files;
    },

    async requestUploadUrl(metadata: {
        originalName: string;
        fileSize: number;
        mimeType: string;
        isEncrypted?: boolean;
        encryptionMetadata?: { salt: string; iv: string } | null;
    }): Promise<UploadUrlResponse> {
        const response = await fetch(`${backendUrl}/upload-url`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(metadata),
        });

        if (!response.ok) {
            throw new Error("Error: Failed to retrieve uploads URL.");
        }

        return await response.json();
    },

    async uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
        });

        if (!response.ok) {
            throw new Error("Error: Failed to upload for S3.");
        }
    },

    async GetDownloadsUrl(fileId: string): Promise<{
        downloadUrl: string;
        isEncrypted: boolean;
        encryptionMetadata: { salt: string; iv: string } | null;
    }> {
        const response = await fetch(`${backendUrl}/${fileId}/download-url`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Error: Failed to get downloads URL.");
        }

        return await response.json();
    },

    async deleteFile(fileId: string): Promise<void> {
        const response = await fetch(`${backendUrl}/${fileId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Error: Failed to delete files.");
        }
    },

    async shareFile(fileId: string, email: string): Promise<void> {
        const response = await fetch(`${backendUrl}/${fileId}/permissions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ targetEmail: email }),
        });

        if (!response.ok) {
            throw new Error("Error: Failed to grant permissions.");
        }
    },

    async revokePermission(
        fileId: string,
        targetUserId: string,
    ): Promise<void> {
        const response = await fetch(
            `${backendUrl}/${fileId}/permissions/${targetUserId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            },
        );

        if (!response.ok) {
            throw new Error("Error: Failed to delete permissions.");
        }
    },
};

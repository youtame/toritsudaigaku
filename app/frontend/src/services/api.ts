// src/services/api.ts

const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/files";

const backendUrl = `${baseUrl}/api/files`;

export interface FileItem {
    id: String;
    originalName: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
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

    async resuestUploadUrl(metadata: {
        originalName: string;
        fileSize: number;
        mimeType: string;
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

    async UploadFiles(uploadUrl: string, file: File): Promise<void> {
        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: file,
        });

        if (!response.ok) {
            throw new Error("Error: Failed to upload for S3.");
        }
    },

    async GetDownloadsUrl(fileId: string): Promise<string> {
        const response = await fetch(`${backendUrl}/download-url`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Error: Failed to get downloads URL.");
        }

        const data = await response.json();
        return data.downloadUrl;
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

    async shareFile(fileId: string, targetUserId: string): Promise<void> {
        const response = await fetch(`${backendUrl}/${fileId}/permissions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ targetUserId }),
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

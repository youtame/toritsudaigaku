// src/services/s3Service.ts
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export const s3Service = {
    // Download files(Signature URL)
    async getDownloadUrl(
        s3Key: string,
        originalName?: string,
        expiresInSeconds = 300,
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ...(originalName && {
                ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalName)}"`,
            }),
        });

        return await getSignedUrl(s3Client, command, {
            expiresIn: expiresInSeconds,
        });
    },

    // Upload files(Signature URL)
    async getUploadUrl(
        s3Key: string,
        contentType: string,
        expiresInSeconds = 300,
    ): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: contentType,
        });

        return await getSignedUrl(s3Client, command, {
            expiresIn: expiresInSeconds,
        });
    },

    // Delete iles from S3
    async deleteFile(s3Key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
        });

        await s3Client.send(command);
    },
};

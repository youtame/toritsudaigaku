import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

const s3Client = new S3Client({});

async function testUpload() {
    console.log("Bucket name: ", process.env.AWS_S3_BUCKET_NAME);

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: "test-file2.txt",
        Body: "GeniusRailway",
        ContentType: "text/plain",
    });

    try {
        console.log("S3 upload...");
        const response = await s3Client.send(command);
        console.log("\nUpload!", response.$metadata.httpStatusCode);
    } catch (error) {
        console.error("\nUpload failed");
        console.error(error);
    }
}

testUpload();

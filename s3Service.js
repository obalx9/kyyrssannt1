import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || 'kursat-files';

export async function uploadToS3(fileBuffer, fileName, mimeType) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    return getS3PublicUrl(fileName);
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

export async function deleteFromS3(fileName) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
}

export function getS3PublicUrl(fileName) {
  const endpoint = process.env.S3_ENDPOINT || `https://${BUCKET_NAME}.s3.amazonaws.com`;
  return `${endpoint}/${fileName}`;
}

export async function downloadTelegramFileToS3(fileBuffer, fileName, mimeType) {
  return uploadToS3(fileBuffer, `telegram/${fileName}`, mimeType);
}

export async function setupS3Cors() {
  console.log('S3 CORS configuration skipped - configure in S3 console');
}

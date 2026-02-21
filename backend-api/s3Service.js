import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT;

export const uploadToS3 = async (filename, buffer, contentType) => {
  try {
    const key = `media/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const publicUrl = `${S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
    return { key, url: publicUrl };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

export const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
};

export const getS3SignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw error;
  }
};

export const getS3PublicUrl = (key) => {
  return `${S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
};

export const downloadTelegramFileToS3 = async (fileId, botToken, filename, contentType) => {
  try {
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    const getFileResponse = await fetch(getFileUrl);
    const fileInfo = await getFileResponse.json();

    if (!fileInfo.ok) {
      throw new Error(`Failed to get Telegram file info: ${fileInfo.description}`);
    }

    const filePath = fileInfo.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file from Telegram: ${fileResponse.statusText}`);
    }

    const buffer = await fileResponse.arrayBuffer();
    const key = `media/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const publicUrl = `${S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
    return { key, url: publicUrl, fileSize: buffer.byteLength };
  } catch (error) {
    console.error('Telegram to S3 download error:', error);
    throw error;
  }
};

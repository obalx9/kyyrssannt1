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

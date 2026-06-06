import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;
const BASE_URL = process.env.S3_BASE_URL!;

export async function uploadAudio(frameId: string, buffer: Buffer): Promise<string> {
  const key = `audio/frames/${frameId}.mp3`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg',
  }));
  return `${BASE_URL}/${key}`;
}

export async function uploadImage(frameId: string, buffer: Buffer, ext: string): Promise<string> {
  const key = `images/frames/${frameId}.${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: `image/${ext}`,
  }));
  return `${BASE_URL}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

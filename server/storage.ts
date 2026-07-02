// Storage helpers - uses AWS S3 for Railway deployment
// Upload images to S3, return public CDN or presigned URLs.

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getS3Client() {
  if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.awsRegion || !ENV.awsS3Bucket) {
    throw new Error(
      "Storage config missing: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET"
    );
  }
  return new S3Client({
    region: ENV.awsRegion,
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
  });
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const s3 = getS3Client();
  const key = appendHashSuffix(relKey.replace(/^\/+/, ""));
  const bucket = ENV.awsS3Bucket!;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: typeof data === "string" ? Buffer.from(data) : data,
      ContentType: contentType,
    })
  );

  const url = ENV.awsCdnUrl
    ? `${ENV.awsCdnUrl.replace(/\/+$/, "")}/${key}`
    : `https://${bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;

  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const bucket = ENV.awsS3Bucket!;
  const url = ENV.awsCdnUrl
    ? `${ENV.awsCdnUrl.replace(/\/+$/, "")}/${key}`
    : `https://${bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
  return { key, url };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const s3 = getS3Client();
  const key = relKey.replace(/^\/+/, "");
  const command = new GetObjectCommand({ Bucket: ENV.awsS3Bucket!, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

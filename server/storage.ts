// Storage helpers - uses Cloudinary for image hosting
import { ENV } from "./_core/env";

function getCloudinaryConfig() {
  if (!ENV.cloudinaryCloudName || !ENV.cloudinaryApiKey || !ENV.cloudinaryApiSecret) {
    throw new Error("Cloudinary config missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  }
  return {
    cloudName: ENV.cloudinaryCloudName,
    apiKey: ENV.cloudinaryApiKey,
    apiSecret: ENV.cloudinaryApiSecret,
  };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  // Convert to base64 data URI
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const base64 = buffer.toString("base64");
  const dataUri = `data:${contentType};base64,${base64}`;

  // Use folder from relKey (e.g. "products/filename.jpg" -> folder "products")
  const parts = relKey.replace(/^\/+/, "").split("/");
  const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "jewel-gallery";

  // Upload via Cloudinary REST API
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateSignature({ folder, timestamp }, apiSecret);

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("folder", folder);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const result = await response.json() as { public_id: string; secure_url: string };
  return { key: result.public_id, url: result.secure_url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const { cloudName } = getCloudinaryConfig();
  const key = relKey.replace(/^\/+/, "");
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/${key}`;
  return { key, url };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { url } = await storageGet(relKey);
  return url;
}

async function generateSignature(params: Record<string, string | number>, apiSecret: string): Promise<string> {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  const str = sorted + apiSecret;
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

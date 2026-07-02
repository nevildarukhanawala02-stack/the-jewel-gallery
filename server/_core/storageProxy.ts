import type { Express } from "express";

// Storage is now served directly via S3 CDN URLs embedded in the DB.
// No proxy route needed for Railway deployment.
export function registerStorageProxy(_app: Express) {
  // No-op: images are served via S3/CDN URLs stored in the database.
  // Previously proxied /manus-storage/* routes are no longer needed.
}

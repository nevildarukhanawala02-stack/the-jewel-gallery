import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ── One-time admin setup (creates/resets admin password) ───────────────────
  // Protected by ADMIN_SETUP_SECRET env var. Run once then remove or keep secret.
  app.post("/api/admin/setup", async (req, res) => {
    const { secret, email, password, name } = req.body as {
      secret?: string; email?: string; password?: string; name?: string;
    };
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret || secret !== setupSecret) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (!email || !password || password.length < 8) {
      res.status(400).json({ error: "email and password (min 8 chars) required" });
      return;
    }
    try {
      const { sdk } = await import("./sdk");
      const { upsertUser } = await import("../db");
      const passwordHash = await sdk.hashPassword(password);
      const openId = `admin_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      await upsertUser({
        openId,
        email: email.toLowerCase().trim(),
        name: name || "Admin",
        loginMethod: "password",
        role: "admin",
        passwordHash,
        lastSignedIn: new Date(),
      });
      console.log(`[Admin Setup] Admin created/updated: ${email}`);
      res.json({ success: true, message: `Admin account set up for ${email}` });
    } catch (err) {
      console.error("[Admin Setup] Failed:", err);
      res.status(500).json({ error: "Setup failed" });
    }
  });

  // Hero image upload endpoint (admin only — requires valid Manus session cookie)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post("/api/upload-hero", upload.single("file"), async (req, res) => {
    try {
      // Verify the request comes from an authenticated admin via the same context as tRPC
      const ctx = await createContext({ req: req as any, res: res as any, info: {} as any });
      if (!ctx.user || ctx.user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }
      const ext = req.file.originalname.split(".").pop() ?? "jpg";
      const key = `hero_${Date.now()}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch (err) {
      console.error("[upload-hero]", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

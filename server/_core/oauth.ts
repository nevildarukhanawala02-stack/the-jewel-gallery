/**
 * Admin auth routes - replaces Manus OAuth callback.
 * POST /api/admin/login  → email + password → JWT session cookie
 * POST /api/admin/logout → clears cookie
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  // ── Admin login ────────────────────────────────────────────
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      // Look up admin user by email
      const user = await db.getAdminByEmail(email.toLowerCase().trim());

      if (!user || user.role !== "admin") {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Verify password
      if (!user.passwordHash) {
        res.status(401).json({ error: "Account not set up for password login" });
        return;
      }

      const valid = await sdk.verifyPassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || email,
        expiresInMs: ONE_YEAR_MS,
      });

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, name: user.name, role: user.role });
    } catch (error) {
      console.error("[Admin Login] Failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ── Admin logout ───────────────────────────────────────────
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // ── Keep old callback path alive (redirects to home) ──────
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect("/");
  });
}

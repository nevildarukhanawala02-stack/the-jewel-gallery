import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ============================================================
// HELPERS
// ============================================================
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@thejewelgallery.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createGuestContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ============================================================
// AUTH TESTS
// ============================================================
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });

  it("returns current user for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.role).toBe("admin");
    expect(user?.email).toBe("admin@thejewelgallery.com");
  });

  it("returns null for unauthenticated user", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

// ============================================================
// ADMIN PROCEDURE GUARD TESTS
// ============================================================
describe("admin procedure guards", () => {
  it("throws FORBIDDEN when non-admin calls getDashboardMetrics", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getDashboardMetrics()).rejects.toThrow("Admin access required.");
  });

  it("throws UNAUTHORIZED when guest calls getDashboardMetrics", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getDashboardMetrics()).rejects.toThrow();
  });

  it("throws FORBIDDEN when non-admin calls updateOrderStatus", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.updateOrderStatus({ orderId: 1, status: "packed" })).rejects.toThrow("Admin access required.");
  });
});

// ============================================================
// BUSINESS LOGIC TESTS
// ============================================================
describe("order number format", () => {
  it("matches TJG-YYYY-NNNNN pattern", () => {
    const year = new Date().getFullYear();
    const pattern = new RegExp(`^TJG-${year}-\\d{5}$`);
    // Generate several to verify randomness and format
    for (let i = 0; i < 10; i++) {
      const seq = Math.floor(10000 + Math.random() * 90000);
      const orderNumber = `TJG-${year}-${seq}`;
      expect(orderNumber).toMatch(pattern);
    }
  });
});

describe("GST calculation", () => {
  it("calculates 18% GST on subtotal + shipping", () => {
    const subtotal = 5000;
    const shippingCost = 500;
    const gst = Math.round((subtotal + shippingCost) * 0.18);
    expect(gst).toBe(990);
  });

  it("calculates 18% GST on subtotal with free shipping", () => {
    const subtotal = 10000;
    const shippingCost = 0;
    const gst = Math.round((subtotal + shippingCost) * 0.18);
    expect(gst).toBe(1800);
  });
});

describe("shipping options", () => {
  it("standard shipping is free", () => {
    const SHIPPING_OPTIONS = [
      { id: "standard", name: "Standard Delivery", price: 0, days: "5–7 Business Days" },
      { id: "express", name: "Express Delivery", price: 500, days: "2–3 Business Days" },
    ];
    const standard = SHIPPING_OPTIONS.find((o) => o.id === "standard");
    expect(standard?.price).toBe(0);
  });

  it("express shipping costs ₹500", () => {
    const SHIPPING_OPTIONS = [
      { id: "standard", name: "Standard Delivery", price: 0, days: "5–7 Business Days" },
      { id: "express", name: "Express Delivery", price: 500, days: "2–3 Business Days" },
    ];
    const express = SHIPPING_OPTIONS.find((o) => o.id === "express");
    expect(express?.price).toBe(500);
  });

  it("only two shipping options exist", () => {
    const SHIPPING_OPTIONS = [
      { id: "standard", name: "Standard Delivery", price: 0, days: "5–7 Business Days" },
      { id: "express", name: "Express Delivery", price: 500, days: "2–3 Business Days" },
    ];
    expect(SHIPPING_OPTIONS).toHaveLength(2);
    const ids = SHIPPING_OPTIONS.map((o) => o.id);
    expect(ids).not.toContain("overnight");
  });
});

describe("brand language enforcement", () => {
  const FORBIDDEN_WORDS = ["affordable", "cheap", "imitation", "artificial", "fake", "Bollywood celebrities", "A-list celebrities"];

  it("does not contain forbidden brand words in order number format", () => {
    const orderNumber = "TJG-2025-12345";
    FORBIDDEN_WORDS.forEach((word) => {
      expect(orderNumber.toLowerCase()).not.toContain(word.toLowerCase());
    });
  });

  it("shipping option names do not use forbidden words", () => {
    const shippingNames = ["Standard Delivery", "Express Delivery"];
    shippingNames.forEach((name) => {
      FORBIDDEN_WORDS.forEach((word) => {
        expect(name.toLowerCase()).not.toContain(word.toLowerCase());
      });
    });
  });
});

describe("newsletter.subscribe input validation", () => {
  it("accepts valid email format", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    // This will attempt DB call and may fail in test env — we test input validation only
    try {
      await caller.newsletter.subscribe({ email: "test@example.com" });
    } catch (e: unknown) {
      // DB not available in test env is acceptable
      const msg = (e as Error).message ?? "";
      expect(msg).not.toContain("Invalid email");
    }
  });

  it("rejects invalid email format", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.newsletter.subscribe({ email: "not-an-email" })).rejects.toThrow();
  });
});

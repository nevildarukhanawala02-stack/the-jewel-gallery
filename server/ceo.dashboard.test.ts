import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(role?: "admin" | "user" | null): TrpcContext {
  const user = role
    ? {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus" as const,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

const now = Date.now();
const range = { startAt: now - 86400000 * 30, endAt: now };

describe("CEO Command Centre — auth guards", () => {
  it("getCeoMetrics rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.admin.getCeoMetrics(range)).rejects.toThrow();
  });

  it("getCeoMetrics rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.getCeoMetrics(range)).rejects.toThrow();
  });

  it("getCeoAlerts rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.admin.getCeoAlerts()).rejects.toThrow();
  });

  it("getCeoAlerts rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.getCeoAlerts()).rejects.toThrow();
  });

  it("getInventoryHealth rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.admin.getInventoryHealth()).rejects.toThrow();
  });

  it("getFulfilmentMetrics rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.admin.getFulfilmentMetrics(range)).rejects.toThrow();
  });

  it("getRevenueByDay rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.admin.getRevenueByDay(range)).rejects.toThrow();
  });

  it("getTopProducts rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.admin.getTopProducts(range)).rejects.toThrow();
  });

  it("getRevenueByCategory rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.admin.getRevenueByCategory(range)).rejects.toThrow();
  });
});

describe("CEO Command Centre — input validation", () => {
  it("getCeoMetrics rejects non-numeric startAt", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    // @ts-expect-error intentional wrong type
    await expect(caller.admin.getCeoMetrics({ startAt: "bad", endAt: now })).rejects.toThrow();
  });

  it("getFulfilmentMetrics rejects non-numeric endAt", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    // @ts-expect-error intentional wrong type
    await expect(caller.admin.getFulfilmentMetrics({ startAt: now, endAt: "bad" })).rejects.toThrow();
  });
});

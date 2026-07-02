import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "admin" | "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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

function createUnauthCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("celebrities admin procedures — access control", () => {
  it("adminList is blocked for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthCtx());
    await expect(caller.celebrities.adminList()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("adminList is blocked for non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.celebrities.adminList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("getAssignedProductIds is blocked for non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(
      caller.celebrities.getAssignedProductIds({ celebrityId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("assignProduct is blocked for non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(
      caller.celebrities.assignProduct({ celebrityId: 1, productId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("unassignProduct is blocked for non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(
      caller.celebrities.unassignProduct({ celebrityId: 1, productId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("celebrities public procedures — open access", () => {
  it("list is accessible without authentication", async () => {
    const caller = appRouter.createCaller(createUnauthCtx());
    // Should not throw — returns an array (may be empty in test env)
    const result = await caller.celebrities.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

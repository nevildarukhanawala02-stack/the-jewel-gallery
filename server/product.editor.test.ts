import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ── Mock the DB helper ───────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    updateProductFull: vi.fn().mockResolvedValue({ success: true }),
  };
});

// ── Mock storage ─────────────────────────────────────────────────────────────
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "products/1/test.jpg", url: "/manus-storage/products/1/test.jpg" }),
}));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeAdminCtx(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "owner-open-id",
    email: "admin@jewel.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { cookies: {}, headers: {} } as never,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as never,
  };
}

function makeUserCtx(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "user-open-id",
    email: "user@jewel.com",
    name: "User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { cookies: {}, headers: {} } as never,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as never,
  };
}

function makeAnonCtx(): TrpcContext {
  return {
    user: null,
    req: { cookies: {}, headers: {} } as never,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as never,
  };
}

describe("admin.updateProductFull", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(
      caller.admin.updateProductFull({ id: 1, name: "Test" })
    ).rejects.toThrow();
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.admin.updateProductFull({ id: 1, name: "Test" })
    ).rejects.toThrow();
  });

  it("calls updateProductFull with correct id and fields", async () => {
    const { updateProductFull } = await import("./db");
    const caller = appRouter.createCaller(makeAdminCtx());
    await caller.admin.updateProductFull({
      id: 42,
      name: "Golden Bloom",
      price: 8500,
      stock: 10,
      isActive: true,
      isBestseller: false,
    });
    expect(updateProductFull).toHaveBeenCalledWith(42, expect.objectContaining({
      name: "Golden Bloom",
      price: 8500,
      stock: 10,
      isActive: true,
      isBestseller: false,
    }));
  });

  it("accepts images and imageTypes arrays", async () => {
    const { updateProductFull } = await import("./db");
    const caller = appRouter.createCaller(makeAdminCtx());
    await caller.admin.updateProductFull({
      id: 5,
      images: ["/manus-storage/img1.jpg", "/manus-storage/img2.jpg"],
      imageTypes: ["product", "model"],
    });
    expect(updateProductFull).toHaveBeenCalledWith(5, expect.objectContaining({
      images: ["/manus-storage/img1.jpg", "/manus-storage/img2.jpg"],
      imageTypes: ["product", "model"],
    }));
  });

  it("returns success: true on valid update", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.updateProductFull({ id: 1, name: "Updated" });
    expect(result).toEqual({ success: true });
  });

  it("validates imageTypes enum — rejects invalid type", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.admin.updateProductFull({
        id: 1,
        imageTypes: ["invalid_type" as never],
      })
    ).rejects.toThrow();
  });

  it("validates category enum — rejects invalid category", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.admin.updateProductFull({
        id: 1,
        category: "watches" as never,
      })
    ).rejects.toThrow();
  });
});

describe("admin.uploadProductImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(
      caller.admin.uploadProductImage({ productId: 1, base64: "abc", mimeType: "image/jpeg", filename: "test.jpg" })
    ).rejects.toThrow();
  });

  it("returns a url on successful upload", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.uploadProductImage({
      productId: 1,
      base64: Buffer.from("fake-image-bytes").toString("base64"),
      mimeType: "image/jpeg",
      filename: "ring.jpg",
    });
    expect(result.url).toMatch(/manus-storage/);
  });

  it("uses the correct storage key format", async () => {
    const { storagePut } = await import("./storage");
    const caller = appRouter.createCaller(makeAdminCtx());
    await caller.admin.uploadProductImage({
      productId: 7,
      base64: Buffer.from("data").toString("base64"),
      mimeType: "image/png",
      filename: "bracelet.png",
    });
    expect(storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^products\/7\//),
      expect.any(Buffer),
      "image/png"
    );
  });
});

import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as jose from "jose";
import Razorpay from "razorpay";
import { z } from "zod";
import {
  addCustomerAddress,
  createCustomer,
  createOrder,
  createProduct,
  getAllOrders,
  getAllProductsAdmin,
  getCelebrities,
  getCelebrityBySlug,
  getCelebrityProducts,
  getCustomerAddresses,
  getCustomerByEmail,
  getCustomerById,
  getDashboardMetrics,
  getLowStockProducts,
  getOrderById,
  getOrderItems,
  getOrdersByCustomer,
  getProductById,
  getProductBySlug,
  getProducts,
  subscribeNewsletter,
  updateCustomer,
  updateOrderPayment,
  updateOrderStatus,
  updateOrderTracking,
  updateProduct,
  decrementProductStock,
  getExistingSkus,
  bulkImportSkus,
  logSkuImport,
  getSkuImportLogs,
  type SkuRow,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// ============================================================
// CUSTOMER JWT HELPERS
// ============================================================
// Use the platform JWT_SECRET — it is always injected in production.
// In local dev without env, fall back to a non-empty placeholder so the
// server starts, but tokens signed with it will be invalid in production.
const CUSTOMER_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? `tjg-dev-only-${Date.now()}`
);

async function signCustomerToken(customerId: number): Promise<string> {
  return new jose.SignJWT({ sub: String(customerId), type: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(CUSTOMER_JWT_SECRET);
}

async function verifyCustomerToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jose.jwtVerify(token, CUSTOMER_JWT_SECRET);
    if (payload.type !== "customer") return null;
    return parseInt(String(payload.sub), 10);
  } catch {
    return null;
  }
}

// ============================================================
// RAZORPAY INSTANCE
// ============================================================
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ============================================================
// PRODUCTS ROUTER
// ============================================================
const productsRouter = router({
  list: publicProcedure
    .input(z.object({
      category: z.enum(["rings", "necklaces", "earrings", "bracelets"]).optional(),
      subcategory: z.string().optional(),
      collection: z.string().optional(),
      isFeatured: z.boolean().optional(),
      isNewArrival: z.boolean().optional(),
      isBestseller: z.boolean().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional())
    .query(async ({ input }) => {
      return getProducts({ isActive: true, ...input });
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await getProductBySlug(input.slug);
      if (!product || !product.isActive) throw new TRPCError({ code: "NOT_FOUND" });
      return product;
    }),

  related: publicProcedure
    .input(z.object({ category: z.enum(["rings", "necklaces", "earrings", "bracelets"]), excludeId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const all = await getProducts({ category: input.category, isActive: true, limit: input.limit ?? 4 });
      return all.filter((p) => p.id !== input.excludeId).slice(0, input.limit ?? 4);
    }),
});

// ============================================================
// CELEBRITIES ROUTER
// ============================================================
const celebritiesRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getCelebrities({ isActive: true, limit: input?.limit });
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const celebrity = await getCelebrityBySlug(input.slug);
      if (!celebrity) throw new TRPCError({ code: "NOT_FOUND" });
      const linkedProducts = await getCelebrityProducts(celebrity.id);
      return { celebrity, products: linkedProducts };
    }),
});

// ============================================================
// CUSTOMER AUTH ROUTER
// ============================================================
const customerAuthRouter = router({
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const existing = await getCustomerByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const customer = await createCustomer({ name: input.name, email: input.email, phone: input.phone, passwordHash });
      if (!customer) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const token = await signCustomerToken(customer.id);
      return { token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const customer = await getCustomerByEmail(input.email);
      if (!customer || !customer.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      const valid = await bcrypt.compare(input.password, customer.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      const token = await signCustomerToken(customer.id);
      return { token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } };
    }),

  me: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const customerId = await verifyCustomerToken(input.token);
      if (!customerId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const customer = await getCustomerById(customerId);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone };
    }),

  updateProfile: publicProcedure
    .input(z.object({ token: z.string(), name: z.string().optional(), phone: z.string().optional() }))
    .mutation(async ({ input }) => {
      const customerId = await verifyCustomerToken(input.token);
      if (!customerId) throw new TRPCError({ code: "UNAUTHORIZED" });
      await updateCustomer(customerId, { name: input.name, phone: input.phone });
      return { success: true };
    }),

  addAddress: publicProcedure
    .input(z.object({
      token: z.string(),
      firstName: z.string(), lastName: z.string(),
      email: z.string().optional(), phone: z.string().optional(),
      streetAddress: z.string(), city: z.string(), state: z.string(),
      postalCode: z.string(), isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const customerId = await verifyCustomerToken(input.token);
      if (!customerId) throw new TRPCError({ code: "UNAUTHORIZED" });
      await addCustomerAddress({ ...input, customerId });
      return { success: true };
    }),

  getAddresses: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const customerId = await verifyCustomerToken(input.token);
      if (!customerId) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getCustomerAddresses(customerId);
    }),
});

// ============================================================
// ORDERS ROUTER
// ============================================================
const ordersRouter = router({
  create: publicProcedure
    .input(z.object({
      token: z.string().optional(),
      items: z.array(z.object({
        productId: z.number().optional(),
        quantity: z.number().min(1),
        price: z.number(),
      })),
      shippingAddress: z.object({
        firstName: z.string(), lastName: z.string(),
        email: z.string().optional(), phone: z.string().optional(),
        streetAddress: z.string(), city: z.string(), state: z.string(), postalCode: z.string(),
      }),
      shippingMethod: z.enum(["standard", "express"]),
    }))
    .mutation(async ({ input }) => {
      // ── Server-side total calculation (never trust client amounts) ──
      const SHIPPING_COSTS: Record<string, number> = { standard: 0, express: 500 };
      const shippingCost = SHIPPING_COSTS[input.shippingMethod] ?? 0;
      const subtotalCalc = input.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const gstAmount = Math.round((subtotalCalc + shippingCost) * 0.18);
      const totalAmount = subtotalCalc + shippingCost + gstAmount;
      let customerId: number | undefined;
      let customerName: string | undefined;
      let customerEmail: string | undefined;
      let customerPhone: string | undefined;

      if (input.token) {
        const cid = await verifyCustomerToken(input.token);
        if (cid) {
          const customer = await getCustomerById(cid);
          if (customer) {
            customerId = customer.id;
            customerName = customer.name ?? undefined;
            customerEmail = customer.email;
            customerPhone = customer.phone ?? undefined;
          }
        }
      }

      // Resolve product details for items
      const resolvedItems = await Promise.all(input.items.map(async (item) => {
        let productName = "Jewellery Piece";
        let productSlug: string | undefined;
        let productImage: string | undefined;
        let collection: string | undefined;
        if (item.productId) {
          const product = await getProductById(item.productId);
          if (product) {
            productName = product.name;
            productSlug = product.slug;
            productImage = Array.isArray(product.images) ? product.images[0] : undefined;
            collection = product.collection ?? undefined;
          }
        }
        return { ...item, productName, productSlug, productImage, collection };
      }));

      // Create Razorpay order if configured
      const rzp = getRazorpay();
      let razorpayOrderId: string | undefined;
      const razorpayKey = process.env.RAZORPAY_KEY_ID ?? "";

      if (rzp) {
        const rzpOrder = await rzp.orders.create({
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          receipt: `TJG-${Date.now()}`,
        });
        razorpayOrderId = rzpOrder.id;
      }

      const order = await createOrder({
        customerId,
        customerName: customerName ?? `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`,
        customerEmail: customerEmail ?? input.shippingAddress.email,
        customerPhone: customerPhone ?? input.shippingAddress.phone,
        shippingAddress: input.shippingAddress,
        shippingMethod: input.shippingMethod,
        shippingCost,
        gstAmount,
        subtotal: subtotalCalc,
        totalAmount,
        razorpayOrderId,
        items: resolvedItems,
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrderId ?? null,
        razorpayKey,
        // Return server-calculated amounts so the client can display them
        subtotal: subtotalCalc,
        shippingCost,
        gstAmount,
        totalAmount,
      };
    }),

  verifyPayment: publicProcedure
    .input(z.object({
      orderId: z.number(),
      razorpayPaymentId: z.string(),
      razorpayOrderId: z.string(),
      razorpaySignature: z.string(),
    }))
    .mutation(async ({ input }) => {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keySecret) {
        // Verify signature
        const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
        const expectedSignature = crypto
          .createHmac("sha256", keySecret)
          .update(body)
          .digest("hex");
        if (expectedSignature !== input.razorpaySignature) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment signature verification failed." });
        }
      }
      await updateOrderPayment(input.orderId, {
        paymentStatus: "paid",
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
      });

      // Decrement stock for each item after confirmed payment
      const order = await getOrderById(input.orderId);
      if (order) {
        const items = await getOrderItems(input.orderId);
        for (const item of items) {
          if (item.productId) {
            await decrementProductStock(item.productId, item.quantity);
          }
        }
      }

      return { success: true };
    }),

  myOrders: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const customerId = await verifyCustomerToken(input.token);
      if (!customerId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const customerOrders = await getOrdersByCustomer(customerId);
      return Promise.all(customerOrders.map(async (order) => {
        const items = await getOrderItems(order.id);
        return { ...order, items };
      }));
    }),
});

// ============================================================
// ADMIN ROUTER
// ============================================================
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  return next({ ctx });
});

const adminRouter = router({
  getDashboardMetrics: adminProcedure.query(async () => {
    return getDashboardMetrics();
  }),

  getRecentOrders: adminProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const allOrders = await getAllOrders({ limit: input.limit ?? 10 });
      return allOrders.map((o) => ({
        ...o,
        shippingAddress: o.shippingStreet ? {
          firstName: o.shippingFirstName,
          lastName: o.shippingLastName,
          streetAddress: o.shippingStreet,
          city: o.shippingCity,
          state: o.shippingState,
          postalCode: o.shippingPostalCode,
          phone: o.customerPhone,
        } : null,
        subtotalAmount: o.subtotal,
        paymentMethod: "Razorpay",
      }));
    }),

  getAllOrders: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "packed", "shipped", "out_for_delivery", "delivered", "returned"]).optional(),
    }))
    .query(async ({ input }) => {
      const allOrders = await getAllOrders({ status: input.status });
      return allOrders.map((o) => ({
        ...o,
        shippingAddress: o.shippingStreet ? {
          firstName: o.shippingFirstName,
          lastName: o.shippingLastName,
          streetAddress: o.shippingStreet,
          city: o.shippingCity,
          state: o.shippingState,
          postalCode: o.shippingPostalCode,
          phone: o.customerPhone,
        } : null,
        subtotalAmount: o.subtotal,
        paymentMethod: "Razorpay",
      }));
    }),

  updateOrderStatus: adminProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(["pending", "packed", "shipped", "out_for_delivery", "delivered", "returned"]),
    }))
    .mutation(async ({ input }) => {
      await updateOrderStatus(input.orderId, input.status);
      return { success: true };
    }),

  updateOrderTracking: adminProcedure
    .input(z.object({
      orderId: z.number(),
      trackingNumber: z.string(),
      courierName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateOrderTracking(input.orderId, input.trackingNumber, input.courierName);
      return { success: true };
    }),

  getLowStockProducts: adminProcedure
    .input(z.object({ threshold: z.number().default(5) }))
    .query(async ({ input }) => {
      return getLowStockProducts(input.threshold);
    }),

  getAllProducts: adminProcedure
    .input(z.object({
      category: z.enum(["rings", "necklaces", "earrings", "bracelets"]).optional(),
    }))
    .query(async ({ input }) => {
      return getAllProductsAdmin({ category: input.category });
    }),

  updateProduct: adminProcedure
    .input(z.object({
      id: z.number(),
      price: z.number().optional(),
      stock: z.number().optional(),
      isActive: z.boolean().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      isFeatured: z.boolean().optional(),
      isNewArrival: z.boolean().optional(),
      isBestseller: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateProduct(id, data);
      return { success: true };
    }),

  createProduct: adminProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      category: z.enum(["rings", "necklaces", "earrings", "bracelets"]),
      collection: z.string().optional(),
      price: z.number(),
      stock: z.number().optional(),
      material: z.string().optional(),
      description: z.string().optional(),
      sku: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createProduct(input);
    }),

  // ────────────────────────────────────────────────────────────
  // SKU BULK IMPORT
  // ────────────────────────────────────────────────────────────

  /** Return all existing SKUs for client-side dedup preview */
  getExistingSkus: adminProcedure.query(async () => {
    return getExistingSkus();
  }),

  /** Preview: parse rows sent from client, flag new vs duplicate */
  previewSkuImport: adminProcedure
    .input(z.object({
      rows: z.array(z.object({
        date: z.string().optional(),
        sku: z.string(),
        title: z.string(),
        category: z.string(),
        subCategory: z.string().optional(),
        description: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const existingSkus = await getExistingSkus();
      const existingSet = new Set(existingSkus);
      return input.rows.map((row) => ({
        ...row,
        isDuplicate: existingSet.has(row.sku.trim()),
        isValid: !!(row.sku?.trim() && row.title?.trim() && row.category?.trim()),
      }));
    }),

  /** Confirm import: insert only new, non-duplicate rows */
  importSkus: adminProcedure
    .input(z.object({
      filename: z.string(),
      rows: z.array(z.object({
        date: z.string().optional(),
        sku: z.string(),
        title: z.string(),
        category: z.string(),
        subCategory: z.string().optional(),
        description: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const existingSkus = await getExistingSkus();
      const existingSet = new Set(existingSkus);

      const validRows: SkuRow[] = input.rows
        .filter((r) => r.sku?.trim() && r.title?.trim() && r.category?.trim())
        .map((r) => ({
          date: r.date,
          sku: r.sku.trim(),
          title: r.title.trim(),
          category: r.category.trim(),
          subCategory: r.subCategory?.trim(),
          description: r.description?.trim(),
          imageUrls: r.imageUrls,
        }));

      const result = await bulkImportSkus(validRows, existingSet);

      // Log the import
      const status = result.skipped > 0 && result.imported === 0
        ? "failed"
        : result.skipped > 0
        ? "partial"
        : "success";

      await logSkuImport({
        filename: input.filename,
        uploadedBy: ctx.user.name ?? ctx.user.email ?? "Admin",
        totalRows: input.rows.length,
        newRows: result.imported,
        duplicateRows: result.duplicates,
        skippedRows: result.skipped,
        importedSkus: result.importedSkus,
        duplicateSkus: result.duplicateSkus,
        status,
        errorMessage: result.errors.length > 0 ? result.errors.join("\n") : undefined,
      });

      return {
        imported: result.imported,
        duplicates: result.duplicates,
        skipped: result.skipped,
        importedSkus: result.importedSkus,
        duplicateSkus: result.duplicateSkus,
        errors: result.errors,
      };
    }),

  /** Return recent import logs */
  getSkuImportLogs: adminProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getSkuImportLogs(input.limit ?? 20);
    }),
});

// ============================================================
// NEWSLETTER ROUTER
// ============================================================
const newsletterRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await subscribeNewsletter(input.email);
      return { success: true };
    }),
});

// ============================================================
// MAIN APP ROUTER
// ============================================================
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  products: productsRouter,
  celebrities: celebritiesRouter,
  customerAuth: customerAuthRouter,
  orders: ordersRouter,
  admin: adminRouter,
  newsletter: newsletterRouter,
});

export type AppRouter = typeof appRouter;

import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  celebrities,
  celebrityProducts,
  customerAddresses,
  customers,
  newsletterSubscribers,
  orderItems,
  orders,
  products,
  skuImportLogs,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================
// USER HELPERS (Manus OAuth)
// ============================================================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// PRODUCT HELPERS
// ============================================================
export async function getProducts(opts: {
  category?: "rings" | "necklaces" | "earrings" | "bracelets";
  subcategory?: string;
  collection?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.category) conditions.push(eq(products.category, opts.category));
  if (opts.subcategory) conditions.push(eq(products.subcategory, opts.subcategory));
  if (opts.collection) conditions.push(eq(products.collection, opts.collection));
  if (opts.isFeatured !== undefined) conditions.push(eq(products.isFeatured, opts.isFeatured));
  if (opts.isNewArrival !== undefined) conditions.push(eq(products.isNewArrival, opts.isNewArrival));
  if (opts.isBestseller !== undefined) conditions.push(eq(products.isBestseller, opts.isBestseller));
  if (opts.isActive !== undefined) conditions.push(eq(products.isActive, opts.isActive));
  const query = db.select().from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  return query;
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: {
  name: string; slug: string; category: "rings" | "necklaces" | "earrings" | "bracelets";
  collection?: string; price: number; stock?: number; material?: string;
  description?: string; sku?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(products).values({
    name: data.name, slug: data.slug, category: data.category,
    collection: data.collection, price: String(data.price),
    stock: data.stock ?? 0, material: data.material,
    description: data.description,
  });
  const result = await db.select().from(products).where(eq(products.slug, data.slug)).limit(1);
  return result[0];
}

export async function updateProduct(id: number, data: {
  price?: number; stock?: number; isActive?: boolean; name?: string;
  description?: string; isFeatured?: boolean; isNewArrival?: boolean; isBestseller?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.price !== undefined) updateData.price = String(data.price);
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
  if (data.isNewArrival !== undefined) updateData.isNewArrival = data.isNewArrival;
  if (data.isBestseller !== undefined) updateData.isBestseller = data.isBestseller;
  if (Object.keys(updateData).length > 0) {
    await db.update(products).set(updateData).where(eq(products.id, id));
  }
}

export async function getLowStockProducts(threshold: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(lte(products.stock, threshold)).orderBy(products.stock);
}

// ============================================================
// CELEBRITY HELPERS
// ============================================================
export async function getCelebrities(opts: { isActive?: boolean; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.isActive !== undefined) conditions.push(eq(celebrities.isActive, opts.isActive));
  return db.select().from(celebrities)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(celebrities.name)
    .limit(opts.limit ?? 50);
}

export async function getCelebrityBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(celebrities).where(eq(celebrities.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCelebrityProducts(celebrityId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    cp: celebrityProducts,
    product: products,
  }).from(celebrityProducts)
    .innerJoin(products, eq(celebrityProducts.productId, products.id))
    .where(eq(celebrityProducts.celebrityId, celebrityId));
  return rows;
}

// ============================================================
// CUSTOMER HELPERS (storefront JWT auth)
// ============================================================
export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(data: {
  name: string; email: string; phone?: string; passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customers).values({
    name: data.name, email: data.email, phone: data.phone, passwordHash: data.passwordHash,
  });
  return getCustomerByEmail(data.email);
}

export async function updateCustomer(id: number, data: {
  name?: string; phone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (Object.keys(updateData).length > 0) {
    await db.update(customers).set(updateData).where(eq(customers.id, id));
  }
}

export async function getCustomerAddresses(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customerId));
}

export async function addCustomerAddress(data: {
  customerId: number; firstName: string; lastName: string; email?: string;
  phone?: string; streetAddress: string; city: string; state: string;
  postalCode: string; isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.isDefault) {
    await db.update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, data.customerId));
  }
  await db.insert(customerAddresses).values(data);
}

// ============================================================
// ORDER HELPERS
// ============================================================
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `TJG-${year}-${seq}`;
}

export async function createOrder(data: {
  customerId?: number;
  customerName?: string; customerEmail?: string; customerPhone?: string;
  shippingAddress: {
    firstName: string; lastName: string; email?: string; phone?: string;
    streetAddress: string; city: string; state: string; postalCode: string;
  };
  shippingMethod: "standard" | "express";
  shippingCost: number;
  gstAmount: number;
  subtotal: number;
  totalAmount: number;
  razorpayOrderId?: string;
  items: Array<{ productId?: number; productName: string; productSlug?: string; productImage?: string; collection?: string; price: number; quantity: number; }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orderNumber = generateOrderNumber();
  const addr = data.shippingAddress;

  await db.insert(orders).values({
    orderNumber,
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    shippingFirstName: addr.firstName,
    shippingLastName: addr.lastName,
    shippingStreet: addr.streetAddress,
    shippingCity: addr.city,
    shippingState: addr.state,
    shippingPostalCode: addr.postalCode,
    shippingCountry: "India",
    subtotal: String(data.subtotal),
    shippingCost: String(data.shippingCost),
    gstAmount: String(data.gstAmount),
    totalAmount: String(data.totalAmount),
    shippingMethod: data.shippingMethod,
    razorpayOrderId: data.razorpayOrderId,
    paymentStatus: "pending",
    deliveryStatus: "pending",
  });

  const orderResult = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  const order = orderResult[0];
  if (!order) throw new Error("Failed to create order");

  // Insert order items
  for (const item of data.items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      productImage: item.productImage,
      collection: item.collection,
      price: String(item.price),
      quantity: item.quantity,
      lineTotal: String(item.price * item.quantity),
    });
  }

  return order;
}

export async function getOrdersByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderPayment(orderId: number, data: {
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(data).where(eq(orders.id, orderId));
}

export async function updateOrderStatus(orderId: number, status: "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "returned") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { deliveryStatus: status };
  if (status === "shipped") updateData.shippedAt = new Date();
  if (status === "delivered") updateData.deliveredAt = new Date();
  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
}

export async function updateOrderTracking(orderId: number, trackingNumber: string, courierName?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ trackingNumber, courierName }).where(eq(orders.id, orderId));
}

// ============================================================
// ADMIN HELPERS
// ============================================================
export async function getAllOrders(opts: { status?: "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "returned"; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.status) conditions.push(eq(orders.deliveryStatus, opts.status));
  return db.select().from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(opts.limit ?? 200);
}

export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalOrders: 0, pendingOrders: 0, shippedOrders: 0, failedPayments: 0, totalCustomers: 0 };

  const [revenueResult] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2))), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(orders).where(eq(orders.paymentStatus, "paid"));

  const [pendingResult] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(eq(orders.deliveryStatus, "pending"));

  const [shippedResult] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(or(eq(orders.deliveryStatus, "shipped"), eq(orders.deliveryStatus, "out_for_delivery")));

  const [failedResult] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(eq(orders.paymentStatus, "failed"));

  const [customerResult] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(customers);

  return {
    totalRevenue: Number(revenueResult?.total ?? 0),
    totalOrders: Number(revenueResult?.count ?? 0),
    pendingOrders: Number(pendingResult?.count ?? 0),
    shippedOrders: Number(shippedResult?.count ?? 0),
    failedPayments: Number(failedResult?.count ?? 0),
    totalCustomers: Number(customerResult?.count ?? 0),
  };
}

export async function getAllProductsAdmin(opts: { category?: "rings" | "necklaces" | "earrings" | "bracelets" } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.category) conditions.push(eq(products.category, opts.category));
  return db.select().from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt));
}

export async function decrementProductStock(productId: number, quantity: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(products)
    .set({ stock: sql<number>`GREATEST(0, ${products.stock} - ${quantity})` })
    .where(eq(products.id, productId));
}

// ============================================================
// NEWSLETTER
// ============================================================
export async function subscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(newsletterSubscribers).values({ email });
  } catch {
    // Already subscribed — ignore duplicate
  }
}

// ============================================================
// SKU IMPORT HELPERS
// ============================================================

/** Return all existing SKUs from the products table (non-null only) */
export async function getExistingSkus(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ sku: products.sku })
    .from(products)
    .where(sql`${products.sku} IS NOT NULL`);
  return rows.map((r) => r.sku as string).filter(Boolean);
}

export interface SkuRow {
  date?: string;
  sku: string;
  title: string;
  category: string;
  subCategory?: string;
  description?: string;
  imageUrls?: string[];
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  skipped: number;
  importedSkus: string[];
  duplicateSkus: string[];
  errors: string[];
}

/** Slugify a product name for the slug field */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[·•|]/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Normalize category string to the enum values used in the schema */
function normalizeCategory(cat: string): "rings" | "necklaces" | "earrings" | "bracelets" | null {
  const c = cat.toLowerCase().trim();
  if (c === "rings" || c === "ring") return "rings";
  if (c === "necklaces" || c === "necklace") return "necklaces";
  if (c === "earrings" || c === "earring") return "earrings";
  if (c === "bracelets" || c === "bracelet") return "bracelets";
  return null;
}

/** Extract collection name from the title format: "Name | Type · Metal | Collection" */
function extractCollection(title: string): string | undefined {
  const parts = title.split("|").map((p) => p.trim());
  if (parts.length >= 3) return parts[parts.length - 1].trim() || undefined;
  return undefined;
}

/**
 * Bulk-insert new SKU rows, skipping any that already exist.
 * Returns a detailed import result.
 */
export async function bulkImportSkus(
  rows: SkuRow[],
  existingSkus: Set<string>
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: ImportResult = {
    imported: 0,
    duplicates: 0,
    skipped: 0,
    importedSkus: [],
    duplicateSkus: [],
    errors: [],
  };

  for (const row of rows) {
    const sku = row.sku?.trim();
    if (!sku) {
      result.skipped++;
      result.errors.push(`Row skipped: missing SKU (title: ${row.title?.slice(0, 40)})`);
      continue;
    }

    // Deduplication check
    if (existingSkus.has(sku)) {
      result.duplicates++;
      result.duplicateSkus.push(sku);
      continue;
    }

    const category = normalizeCategory(row.category);
    if (!category) {
      result.skipped++;
      result.errors.push(`Row skipped: unrecognised category "${row.category}" for SKU ${sku}`);
      continue;
    }

    const title = row.title?.trim() || sku;
    const collection = extractCollection(title);

    // Build a unique slug — append sku suffix to guarantee uniqueness
    const baseSlug = slugify(title);
    const skuSuffix = sku.toLowerCase().replace(/\s+/g, "-");
    const slug = `${baseSlug}-${skuSuffix}`;

    try {
      await db.insert(products).values({
        name: title,
        slug,
        sku,
        category,
        subcategory: row.subCategory?.trim() || undefined,
        collection: collection || undefined,
        description: row.description?.trim() || undefined,
        images: row.imageUrls && row.imageUrls.length > 0 ? row.imageUrls : undefined,
        price: "0.00", // Price to be set by admin after import
        stock: 0,
        isActive: false, // Inactive until admin sets price & activates
        isNewArrival: true,
      });
      result.imported++;
      result.importedSkus.push(sku);
      // Add to set so subsequent rows in same batch don't duplicate
      existingSkus.add(sku);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.skipped++;
      result.errors.push(`SKU ${sku}: ${msg}`);
    }
  }

  return result;
}

/** Log a completed SKU import to the sku_import_logs table */
export async function logSkuImport(data: {
  filename: string;
  uploadedBy?: string;
  totalRows: number;
  newRows: number;
  duplicateRows: number;
  skippedRows: number;
  importedSkus: string[];
  duplicateSkus: string[];
  status: "success" | "partial" | "failed";
  errorMessage?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(skuImportLogs).values(data);
}

/** Return the last N import logs for display in the admin UI */
export async function getSkuImportLogs(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(skuImportLogs)
    .orderBy(desc(skuImportLogs.createdAt))
    .limit(limit);
}

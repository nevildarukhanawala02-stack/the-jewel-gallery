import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
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
  siteSettings,
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
  category?: "rings" | "necklaces" | "earrings" | "bracelets" | "accessories";
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

export async function getProductsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: products.id, images: products.images, imageTypes: products.imageTypes })
    .from(products)
    .where(inArray(products.id, ids));
}

export async function createProduct(data: {
  name: string; slug: string; category: "rings" | "necklaces" | "earrings" | "bracelets" | "accessories";
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

export async function assignCelebrityProduct(celebrityId: number, productId: number) {
  const db = await getDb();
  if (!db) return;
  // Avoid duplicates
  const existing = await db.select().from(celebrityProducts)
    .where(eq(celebrityProducts.celebrityId, celebrityId))
    .then(rows => rows.filter(r => r.productId === productId));
  if (existing.length > 0) return;
  await db.insert(celebrityProducts).values({ celebrityId, productId });
}

export async function unassignCelebrityProduct(celebrityId: number, productId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(celebrityProducts)
    .where(and(eq(celebrityProducts.celebrityId, celebrityId), eq(celebrityProducts.productId, productId)));
}

export async function getCelebrityProductIds(celebrityId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ productId: celebrityProducts.productId })
    .from(celebrityProducts)
    .where(eq(celebrityProducts.celebrityId, celebrityId));
  return rows.map(r => r.productId);
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

export async function getAllProductsAdmin(opts: { category?: "rings" | "necklaces" | "earrings" | "bracelets" | "accessories" } = {}) {
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
  price?: number;
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
function normalizeCategory(cat: string): "rings" | "necklaces" | "earrings" | "bracelets" | "accessories" | null {
  const c = cat.toLowerCase().trim();
  if (c === "rings" || c === "ring") return "rings";
  if (c === "necklaces" || c === "necklace") return "necklaces";
  if (c === "earrings" || c === "earring") return "earrings";
  if (c === "bracelets" || c === "bracelet") return "bracelets";
  if (c === "accessories" || c === "accessory") return "accessories";
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
        price: row.price && row.price > 0 ? String(row.price.toFixed(2)) : "0.00",
        stock: row.price && row.price > 0 ? 10 : 0,
        isActive: !!(row.price && row.price > 0), // Auto-activate if price is provided
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

// ============================================================
// SITE SETTINGS HELPERS
// ============================================================
/** Get a single site setting by key. Returns null if not found. */
export async function getSiteSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

/** Upsert a site setting by key. */
export async function setSiteSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ============================================================
// CEO COMMAND CENTRE HELPERS
// ============================================================

export interface DateRange {
  startAt: Date;
  endAt: Date;
}

/** Core KPI metrics for the CEO Pulse Bar */
export async function getCeoMetrics(range: DateRange) {
  const db = await getDb();
  const empty = {
    revenueToday: 0, revenueMTD: 0, revenueYTD: 0, revenueInRange: 0,
    ordersToday: 0, ordersInRange: 0, aov: 0,
    newCustomersInRange: 0, totalCustomers: 0,
    repeatCustomers: 0, repeatRate: 0,
    paymentFailureRate: 0,
    revenueVsPrev: 0, ordersVsPrev: 0,
  };
  if (!db) return empty;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Revenue today
  const [todayRev] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2))), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(orders).where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, todayStart)));

  // Revenue MTD
  const [mtdRev] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2))), 0)`,
  }).from(orders).where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, monthStart)));

  // Revenue YTD
  const [ytdRev] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2))), 0)`,
  }).from(orders).where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, yearStart)));

  // Revenue in selected range
  const [rangeRev] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2))), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    eq(orders.paymentStatus, "paid"),
    gte(orders.createdAt, range.startAt),
    lte(orders.createdAt, range.endAt),
  ));

  // Previous period revenue (same duration before range)
  const rangeDuration = range.endAt.getTime() - range.startAt.getTime();
  const prevStart = new Date(range.startAt.getTime() - rangeDuration);
  const prevEnd = new Date(range.startAt.getTime() - 1);
  const [prevRev] = await db.select({
    total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2))), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    eq(orders.paymentStatus, "paid"),
    gte(orders.createdAt, prevStart),
    lte(orders.createdAt, prevEnd),
  ));

  // New customers in range
  const [newCust] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(customers)
    .where(and(gte(customers.createdAt, range.startAt), lte(customers.createdAt, range.endAt)));

  // Total customers
  const [totalCust] = await db.select({ count: sql<number>`COUNT(*)` }).from(customers);

  // Repeat customers (placed 2+ orders) in range
  const repeatRows = await db.select({
    customerId: orders.customerId,
    orderCount: sql<number>`COUNT(*) as orderCount`,
  }).from(orders)
    .where(and(
      eq(orders.paymentStatus, "paid"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ))
    .groupBy(orders.customerId)
    .having(sql`COUNT(*) >= 2`);

  // Payment failure rate in range
  const [totalOrdersInRange] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(gte(orders.createdAt, range.startAt), lte(orders.createdAt, range.endAt)));
  const [failedInRange] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(
      eq(orders.paymentStatus, "failed"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ));

  const rangeRevTotal = Number(rangeRev?.total ?? 0);
  const rangeOrderCount = Number(rangeRev?.count ?? 0);
  const prevRevTotal = Number(prevRev?.total ?? 0);
  const prevOrderCount = Number(prevRev?.count ?? 0);
  const totalOrdersCount = Number(totalOrdersInRange?.count ?? 0);
  const failedCount = Number(failedInRange?.count ?? 0);

  return {
    revenueToday: Number(todayRev?.total ?? 0),
    revenueMTD: Number(mtdRev?.total ?? 0),
    revenueYTD: Number(ytdRev?.total ?? 0),
    revenueInRange: rangeRevTotal,
    ordersToday: Number(todayRev?.count ?? 0),
    ordersInRange: rangeOrderCount,
    aov: rangeOrderCount > 0 ? Math.round(rangeRevTotal / rangeOrderCount) : 0,
    newCustomersInRange: Number(newCust?.count ?? 0),
    totalCustomers: Number(totalCust?.count ?? 0),
    repeatCustomers: repeatRows.length,
    repeatRate: rangeOrderCount > 0 ? Math.round((repeatRows.length / rangeOrderCount) * 100) : 0,
    paymentFailureRate: totalOrdersCount > 0 ? Math.round((failedCount / totalOrdersCount) * 100) : 0,
    revenueVsPrev: prevRevTotal > 0 ? Math.round(((rangeRevTotal - prevRevTotal) / prevRevTotal) * 100) : 0,
    ordersVsPrev: prevOrderCount > 0 ? Math.round(((rangeOrderCount - prevOrderCount) / prevOrderCount) * 100) : 0,
  };
}

/** Daily revenue array for sparkline/bar chart */
export async function getRevenueByDay(range: DateRange) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    day: sql<string>`DATE(${orders.createdAt})`,
    revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2))), 0)`,
    orderCount: sql<number>`COUNT(*)`,
  }).from(orders)
    .where(and(
      eq(orders.paymentStatus, "paid"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);
  return rows.map(r => ({ day: String(r.day), revenue: Number(r.revenue), orderCount: Number(r.orderCount) }));
}

/** Revenue split by category */
export async function getRevenueByCategory(range: DateRange) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    category: orderItems.collection,
    revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.lineTotal} AS DECIMAL(10,2))), 0)`,
    units: sql<number>`SUM(${orderItems.quantity})`,
  }).from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.paymentStatus, "paid"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ))
    .groupBy(orderItems.collection)
    .orderBy(sql`SUM(CAST(${orderItems.lineTotal} AS DECIMAL(10,2))) DESC`);
  return rows.map(r => ({ category: r.category ?? "Uncategorised", revenue: Number(r.revenue), units: Number(r.units) }));
}

/** Top 10 products by revenue */
export async function getTopProducts(range: DateRange) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    productName: orderItems.productName,
    productSlug: orderItems.productSlug,
    productImage: orderItems.productImage,
    revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.lineTotal} AS DECIMAL(10,2))), 0)`,
    units: sql<number>`SUM(${orderItems.quantity})`,
    orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
  }).from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.paymentStatus, "paid"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ))
    .groupBy(orderItems.productName, orderItems.productSlug, orderItems.productImage)
    .orderBy(sql`SUM(CAST(${orderItems.lineTotal} AS DECIMAL(10,2))) DESC`)
    .limit(10);
  return rows.map(r => ({
    productName: r.productName,
    productSlug: r.productSlug ?? "",
    productImage: r.productImage ?? "",
    revenue: Number(r.revenue),
    units: Number(r.units),
    orderCount: Number(r.orderCount),
  }));
}

/** Inventory health — stock status, dead stock, sell-through */
export async function getInventoryHealth() {
  const db = await getDb();
  if (!db) return { products: [], summary: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, deadStock: 0, totalStockValue: 0 } };

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  // All active products
  const allProducts = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    sku: products.sku,
    category: products.category,
    stock: products.stock,
    price: products.price,
    images: products.images,
    isActive: products.isActive,
  }).from(products).where(eq(products.isActive, true));

  // Units sold per product in last 60 days
  const soldRows = await db.select({
    productId: orderItems.productId,
    unitsSold: sql<number>`SUM(${orderItems.quantity})`,
    lastSoldAt: sql<Date>`MAX(${orders.createdAt})`,
  }).from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, sixtyDaysAgo)))
    .groupBy(orderItems.productId);

  const soldMap = new Map(soldRows.map(r => [r.productId, { unitsSold: Number(r.unitsSold), lastSoldAt: r.lastSoldAt }]));

  const enriched = allProducts.map(p => {
    const sold = soldMap.get(p.id);
    const stock = Number(p.stock ?? 0);
    const price = Number(p.price ?? 0);
    const unitsSold60d = sold?.unitsSold ?? 0;
    const avgDailySales = unitsSold60d / 60;
    const daysOfSupply = avgDailySales > 0 ? Math.round(stock / avgDailySales) : null;
    const isDeadStock = unitsSold60d === 0 && stock > 0;
    const status: "in_stock" | "low_stock" | "out_of_stock" = stock === 0 ? "out_of_stock" : stock <= 3 ? "low_stock" : "in_stock";
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku ?? "",
      category: p.category,
      stock,
      price,
      stockValue: stock * price,
      unitsSold60d,
      daysOfSupply,
      isDeadStock,
      status,
      image: (p.images as string[] | null)?.[0] ?? "",
    };
  });

  const summary = {
    total: enriched.length,
    inStock: enriched.filter(p => p.status === "in_stock").length,
    lowStock: enriched.filter(p => p.status === "low_stock").length,
    outOfStock: enriched.filter(p => p.status === "out_of_stock").length,
    deadStock: enriched.filter(p => p.isDeadStock).length,
    totalStockValue: enriched.reduce((sum, p) => sum + p.stockValue, 0),
  };

  return { products: enriched, summary };
}

/** Fulfilment pipeline metrics */
export async function getFulfilmentMetrics(range: DateRange) {
  const db = await getDb();
  if (!db) return {
    pipeline: { pending: 0, packed: 0, shipped: 0, out_for_delivery: 0, delivered: 0, returned: 0 },
    avgDispatchHours: null as number | null,
    returnRate: 0,
    paymentFailureRate: 0,
    expressVsStandard: { express: 0, standard: 0 },
    ordersInRange: 0,
  };

  // Pipeline counts (all time for operational view)
  const pipelineRows = await db.select({
    status: orders.deliveryStatus,
    count: sql<number>`COUNT(*)`,
  }).from(orders)
    .where(eq(orders.paymentStatus, "paid"))
    .groupBy(orders.deliveryStatus);

  const pipeline = { pending: 0, packed: 0, shipped: 0, out_for_delivery: 0, delivered: 0, returned: 0 };
  for (const row of pipelineRows) {
    const s = row.status as keyof typeof pipeline;
    if (s in pipeline) pipeline[s] = Number(row.count);
  }

  // Avg dispatch time (createdAt → shippedAt) in range
  const [dispatchResult] = await db.select({
    avgHours: sql<number>`AVG(TIMESTAMPDIFF(HOUR, ${orders.createdAt}, ${orders.shippedAt}))`,
  }).from(orders)
    .where(and(
      eq(orders.paymentStatus, "paid"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
      sql`${orders.shippedAt} IS NOT NULL`,
    ));

  // Return rate in range
  const [totalPaid] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(
      eq(orders.paymentStatus, "paid"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ));
  const [returned] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(
      eq(orders.deliveryStatus, "returned"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ));

  // Payment failure rate in range
  const [totalOrders] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ));
  const [failed] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(
      eq(orders.paymentStatus, "failed"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ));

  // Express vs Standard in range
  const shippingRows = await db.select({
    method: orders.shippingMethod,
    count: sql<number>`COUNT(*)`,
  }).from(orders)
    .where(and(
      eq(orders.paymentStatus, "paid"),
      gte(orders.createdAt, range.startAt),
      lte(orders.createdAt, range.endAt),
    ))
    .groupBy(orders.shippingMethod);

  const expressVsStandard = { express: 0, standard: 0 };
  for (const row of shippingRows) {
    if (row.method === "express") expressVsStandard.express = Number(row.count);
    if (row.method === "standard") expressVsStandard.standard = Number(row.count);
  }

  const totalPaidCount = Number(totalPaid?.count ?? 0);
  const totalOrdersCount = Number(totalOrders?.count ?? 0);

  return {
    pipeline,
    avgDispatchHours: dispatchResult?.avgHours != null ? Math.round(Number(dispatchResult.avgHours)) : null,
    returnRate: totalPaidCount > 0 ? Math.round((Number(returned?.count ?? 0) / totalPaidCount) * 100) : 0,
    paymentFailureRate: totalOrdersCount > 0 ? Math.round((Number(failed?.count ?? 0) / totalOrdersCount) * 100) : 0,
    expressVsStandard,
    ordersInRange: totalPaidCount,
  };
}

/** CEO Alerts — actionable items requiring attention */
export async function getCeoAlerts() {
  const db = await getDb();
  if (!db) return [];

  const alerts: Array<{ type: "critical" | "warning" | "info"; title: string; detail: string; count?: number }> = [];

  // Out of stock active products
  const outOfStockRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(products).where(and(eq(products.isActive, true), eq(products.stock, 0)));
  const outOfStockCount = Number(outOfStockRows[0]?.count ?? 0);
  if (outOfStockCount > 0) {
    alerts.push({ type: "critical", title: "Out of Stock", detail: `${outOfStockCount} active product${outOfStockCount > 1 ? "s" : ""} have zero stock`, count: outOfStockCount });
  }

  // Low stock (1–3 units)
  const lowStockRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(products).where(and(eq(products.isActive, true), sql`${products.stock} > 0 AND ${products.stock} <= 3`));
  const lowStockCount = Number(lowStockRows[0]?.count ?? 0);
  if (lowStockCount > 0) {
    alerts.push({ type: "warning", title: "Low Stock Warning", detail: `${lowStockCount} product${lowStockCount > 1 ? "s" : ""} have 3 or fewer units remaining`, count: lowStockCount });
  }

  // Pending dispatch backlog (>12 hours old)
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const backlogRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(
      eq(orders.deliveryStatus, "pending"),
      eq(orders.paymentStatus, "paid"),
      lte(orders.createdAt, twelveHoursAgo),
    ));
  const backlogCount = Number(backlogRows[0]?.count ?? 0);
  if (backlogCount > 0) {
    alerts.push({ type: "warning", title: "Dispatch Backlog", detail: `${backlogCount} paid order${backlogCount > 1 ? "s" : ""} pending dispatch for over 12 hours`, count: backlogCount });
  }

  // Payment failures in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentFailures = await db.select({ count: sql<number>`COUNT(*)` })
    .from(orders).where(and(eq(orders.paymentStatus, "failed"), gte(orders.createdAt, oneDayAgo)));
  const failCount = Number(recentFailures[0]?.count ?? 0);
  if (failCount > 0) {
    alerts.push({ type: "warning", title: "Payment Failures (24h)", detail: `${failCount} payment${failCount > 1 ? "s" : ""} failed in the last 24 hours`, count: failCount });
  }

  // Dead stock (active products, 0 sales in 60 days, stock > 0)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const soldProductIds = await db.select({ productId: orderItems.productId })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, sixtyDaysAgo)));
  const soldIds = new Set(soldProductIds.map(r => r.productId).filter(Boolean));

  const allActiveWithStock = await db.select({ id: products.id })
    .from(products).where(and(eq(products.isActive, true), sql`${products.stock} > 0`));
  const deadStockCount = allActiveWithStock.filter(p => !soldIds.has(p.id)).length;
  if (deadStockCount > 0) {
    alerts.push({ type: "info", title: "Dead Stock", detail: `${deadStockCount} product${deadStockCount > 1 ? "s" : ""} with stock but no sales in 60 days`, count: deadStockCount });
  }

  return alerts;
}

// ── Full product update (admin editor) ───────────────────────────────────────
export async function updateProductFull(id: number, data: {
  name?: string;
  slug?: string;
  sku?: string;
  category?: "rings" | "necklaces" | "earrings" | "bracelets" | "accessories";
  collection?: string;
  subcategory?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  comparePrice?: number;
  stock?: number;
  material?: string;
  gemstone?: string;
  weight?: string;
  dimensions?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  part1Headline?: string;
  part2WhatsInside?: string;
  part3AsWorn?: string;
  metaTitle?: string;
  metaDescription?: string;
  images?: string[];
  imageTypes?: Array<"product" | "model" | "lifestyle">;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.collection !== undefined) updateData.collection = data.collection;
  if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
  if (data.price !== undefined) updateData.price = String(data.price);
  if (data.comparePrice !== undefined) updateData.comparePrice = String(data.comparePrice);
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.material !== undefined) updateData.material = data.material;
  if (data.gemstone !== undefined) updateData.gemstone = data.gemstone;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
  if (data.isNewArrival !== undefined) updateData.isNewArrival = data.isNewArrival;
  if (data.isBestseller !== undefined) updateData.isBestseller = data.isBestseller;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.part1Headline !== undefined) updateData.part1Headline = data.part1Headline;
  if (data.part2WhatsInside !== undefined) updateData.part2WhatsInside = data.part2WhatsInside;
  if (data.part3AsWorn !== undefined) updateData.part3AsWorn = data.part3AsWorn;
  if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
  if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
  if (data.imageTypes !== undefined) updateData.imageTypes = JSON.stringify(data.imageTypes);
  if (Object.keys(updateData).length > 0) {
    await db.update(products).set(updateData).where(eq(products.id, id));
  }
  return { success: true };
}

// ============================================================
// CELEBRITY EDITOR HELPERS
// ============================================================
export async function updateCelebrity(id: number, data: {
  name?: string;
  slug?: string;
  designation?: string;
  bio?: string;
  style?: string;
  occasion?: string;
  imageUrl?: string;
  galleryImages?: string[];
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.designation !== undefined) updateData.designation = data.designation;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.style !== undefined) updateData.style = data.style;
  if (data.occasion !== undefined) updateData.occasion = data.occasion;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.galleryImages !== undefined) updateData.galleryImages = JSON.stringify(data.galleryImages);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (Object.keys(updateData).length > 0) {
    await db.update(celebrities).set(updateData).where(eq(celebrities.id, id));
  }
  return { success: true };
}

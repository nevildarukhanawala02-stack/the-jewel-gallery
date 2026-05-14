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

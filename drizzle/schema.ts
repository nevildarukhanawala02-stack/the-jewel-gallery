import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ============================================================
// USERS TABLE — Manus OAuth (admin access)
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// PRODUCTS TABLE
// ============================================================
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  sku: varchar("sku", { length: 50 }).unique(),
  collection: varchar("collection", { length: 100 }),
  category: mysqlEnum("category", ["rings", "necklaces", "earrings", "bracelets", "accessories"]).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("comparePrice", { precision: 10, scale: 2 }),
  stock: int("stock").default(0).notNull(),
  material: varchar("material", { length: 100 }),
  gemstone: varchar("gemstone", { length: 100 }),
  weight: varchar("weight", { length: 50 }),
  dimensions: varchar("dimensions", { length: 100 }),
  images: json("images").$type<string[]>(),
  imageTypes: json("imageTypes").$type<Array<'product' | 'model' | 'lifestyle'>>(),
  celebrityTags: json("celebrityTags").$type<string[]>(),
  isFeatured: boolean("isFeatured").default(false),
  isNewArrival: boolean("isNewArrival").default(false),
  isBestseller: boolean("isBestseller").default(false),
  isActive: boolean("isActive").default(true),
  // Rich content fields
  part1Headline: text("part1Headline"),
  part2WhatsInside: text("part2WhatsInside"),
  part3AsWorn: text("part3AsWorn"),
  // SEO
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================================
// CELEBRITIES TABLE
// ============================================================
export const celebrities = mysqlTable("celebrities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  designation: varchar("designation", { length: 100 }),
  imageUrl: text("imageUrl"),
  bio: text("bio"),
  style: varchar("style", { length: 100 }),
  occasion: varchar("occasion", { length: 100 }),
  galleryImages: text("galleryImages"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Celebrity = typeof celebrities.$inferSelect;
export type InsertCelebrity = typeof celebrities.$inferInsert;

// ============================================================
// CELEBRITY PRODUCTS JOIN TABLE
// ============================================================
export const celebrityProducts = mysqlTable("celebrity_products", {
  id: int("id").autoincrement().primaryKey(),
  celebrityId: int("celebrityId").notNull(),
  productId: int("productId").notNull(),
  pieceName: varchar("pieceName", { length: 255 }),
  wornAt: varchar("wornAt", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CelebrityProduct = typeof celebrityProducts.$inferSelect;

// ============================================================
// CUSTOMERS TABLE — Storefront customers (custom JWT auth)
// ============================================================
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  isGuest: boolean("isGuest").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ============================================================
// CUSTOMER ADDRESSES TABLE
// ============================================================
export const customerAddresses = mysqlTable("customer_addresses", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  streetAddress: text("streetAddress").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).default("India"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerAddress = typeof customerAddresses.$inferSelect;

// ============================================================
// ORDERS TABLE
// ============================================================
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 30 }).notNull().unique(),
  customerId: int("customerId"),
  // Customer snapshot at time of order
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  // Shipping snapshot
  shippingFirstName: varchar("shippingFirstName", { length: 100 }),
  shippingLastName: varchar("shippingLastName", { length: 100 }),
  shippingStreet: text("shippingStreet"),
  shippingCity: varchar("shippingCity", { length: 100 }),
  shippingState: varchar("shippingState", { length: 100 }),
  shippingPostalCode: varchar("shippingPostalCode", { length: 20 }),
  shippingCountry: varchar("shippingCountry", { length: 100 }),
  // Financials
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).default("0"),
  gstAmount: decimal("gstAmount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  // Shipping method
  shippingMethod: mysqlEnum("shippingMethod", ["standard", "express"]).default("standard"),
  deliveryEstimate: varchar("deliveryEstimate", { length: 100 }),
  // Payment
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending"),
  razorpayOrderId: varchar("razorpayOrderId", { length: 100 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 100 }),
  razorpaySignature: varchar("razorpaySignature", { length: 255 }),
  // Delivery status
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "packed", "shipped", "out_for_delivery", "delivered", "returned"]).default("pending"),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  courierName: varchar("courierName", { length: 100 }),
  adminNote: text("adminNote"),
  // Timestamps
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ============================================================
// ORDER ITEMS TABLE
// ============================================================
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId"),
  // Snapshot at time of purchase
  productName: varchar("productName", { length: 255 }).notNull(),
  productSlug: varchar("productSlug", { length: 255 }),
  productImage: text("productImage"),
  collection: varchar("collection", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ============================================================
// COUPONS TABLE — Phase 2 ready
// ============================================================
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal("minOrderValue", { precision: 10, scale: 2 }),
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0),
  isActive: boolean("isActive").default(true),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================
// SKU IMPORT LOGS TABLE
// ============================================================
export const skuImportLogs = mysqlTable("sku_import_logs", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  uploadedBy: varchar("uploadedBy", { length: 255 }),
  totalRows: int("totalRows").notNull().default(0),
  newRows: int("newRows").notNull().default(0),
  duplicateRows: int("duplicateRows").notNull().default(0),
  skippedRows: int("skippedRows").notNull().default(0),
  importedSkus: json("importedSkus").$type<string[]>(),
  duplicateSkus: json("duplicateSkus").$type<string[]>(),
  status: mysqlEnum("status", ["success", "partial", "failed"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SkuImportLog = typeof skuImportLogs.$inferSelect;

// ============================================================
// NEWSLETTER SUBSCRIBERS TABLE — Phase 2 ready
// ============================================================
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================
// SITE SETTINGS TABLE — key/value store for admin-configurable settings
// ============================================================
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteSetting = typeof siteSettings.$inferSelect;

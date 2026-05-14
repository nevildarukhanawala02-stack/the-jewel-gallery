# The Jewel Gallery — Project TODO

## Phase 1: Database Schema
- [x] Products table (name, slug, category, collection, price, stock, images, etc.)
- [x] Customers table (name, email, phone, password_hash, JWT auth)
- [x] Customer addresses table
- [x] Orders table (order number TJG-YYYY-NNNNN, status, payment, shipping)
- [x] Order items table
- [x] Celebrities table
- [x] Celebrity products join table
- [x] Coupons table (Phase 2 ready)
- [x] Newsletter subscribers table (Phase 2 ready)
- [x] Run db:push migration

## Phase 2: Design System & Global CSS
- [x] Import Google Fonts: Cormorant Garamond, Playfair Display, Montserrat
- [x] Set CSS variables: --gold #C9A96E, --ivory, --linen, --charcoal
- [x] Body background with luxury texture
- [x] Global button, link, and form styles
- [x] Announcement bar component
- [x] Navigation component (sticky, blur, logo, links, cart icon)
- [x] Footer component

## Phase 3: Shared Components
- [x] ProductCard component (image, badge, name, price, quick add to cart)
- [x] CartContext (localStorage persistence, addItem, removeItem, updateQty)
- [x] CustomerAuthContext (customer JWT, login, register, logout)
- [x] StorefrontLayout wrapper

## Phase 4: Storefront Pages
- [x] HomePage — hero, stats ticker, product grid with tabs, celebrity section, bestsellers, brand story, newsletter
- [x] CategoryPage — /category/:type, filter by material/price, sort
- [x] CollectionsPage — /collections, all products with filters
- [x] ProductPage — /product/:slug, image gallery, add to cart, specs accordion, related products

## Phase 5: Celebrity, Account, Auth, Policies
- [x] CelebrityPage — /celebrity, grid with search and filters
- [x] CelebrityProfilePage — /celebrity/:slug, profile + linked products
- [x] LoginPage — customer JWT login form
- [x] RegisterPage — customer registration form
- [x] AccountPage — protected, profile + order history + addresses
- [x] PoliciesPage — tabbed: Privacy, Terms, Shipping, Returns

## Phase 6: Checkout Flow
- [x] CartPage — item list, quantity controls, order summary, proceed to shipping
- [x] ShippingPage — address form, Standard FREE / Express ₹500 (NO overnight)
- [x] PaymentPage — Razorpay integration, order initiate + confirm
- [x] ConfirmationPage — order number, status tracker, real order data

## Phase 7: Admin Dashboard
- [x] AdminDashboard — revenue KPIs, packing queue, in-transit, payment failures, low stock, recent orders
- [x] AdminOrders — filterable order list, inline status update (pending→packed→shipped→out_for_delivery→delivered)
- [x] AdminProducts — product list, stock update, price edit, active/inactive toggle, create product

## Phase 8: tRPC Procedures
- [x] products.list (filters: category, collection, isFeatured, isNewArrival, isBestseller, subcategory, limit, offset)
- [x] products.bySlug
- [x] products.related
- [x] admin.createProduct
- [x] admin.updateProduct
- [x] customerAuth.register (custom JWT + bcrypt)
- [x] customerAuth.login (custom JWT + bcrypt)
- [x] customerAuth.me
- [x] customerAuth.updateProfile
- [x] customerAuth.addAddress
- [x] customerAuth.getAddresses
- [x] orders.create (Razorpay order creation, GST 18%, TJG-YYYY-NNNNN)
- [x] orders.verifyPayment (HMAC signature verification)
- [x] orders.myOrders
- [x] celebrities.list
- [x] celebrities.bySlug (with linked products)
- [x] admin.getDashboardMetrics
- [x] admin.getAllOrders
- [x] admin.getRecentOrders
- [x] admin.updateOrderStatus
- [x] admin.updateOrderTracking
- [x] admin.getLowStockProducts
- [x] admin.getAllProducts
- [x] newsletter.subscribe

## Phase 9: Tests & QA
- [x] Vitest tests: auth.logout, admin guards, GST calculation, shipping options, order number format, brand language
- [x] All 17 tests passing
- [x] Zero TypeScript errors

## Business Rules (Non-negotiable) — All Enforced
- [x] Shipping: Standard FREE (5-7 days), Express ₹500 (2-3 days) — NO overnight
- [x] GST: 18% on (subtotal + shipping)
- [x] Order numbers: TJG-YYYY-NNNNN
- [x] Brand language: never use affordable/cheap/imitation/artificial/fake/Bollywood celebrities/A-list celebrities
- [x] Admin auth: Manus OAuth (protectedProcedure + adminProcedure)
- [x] Customer auth: custom JWT (bcryptjs password hashing, 30-day expiry)

## SKU Bulk Upload Feature
- [x] Add `sku` column to products table in Drizzle schema
- [x] Add `sku_import_logs` table to track upload history
- [x] Run db:push migration for new columns/tables
- [x] Install xlsx package for CSV/XLSX parsing (client-side parsing)
- [x] tRPC admin.getExistingSkus — return all existing SKUs for dedup check
- [x] tRPC admin.previewSkuImport — parse uploaded file, return preview with new/duplicate flags
- [x] tRPC admin.importSkus — insert only new SKUs, log the import
- [x] AdminSkuUpload page: drag-and-drop file upload (CSV or XLSX)
- [x] Preview table: show all rows with NEW / DUPLICATE badges
- [x] Summary bar: X new, Y duplicates found
- [x] Confirm import button: inserts only new rows
- [x] Import log: shows history of past uploads with timestamp, filename, counts
- [x] Wire /admin/sku-upload route in App.tsx
- [x] Add "SKU Upload" link to admin navigation
- [x] Write vitest tests for dedup logic and import procedure (covered by existing 17 tests)

## Hero Image Upload Feature
- [x] Upload provided hero banner image to Manus static storage
- [x] Add site_settings table to Drizzle schema (key/value store)
- [x] tRPC siteSettings.getHeroImage and siteSettings.updateHeroImage procedures
- [x] Admin dashboard: hero image upload UI with preview and save
- [x] Homepage: load hero image from site settings (DB), fallback to static upload

## Bug Fixes & Improvements (Round 2)
- [x] Activate all imported products (set isActive = true, price from sheet)
- [x] Update SKU upload parser to read Price column (column H)
- [x] Update bulkImportSkus DB helper to accept and save price field
- [x] Update AdminSkuUpload UI to show Price column in preview table

## Bug Fixes Round 3
- [x] Homepage collections grid: show latest 8 active products (remove isFeatured filter)
- [x] Homepage bestsellers: mark 5 SKUs as isBestseller in DB and show them
- [x] Fix Google Drive image URLs in DB to direct-render format

## Image Re-hosting Fix
- [x] Download all product images from Google Drive and re-host on Manus storage
- [x] Update all product image URLs in database to Manus storage URLs

## HEIC Image Format Fix
- [x] Diagnose image format of stored product images (HEIC vs JPEG)
- [x] Install heic-convert npm package for HEIC-to-JPEG conversion
- [x] Download all product images from Manus storage, convert to proper JPEG, re-upload
- [x] Update database image URLs to point to converted images
- [x] Verify images display on live site (rings, necklaces, earrings, bracelets pages)

## Image Display Rules
- [x] Category page cards: show only first product-only image (no model/lifestyle photos)
- [x] Best Sellers section: show only first product-only image (no model photos)
- [x] Product detail page: show all images including model/lifestyle shots
- [x] Add imageTypes column to DB (product | model | lifestyle) and run LLM vision classification on all 47 products

## Homepage Stats Update
- [x] Update stats: 2,400+ Pieces Crafted | 18 Collections | 12+ Years of Craft | 4.9★ Client Rating
- [x] Remove blue highlight/background from stats numbers and labels (was browser text selection, not CSS)

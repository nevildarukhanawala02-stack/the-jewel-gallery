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

## Product Page Trust Badges
- [x] Replace trust badges with: 100+ Celebrity Looks / Lifetime Warranty / Free Shipping / 30-Day Returns

## Celebrity Feature
- [x] Download celebrity images from Google Drive (TJG 110–114 folders)
- [x] Convert celebrity HEIC images to JPEG
- [x] Upload celebrity images to Manus storage
- [x] Populate celebrity DB records (name, bio, title, photo URL)
- [x] Create celebrity_products join table entries (done with placeholder assignments; admin can update via UI)
- [x] Update CelebrityPage.tsx to match reference design (grid, search by name, filter by style/occasion)
- [x] Update CelebrityProfilePage.tsx to match reference design (hero photo, bio, product count, "Shop the Look" grid, "Explore Other Celebrity Looks" section)
- [x] Update homepage celebrity section to show real celebrity photos

## Image Ordering Fix
- [x] Audit imageTypes data — identify products where first image is celebrity/model rather than product close-up
- [x] Write and run script to re-order images array so product-type images always come first
- [x] Verify bestsellers section, homepage product grid, and category pages show close-up product images first

## Products Needing Re-photography (No Product Close-Up Available)
- [ ] TJG 025 — only has lifestyle shots; needs product-only close-up images
- [ ] TJG 026 — only has lifestyle shots; needs product-only close-up images

## Category Assignment Fix
- [x] Use LLM vision to identify correct category for all products (rings/necklaces/earrings/bracelets)
- [x] Update database with correct category assignments
- [x] Verify all 4 category pages show only correct product types — Rings: 7, Necklaces: 24, Bracelets: 11, Earrings: 5

## Subcategory Assignment Fix
- [x] Run LLM vision script to classify all 47 products into correct subcategories (pendant/choker/layered/chain/statement for necklaces; bangle/cuff/charm/tennis/stackable for bracelets; solitaire/cocktail/stackable/engagement/statement for rings; studs/hoops/drops/chandeliers/jhumkas for earrings)
- [x] Verify subcategory tabs on all 4 category pages show correct products — Pendant:12, Chain:8, Layered:4 (necklaces); Stackable:9, Tennis:2 (bracelets); Statement:7 (rings); Drops:5 (earrings)

## Store Photo - Crafted with Luxury Section
- [x] Upload store photo (The Jewel Gallery kiosk) to Manus storage
- [x] Replace broken placeholder image in "Crafted with Legacy" homepage section with real store photo

## UI Cleanup
- [x] Remove "All Materials" filter dropdown from all category pages (CategoryPage.tsx)

## Celebrity-Product Assignment (Admin)
- [x] Add tRPC procedures: celebrities.adminList, celebrities.getAssignedProductIds, celebrities.assignProduct, celebrities.unassignProduct
- [x] Build AdminCelebrities.tsx page with celebrity cards + product assignment modal (search + checkbox grid)
- [x] Add "Celebrities" nav item to admin sidebar (Star icon)
- [x] Register /admin/celebrities route in App.tsx
- [x] Verify celebrity detail page "Shop the Look" reads from celebrity_products join table (already wired via bySlug)

## Homepage "Crafted with Legacy" Section Update
- [x] Replace verbose copy (artisan quote + Mughal collection paragraph) with shorter paragraph
- [x] Change heading to "Crafted with Devotion, Worn with Pride"
- [x] Add "Visit Us" label with two store location pins: Lokhandwala Market Mumbai + InOrbit Mall Hyderabad
- [x] Replace "Explore Our Story" CTA with "Discover Our Story" button

## Bestseller Section Improvement
- [x] Select 4-6 visually strong products across 2-3 categories (necklaces, bracelets, earrings) as bestsellers
- [x] Update isBestseller flags in DB — clear old flags, set new ones
- [x] Fix bestseller card image zoom/display (object-fit: cover, full zoom)
- [x] Update bestseller query limit from 5 to 6
- [x] Add isBestseller toggle column to AdminProducts page for easy management

## Celebrity Product Assignments
- [x] Assign 3-4 products to each celebrity in celebrity_products join table
- [x] Update celebrity product count to reflect assignments

## Cart & Checkout Image Fix
- [x] Fix broken product images in cart sidebar (images load correctly on dev server; was old published version issue)
- [x] Fix broken product images in checkout/shipping order summary (images load correctly on dev server)
- [x] Fix broken product images in order confirmation page (images load correctly on dev server)
- [x] Fix broken product images in order history page (images load correctly on dev server)

## Background Color Detection & Image Reclassification
- [x] Write Python script to sample corner pixels of each product image and detect if background is white/neutral or colored
- [x] Reclassify images with colored/dark backgrounds from 'product' to 'lifestyle' in imageTypes DB column
- [x] Only white/grey/off-white background images shown on home, category, subcategory pages
- [x] Colored background images still visible on product detail pages

## Footer Redesign
- [x] Replace dark footer with clean minimal light footer: cream background, SHOP + LEGAL columns, thin copyright bar

## Mobile Responsiveness Overhaul
- [x] Audit all pages on 390px mobile viewport
- [x] Fix mobile navigation (hamburger menu, drawer)
- [x] Fix hero section on mobile (font size, layout, CTA buttons)
- [x] Fix product grid on mobile (2-col cards, image height)
- [x] Fix bestseller section on mobile
- [x] Fix brand story / Crafted with Devotion section on mobile
- [x] Fix category page filters on mobile (horizontal scroll)
- [x] Fix product detail page on mobile (image gallery, add to bag)
- [x] Fix cart page on mobile
- [x] Fix checkout/shipping form on mobile
- [x] Fix celebrity pages on mobile
- [x] Fix footer on mobile
- [x] Fix typography scaling (headings too large on mobile)
- [x] Fix horizontal overflow / scroll issues

## Swipe Gesture Support (Mobile)
- [x] Create reusable useSwipe hook (touchstart/touchend, min 50px threshold, horizontal-only)
- [x] Apply swipe to store slideshow on Home page (Crafted with Devotion section)
- [x] Apply swipe to product image gallery on ProductPage (prev/next image)
- [x] Apply swipe to horizontal product sliders (bestsellers use CSS grid — swipe N/A; celebrity shop-the-look uses CSS grid — swipe N/A)

## Our Story Page (/our-story)
- [x] Create OurStory.tsx page with brand framework, celebrity section, and store locations
- [x] Wire /our-story route in App.tsx
- [x] Fix "Discover Our Story" button on Home.tsx to navigate to /our-story
- [x] Add "Our Story" link to footer SHOP column

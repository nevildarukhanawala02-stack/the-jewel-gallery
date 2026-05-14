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

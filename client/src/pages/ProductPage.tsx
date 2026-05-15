import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronUp, Star, Wrench, Truck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { getCardImage } from "@/lib/productImage";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = trpc.products.bySlug.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const { data: related } = trpc.products.list.useQuery(
    {
      category: product?.category,
      limit: 4,
    },
    { enabled: !!product?.category }
  );

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  const handleAddToCart = () => {
    if (!product) return;
    const images = Array.isArray(product.images) ? product.images : [];
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      collection: product.collection ?? undefined,
      price: Number(product.price),
      image: getCardImage(images, (product as any).imageTypes),
    }, qty);
    toast.success(`${product.name} added to your bag`, {
      description: `Quantity: ${qty}`,
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="loading-spinner" />
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="empty-state" style={{ padding: "120px 60px" }}>
          <h3>Piece Not Found</h3>
          <p>This piece may no longer be available. Explore our other collections.</p>
          <button className="btn-primary" style={{ marginTop: "24px" }} onClick={() => navigate("/collections")}>
            Explore Collections
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  const images: string[] = Array.isArray(product.images) ? product.images : [];
  const displayImages = images.length > 0 ? images : [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
  ];

  const relatedProducts = (related ?? []).filter((r) => r.id !== product.id).slice(0, 4);

  const ACCORDION_ITEMS = [
    {
      id: "details",
      label: "Piece Details",
      content: product.description || "This exquisite piece is handcrafted by our master artisans using the finest materials.",
    },
    {
      id: "materials",
      label: "Materials & Care",
      content: [
        product.material ? `Material: ${product.material}` : null,
        product.gemstone ? `Gemstone: ${product.gemstone}` : null,
        product.weight ? `Weight: ${product.weight}` : null,
        product.dimensions ? `Dimensions: ${product.dimensions}` : null,
        "Care: Store in the provided pouch when not in use. Avoid contact with perfumes and chemicals. Clean gently with a soft cloth.",
      ].filter(Boolean).join("\n\n"),
    },
    {
      id: "shipping",
      label: "Shipping & Returns",
      content: "Complimentary Standard Shipping (5–7 business days) on all orders above ₹5,000. Express Shipping (2–3 business days) available at ₹500. We offer hassle-free returns within 30 days of delivery for unworn, unaltered pieces in original packaging.",
    },
    {
      id: "certification",
      label: "Certification & Authenticity",
      content: "Every piece comes with a certificate of authenticity, hallmark certification for precious metals, and gemstone grading report where applicable. Our jewellery is crafted to BIS hallmarking standards.",
    },
  ];

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <div style={{ padding: "16px clamp(16px, 5vw, 60px)", background: "var(--ivory)", borderBottom: "1px solid var(--linen-dark)" }}>
        <div className="breadcrumb">
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
          {" / "}
          <span style={{ cursor: "pointer" }} onClick={() => navigate(`/category/${product.category}`)}>
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </span>
          {" / "}
          <span style={{ color: "var(--gold)" }}>{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="product-detail">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="gallery-thumbs">
            {displayImages.map((img, i) => (
              <div
                key={i}
                className={`gallery-thumb ${activeImg === i ? "active" : ""}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={img} alt={`${product.name} view ${i + 1}`} />
              </div>
            ))}
          </div>
          <div className="gallery-main">
            <img src={displayImages[activeImg]} alt={product.name} />
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-collection">{product.collection ?? product.category}</div>
          <h1 className="product-name">{product.name}</h1>
          {product.shortDescription && (
            <p className="product-subtitle">{product.shortDescription}</p>
          )}

          <div style={{ display: "flex", gap: "16px", alignItems: "center", margin: "24px 0" }}>
            <div className="product-price">{formatPrice(Number(product.price))}</div>
            {product.comparePrice && (
              <div style={{ fontSize: "16px", color: "var(--text-muted)", textDecoration: "line-through" }}>
                {formatPrice(Number(product.comparePrice))}
              </div>
            )}
          </div>

          <div className={`product-stock ${product.stock > 0 ? "in-stock" : ""}`}>
            {product.stock > 0
              ? product.stock <= 3
                ? `Only ${product.stock} left — order soon`
                : "In Stock — Ready to Ship"
              : "Currently Out of Stock"}
          </div>

          {/* Quantity */}
          {product.stock > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-dark)" }}>
                Quantity
              </span>
              <div className="cart-qty">
                <button className="cart-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="cart-qty-num">{qty}</span>
                <button className="cart-qty-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
              </div>
            </div>
          )}

          {product.stock > 0 ? (
            <>
              <button className="product-add-btn" onClick={handleAddToCart}>
                Add to Bag — {formatPrice(Number(product.price) * qty)}
              </button>
              <button className="product-wishlist-btn">
                Save to Wishlist
              </button>
            </>
          ) : (
            <button className="product-add-btn" style={{ background: "var(--text-muted)", cursor: "not-allowed" }} disabled>
              Out of Stock
            </button>
          )}

          {/* Trust Signals */}
          <div className="product-trust">
            <div className="trust-item">
              <Star size={16} color="var(--gold)" />
              <span className="trust-label">100+ Celebrity Looks</span>
              <span className="trust-desc">Worn by celebrities and style icons</span>
            </div>
            <div className="trust-item">
              <Wrench size={16} color="var(--gold)" />
              <span className="trust-label">Lifetime Warranty</span>
              <span className="trust-desc">Complimentary servicing for life</span>
            </div>
            <div className="trust-item">
              <Truck size={16} color="var(--gold)" />
              <span className="trust-label">Free Shipping</span>
              <span className="trust-desc">Insured delivery in 5–7 days</span>
            </div>
            <div className="trust-item">
              <RefreshCw size={16} color="var(--gold)" />
              <span className="trust-label">30-Day Returns</span>
              <span className="trust-desc">Hassle-free returns and exchanges</span>
            </div>
          </div>

          {/* Accordion */}
          <div className="product-accordion">
            {ACCORDION_ITEMS.map((item) => (
              <div key={item.id} className="accordion-item">
                <button
                  className="accordion-trigger"
                  onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                >
                  {item.label}
                  {openAccordion === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openAccordion === item.id && (
                  <div className="accordion-content">
                    {item.content.split("\n\n").map((para, i) => (
                      <p key={i} style={{ marginBottom: "12px" }}>{para}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{
          padding: "clamp(40px, 6vw, 80px) clamp(16px, 5vw, 60px)",
          background: "linear-gradient(135deg, var(--ivory) 0%, var(--linen) 100%)",
          borderTop: "1px solid var(--linen-dark)",
        }}>
          <div style={{ marginBottom: "40px" }}>
            <div className="section-eyebrow">You May Also Love</div>
            <h2 className="section-title">Related <em>Pieces</em></h2>
          </div>
          <div className="product-grid" style={{ padding: 0 }}>
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={p.name}
                collection={p.collection ?? undefined}
                price={Number(p.price)}
                comparePrice={p.comparePrice ? Number(p.comparePrice) : undefined}
                image={getCardImage(p.images, (p as any).imageTypes)}
                badge={p.isNewArrival ? "New" : p.isBestseller ? "Bestseller" : undefined}
                material={p.material ?? undefined}
              />
            ))}
          </div>
        </section>
      )}
    </StorefrontLayout>
  );
}

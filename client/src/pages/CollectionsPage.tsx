import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
];

const CATEGORY_TABS = [
  { label: "All", value: undefined },
  { label: "Rings", value: "rings" },
  { label: "Necklaces", value: "necklaces" },
  { label: "Earrings", value: "earrings" },
  { label: "Bracelets", value: "bracelets" },
];

export default function CollectionsPage() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState("featured");

  const { data: products, isLoading } = trpc.products.list.useQuery({
    category: activeCategory as "rings" | "necklaces" | "earrings" | "bracelets" | undefined,
    limit: 48,
  });

  const sortedProducts = products ? [...products].sort((a, b) => {
    if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
    if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  }) : [];

  return (
    <StorefrontLayout>
      {/* Hero */}
      <div className="category-hero">
        <div className="breadcrumb">
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
          {" / "}
          <span style={{ color: "var(--gold)" }}>All Collections</span>
        </div>
        <div className="section-eyebrow">Handcrafted Luxury</div>
        <h1 className="section-title">All <em>Collections</em></h1>
        <p className="section-desc" style={{ margin: "0 auto" }}>
          Explore our complete range of handcrafted jewellery — from timeless classics to contemporary statements.
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: "flex",
        gap: "0",
        padding: "0 60px",
        background: "var(--ivory)",
        borderBottom: "1px solid var(--linen-dark)",
        overflowX: "auto",
      }}>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveCategory(tab.value)}
            style={{
              padding: "14px 24px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: activeCategory === tab.value ? "var(--gold)" : "var(--text-muted)",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${activeCategory === tab.value ? "var(--gold)" : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="filter-label">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`sort-btn ${sortBy === opt.value ? "active" : ""}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "16px" }}>
          {sortedProducts.length} piece{sortedProducts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Products */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
          <div className="loading-spinner" />
        </div>
      ) : sortedProducts.length > 0 ? (
        <div className="product-grid">
          {sortedProducts.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              slug={p.slug}
              name={p.name}
              collection={p.collection ?? undefined}
              price={Number(p.price)}
              comparePrice={p.comparePrice ? Number(p.comparePrice) : undefined}
              image={Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined}
              badge={p.isNewArrival ? "New" : p.isBestseller ? "Bestseller" : undefined}
              material={p.material ?? undefined}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: "80px 60px" }}>
          <h3>Collection Coming Soon</h3>
          <p>Our artisans are crafting something extraordinary. Check back shortly.</p>
        </div>
      )}
    </StorefrontLayout>
  );
}

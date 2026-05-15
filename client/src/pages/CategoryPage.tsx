import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { getCardImage } from "@/lib/productImage";

const CATEGORY_META: Record<string, { title: string; subtitle: string; description: string }> = {
  rings: {
    title: "Rings",
    subtitle: "The Circle of Eternity",
    description: "From delicate solitaires to bold statement pieces, our ring collection celebrates every milestone and every mood.",
  },
  necklaces: {
    title: "Necklaces",
    subtitle: "Close to the Heart",
    description: "Layered chains, pendant drops, and statement chokers — each necklace is designed to frame your neckline with grace.",
  },
  earrings: {
    title: "Earrings",
    subtitle: "Frame Your Story",
    description: "From classic studs to dramatic chandeliers, our earring collection offers a piece for every occasion.",
  },
  bracelets: {
    title: "Bracelets",
    subtitle: "Adorned Wrists",
    description: "Delicate bangles, charm bracelets, and cuffs — each piece designed to catch the light and the eye.",
  },
};

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
];


const SUBCATEGORY_MAP: Record<string, string[]> = {
  rings: ["All", "Solitaire", "Cocktail", "Stackable", "Engagement", "Statement"],
  necklaces: ["All", "Pendant", "Choker", "Layered", "Chain", "Statement"],
  earrings: ["All", "Studs", "Hoops", "Drops", "Chandeliers", "Jhumkas"],
  bracelets: ["All", "Bangles", "Cuffs", "Charm", "Tennis", "Stackable"],
};

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const category = params.category as "rings" | "necklaces" | "earrings" | "bracelets";
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState("featured");

  const [subcategory, setSubcategory] = useState("All");

  const meta = CATEGORY_META[category] ?? {
    title: category.charAt(0).toUpperCase() + category.slice(1),
    subtitle: "Our Collection",
    description: "Discover our handcrafted collection.",
  };

  const subcategories = SUBCATEGORY_MAP[category] ?? ["All"];

  const { data: products, isLoading } = trpc.products.list.useQuery({
    category,
    subcategory: subcategory !== "All" ? subcategory.toLowerCase() : undefined,
    limit: 24,
  });

  const sortedProducts = products ? [...products].sort((a, b) => {
    if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
    if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  }) : [];

  const filteredProducts = sortedProducts;

  return (
    <StorefrontLayout>
      {/* Category Hero */}
      <div className="category-hero">
        <div className="breadcrumb">
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
          {" / "}
          <span>Collections</span>
          {" / "}
          <span style={{ color: "var(--gold)" }}>{meta.title}</span>
        </div>
        <div className="section-eyebrow">{meta.subtitle}</div>
        <h1 className="section-title">{meta.title}</h1>
        <p className="section-desc" style={{ margin: "0 auto" }}>{meta.description}</p>
      </div>

      {/* Subcategory Tabs */}
      <div style={{
        display: "flex",
        gap: "0",
        padding: "0 clamp(16px, 5vw, 60px)",
        background: "var(--ivory)",
        borderBottom: "1px solid var(--linen-dark)",
        overflowX: "auto",
      }}>
        {subcategories.map((sub) => (
          <button
            key={sub}
            onClick={() => setSubcategory(sub)}
            style={{
              padding: "14px 20px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: subcategory === sub ? "var(--gold)" : "var(--text-muted)",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${subcategory === sub ? "var(--gold)" : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
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
          {filteredProducts.length} piece{filteredProducts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "clamp(40px, 6vw, 80px)" }}>
          <div className="loading-spinner" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((p) => (
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
      ) : (
        <div className="empty-state" style={{ padding: "clamp(40px, 6vw, 80px) clamp(16px, 5vw, 60px)" }}>
          <h3>No Pieces Found</h3>
          <p>Try adjusting your filters or explore our other collections.</p>
          <button className="btn-primary" style={{ marginTop: "24px" }} onClick={() => { setSubcategory("All"); }}>
            Clear Filters
          </button>
        </div>
      )}
    </StorefrontLayout>
  );
}

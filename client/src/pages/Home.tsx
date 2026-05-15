import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getCardImage } from "@/lib/productImage";

const TICKER_ITEMS = [
  "Hallmarked 925 Sterling Silver",
  "18K Gold Plating",
  "Certified Gemstones",
  "Complimentary Gift Wrapping",
  "Free Shipping Above ₹5,000",
  "Handcrafted by Master Artisans",
  "30-Day Returns",
  "Ethically Sourced Materials",
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&q=80",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80",
  "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&q=80",
];

const CATEGORY_TABS = ["All", "Rings", "Necklaces", "Earrings", "Bracelets"];



export default function Home() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("All");
  const [email, setEmail] = useState("");

  const { data: celebrities } = trpc.celebrities.list.useQuery({});

  const { data: heroData } = trpc.siteSettings.getHeroImage.useQuery();  
  const heroImageUrl = heroData?.url ?? "/manus-storage/hero_banner_5729f2e3.webp";

  const categoryFilter = activeTab === "All" ? undefined : activeTab.toLowerCase() as "rings" | "necklaces" | "earrings" | "bracelets";

  const { data: featuredProducts, isLoading: loadingFeatured } = trpc.products.list.useQuery({
    limit: 8,
    category: categoryFilter,
  });

  const { data: bestsellers, isLoading: loadingBest } = trpc.products.list.useQuery({
    isBestseller: true,
    limit: 5,
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success("You're on the list!", {
        description: "Thank you for joining The Jewel Gallery family.",
      });
      setEmail("");
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <div className="hero-eyebrow">New Collection 2025</div>
          <h1 className="hero-h1">
            Where <em>Artistry</em><br />
            Meets<br />
            <em>Elegance</em>
          </h1>
          <p className="hero-sub">
            Each piece in our collection is a testament to the timeless craft of Indian jewellery-making —
            handcrafted by master artisans using hallmarked sterling silver, 18K gold, and certified gemstones.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => navigate("/collections")}>
              Explore Collections
            </button>
            <button className="btn-ghost" onClick={() => navigate("/celebrity")}>
              As Worn By
            </button>
          </div>
            <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">2,400+</span>
              <span className="stat-label">Pieces Crafted</span>
            </div>
            <div className="stat">
              <span className="stat-num">18</span>
              <span className="stat-label">Collections</span>
            </div>
            <div className="stat">
              <span className="stat-num">12+</span>
              <span className="stat-label">Years of Craft</span>
            </div>
            <div className="stat">
              <span className="stat-num">4.9★</span>
              <span className="stat-label">Client Rating</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={heroImageUrl}
            alt="Luxury jewellery collection"
            className="hero-img"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
        </div>
      </section>

      {/* ── Scrolling Ticker Bar ── */}
      <div style={{
        background: "#1A1008",
        overflow: "hidden",
        padding: "14px 0",
        borderTop: "1px solid #3A2A18",
        borderBottom: "1px solid #3A2A18",
      }}>
        <div style={{
          display: "flex",
          animation: "ticker-scroll 28s linear infinite",
          whiteSpace: "nowrap",
          width: "max-content",
        }}>
          {[...Array(4)].map((_, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              {[
                "FREE SHIPPING IN INDIA",
                "WORN BY 200+ CELEBRITIES",
                "LIFETIME SERVICE",
                "HALLMARKED 925 STERLING SILVER",
                "CERTIFIED GEMSTONES",
              ].map((item, j) => (
                <span key={j} style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    color: "#E8D5B0",
                    padding: "0 36px",
                    textTransform: "uppercase",
                  }}>{item}</span>
                  <span style={{ color: "#C9A96E", fontSize: "8px", lineHeight: 1 }}>◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Collections Section */}
      <section className="collections">
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div className="section-eyebrow">Our Collections</div>
          <h2 className="section-title">
            Curated with <em>Intention</em>
          </h2>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Discover pieces that tell a story — from heirloom-inspired classics to contemporary statements,
            each collection is thoughtfully designed for the discerning woman.
          </p>
        </div>

        <div className="collection-tabs">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              className={`collection-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loadingFeatured ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <div className="loading-spinner" />
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="collection-grid">
            {featuredProducts.map((p) => (
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
          <div className="empty-state">
            <h3>Collection Coming Soon</h3>
            <p>Our artisans are crafting something extraordinary. Check back shortly.</p>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <button
            className="btn-ghost"
            onClick={() => navigate(activeTab === "All" ? "/collections" : `/category/${activeTab.toLowerCase()}`)}
          >
            View All {activeTab === "All" ? "Collections" : activeTab}
          </button>
        </div>
      </section>

      {/* Celebrity Section */}
      <section className="celebrity-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "50px" }}>
          <div>
            <div className="section-eyebrow">As Worn By</div>
            <h2 className="section-title">
              Adorned by <em>Icons</em>
            </h2>
            <p className="section-desc">
              Distinguished artistes and cultural icons have chosen The Jewel Gallery for their most
              memorable moments. Discover the pieces that graced the spotlight.
            </p>
          </div>
          <button className="btn-ghost" onClick={() => navigate("/celebrity")} style={{ flexShrink: 0 }}>
            View All
          </button>
        </div>

        <div className="celeb-grid">
          {(celebrities ?? []).slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="celeb-card"
              onClick={() => navigate(`/celebrity/${c.slug}`)}
            >
              <div className="celeb-card-img">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} loading="lazy" />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: "40px" }}>◆</div>
                )}
              </div>
              <div className="celeb-card-name">{c.name}</div>
              <div className="celeb-card-role">{c.designation ?? ""}</div>
              {c.style && <div className="celeb-card-desc">{c.style}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="bestsellers-section-v3">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0" }}>
          <div>
            <div className="section-eyebrow">Most Coveted</div>
            <h2 className="section-title">
              Our <em>Bestsellers</em>
            </h2>
          </div>
          <button className="btn-ghost" onClick={() => navigate("/collections")}>
            Shop All
          </button>
        </div>

        {loadingBest ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <div className="loading-spinner" />
          </div>
        ) : bestsellers && bestsellers.length > 0 ? (
          <div className="bestsellers-grid-v3">
            {bestsellers.map((p) => (
              <div
                key={p.id}
                className="bestseller-card-v3"
                onClick={() => navigate(`/product/${p.slug}`)}
              >
                <div className="bestseller-img-wrap-v3">
                  {getCardImage(p.images, (p as any).imageTypes) ? (
                    <img src={getCardImage(p.images, (p as any).imageTypes)!} alt={p.name} loading="lazy" />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, var(--linen) 0%, var(--ivory-deep) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      fontSize: "40px",
                    }}>
                      ◆
                    </div>
                  )}
                  <span className="bestseller-badge-v3">Bestseller</span>
                </div>
                <div className="bestseller-info-v3">
                  <div className="bestseller-name-v3">{p.name}</div>
                  {p.material && <div className="bestseller-material-v3">{p.material}</div>}
                  <div className="bestseller-price-v3">{formatPrice(Number(p.price))}</div>
                  <button className="bestseller-view-v3">View Piece</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Bestsellers Coming Soon</h3>
          </div>
        )}
      </section>

      {/* Brand Story */}
      <section className="brand-story">
        <div className="brand-story-text">
          <div className="section-eyebrow">Our Story</div>
          <h2>
            Crafted with <em>Legacy</em>,<br />
            Worn with <em>Pride</em>
          </h2>
          <p>
            The Jewel Gallery was born from a deep reverence for India's rich jewellery-making tradition.
            Every piece we create honours the centuries-old craft of our master artisans, who bring
            generations of skill and passion to each creation.
          </p>
          <blockquote>
            "We don't just make jewellery. We craft heirlooms — pieces that carry stories,
            mark milestones, and are passed down through generations."
          </blockquote>
          <p>
            From the delicate filigree of our Mughal-inspired collection to the bold geometry of our
            contemporary line, every piece is a dialogue between tradition and modernity.
          </p>
          <button className="btn-primary" onClick={() => navigate("/collections")} style={{ marginTop: "16px" }}>
            Explore Our Story
          </button>
        </div>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <img
            src="/manus-storage/jewel-gallery-store_f3105046.jpg"
            alt="The Jewel Gallery store"
            style={{ width: "100%", height: "500px", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute",
            bottom: "24px",
            left: "24px",
            background: "rgba(250,246,240,0.95)",
            padding: "20px 24px",
            maxWidth: "220px",
          }}>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "4px" }}>
              Since 2018
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--text-dark)" }}>
              Handcrafted in India
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <div className="section-eyebrow" style={{ color: "var(--gold-light)" }}>Stay Connected</div>
        <h2>
          Join The <em>Inner Circle</em>
        </h2>
        <p>
          Be the first to discover new collections, exclusive previews, and invitations to private events.
          Your details are held in the strictest confidence.
        </p>
        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
          <input
            type="email"
            className="newsletter-input"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="newsletter-btn">
            Subscribe
          </button>
        </form>
        <p style={{ fontSize: "10px", color: "rgba(250,246,240,0.3)", marginTop: "16px", marginBottom: 0 }}>
          We respect your privacy. Unsubscribe at any time.
        </p>
      </section>
    </StorefrontLayout>
  );
}

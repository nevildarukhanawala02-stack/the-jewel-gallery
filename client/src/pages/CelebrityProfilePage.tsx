import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";

const FALLBACK_PROFILES: Record<string, {
  name: string; designation: string; imageUrl: string; bio: string; style: string; occasion: string;
}> = {
  "deepika-padukone": {
    name: "Deepika Padukone",
    designation: "Film Artiste",
    imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
    bio: "Renowned for her grace and poise, she has consistently chosen The Jewel Gallery for her most iconic appearances. Her selection reflects an impeccable taste for pieces that balance tradition with contemporary elegance.",
    style: "Classic Elegance",
    occasion: "Awards",
  },
  "anushka-sharma": {
    name: "Anushka Sharma",
    designation: "Film Artiste",
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    bio: "Her bridal jewellery choices have set trends across the country. Known for selecting pieces that honour Indian craftsmanship while embracing modern sensibilities.",
    style: "Bridal",
    occasion: "Wedding",
  },
  "kareena-kapoor": {
    name: "Kareena Kapoor",
    designation: "Film Artiste",
    imageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80",
    bio: "A style icon who effortlessly transitions between heritage pieces and contemporary statements. Her festive jewellery choices have inspired countless admirers.",
    style: "Statement",
    occasion: "Festive",
  },
  "priyanka-chopra": {
    name: "Priyanka Chopra",
    designation: "Global Artiste",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    bio: "A global ambassador for Indian culture and craftsmanship, she has worn The Jewel Gallery on international stages, bringing our heritage to the world.",
    style: "Contemporary",
    occasion: "International",
  },
};

export default function CelebrityProfilePage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const { data: celebrityData, isLoading } = trpc.celebrities.bySlug.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const { data: products } = trpc.products.list.useQuery({ limit: 4 });

  const profile = (celebrityData?.celebrity as typeof FALLBACK_PROFILES[string] | undefined) ?? FALLBACK_PROFILES[params.slug];

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="loading-spinner" />
        </div>
      </StorefrontLayout>
    );
  }

  if (!profile) {
    return (
      <StorefrontLayout>
        <div className="empty-state" style={{ padding: "120px 60px" }}>
          <h3>Profile Not Found</h3>
          <p>Explore our other featured artistes.</p>
          <button className="btn-primary" style={{ marginTop: "24px" }} onClick={() => navigate("/celebrity")}>
            View All
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <div style={{ padding: "16px 60px", background: "var(--ivory)", borderBottom: "1px solid var(--linen-dark)" }}>
        <div className="breadcrumb">
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
          {" / "}
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/celebrity")}>As Worn By</span>
          {" / "}
          <span style={{ color: "var(--gold)" }}>{profile.name}</span>
        </div>
      </div>

      {/* Profile Hero */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "60vh",
        background: "linear-gradient(135deg, var(--ivory) 0%, var(--linen) 100%)",
      }}>
        {/* Image */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          {profile.imageUrl ? (
            <img
              src={profile.imageUrl}
              alt={profile.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: "500px" }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              minHeight: "500px",
              background: "linear-gradient(135deg, var(--linen) 0%, var(--ivory-deep) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold)",
              fontSize: "60px",
            }}>
              ◆
            </div>
          )}
          {profile.style && (
            <div style={{
              position: "absolute",
              bottom: "24px",
              left: "24px",
              background: "rgba(250,246,240,0.95)",
              padding: "12px 20px",
            }}>
              <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "4px" }}>
                Style
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", color: "var(--text-dark)" }}>
                {profile.style}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="section-eyebrow">As Worn By</div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 4vw, 56px)",
            fontWeight: 300,
            color: "var(--text-dark)",
            lineHeight: 1.1,
            marginBottom: "8px",
          }}>
            {profile.name}
          </h1>
          <div style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "32px",
          }}>
            {profile.designation}
          </div>

          {profile.bio && (
            <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.8, marginBottom: "32px" }}>
              {profile.bio}
            </p>
          )}

          {profile.occasion && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
              <div style={{
                padding: "8px 16px",
                background: "rgba(201,169,110,0.1)",
                border: "1px solid rgba(201,169,110,0.3)",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--gold)",
              }}>
                {profile.occasion}
              </div>
            </div>
          )}

          <button className="btn-primary" onClick={() => navigate("/collections")}>
            Shop The Collection
          </button>
        </div>
      </div>

      {/* Linked Products */}
      {products && products.length > 0 && (
        <section style={{
          padding: "80px 60px",
          background: "linear-gradient(135deg, var(--ivory) 0%, var(--linen) 100%)",
          borderTop: "1px solid var(--linen-dark)",
        }}>
          <div style={{ marginBottom: "40px" }}>
            <div className="section-eyebrow">Pieces Worn By {profile.name.split(" ")[0]}</div>
            <h2 className="section-title">The <em>Collection</em></h2>
          </div>
          <div className="product-grid" style={{ padding: 0 }}>
            {products.slice(0, 4).map((p) => (
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
        </section>
      )}
    </StorefrontLayout>
  );
}

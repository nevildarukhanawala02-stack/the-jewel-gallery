import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { getCardImage } from "@/lib/productImage";
import { useEffect } from "react";
import { getSessionId } from "@/lib/analytics";

// Gallery image tile component
function GalleryImageItem({ url, featured }: { url: string; featured: boolean }) {
  return (
    <div style={{
      overflow: "hidden",
      borderRadius: "4px",
      aspectRatio: featured ? "3/4" : "4/5",
      background: "#f5f0eb",
    }}>
      <img
        src={url}
        alt="Celebrity gallery"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
          transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
      />
    </div>
  );
}

export default function CelebrityProfilePage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const { data: celebrityData, isLoading } = trpc.celebrities.bySlug.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const { data: allCelebrities } = trpc.celebrities.list.useQuery({});

  const profile = celebrityData?.celebrity as {
    id: number; name: string; slug: string; designation?: string | null;
    imageUrl?: string | null; bio?: string | null; style?: string | null; occasion?: string | null;
    photos?: string[] | null;
  } | undefined;

  const relatedCelebrities = (allCelebrities ?? []).filter((c) => c.slug !== params.slug).slice(0, 4);

  const trackEvent = trpc.analytics.track.useMutation();
  useEffect(() => {
    if (profile?.id) {
      trackEvent.mutate({ sessionId: getSessionId(), eventType: "page_view", celebrityId: profile.id, pagePath: `/celebrity/${params.slug}` });
    }
  }, [profile?.id]);

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--linen-dark)",
            borderTopColor: "var(--gold)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      </StorefrontLayout>
    );
  }

  if (!profile) {
    return (
      <StorefrontLayout>
        <div style={{ textAlign: "center", padding: "clamp(48px, 8vw, 120px) clamp(16px, 5vw, 60px)" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", marginBottom: "12px" }}>
            Profile Not Found
          </h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Explore our other featured artistes.
          </p>
          <button
            style={{
              background: "var(--gold)",
              color: "var(--ivory)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "14px 32px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => navigate("/celebrity")}
          >
            View All Celebrities
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  // Use linked products from the bySlug query (celebrity_products join table)
  const linkedProducts = celebrityData?.products ?? [];
  const productCount = linkedProducts.length;

  return (
    <StorefrontLayout>
      {/* Main Container */}
      <div style={{ background: "var(--ivory)", padding: "clamp(24px, 5vw, 60px) clamp(16px, 5vw, 60px)", minHeight: "calc(100vh - 72px)" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: "40px", fontSize: "12px", letterSpacing: "1px" }}>
          <span
            style={{ color: "var(--gold)", cursor: "pointer", transition: "color 0.3s ease" }}
            onClick={() => navigate("/celebrity")}
          >
            Celebrity Looks
          </span>
          <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--text-muted)" }}>{profile.name}</span>
        </div>

        {/* Hero Section */}
        <div className="celeb-profile-hero">
          {/* Hero Image */}
          <div className="celeb-profile-hero-img">
            {profile.imageUrl ? (
              <img
                src={profile.imageUrl}
                alt={profile.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
                fontSize: "60px",
              }}>
                ◆
              </div>
            )}
          </div>

          {/* Hero Content */}
          <div>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 400,
              marginBottom: "16px",
              color: "var(--text-dark)",
            }}>
              {profile.name}
            </h1>
            {profile.designation && (
              <div style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "20px",
              }}>
                {profile.designation}
              </div>
            )}
            {profile.bio && (
              <p style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
                marginBottom: "24px",
              }}>
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: "24px", marginTop: "32px", flexWrap: "wrap" }}>
              <div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "var(--gold)",
                }}>
                  {productCount}
                </div>
                <div style={{
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}>
                  Products
                </div>
              </div>
              {profile.occasion && (
                <div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    fontWeight: 400,
                    color: "var(--gold)",
                  }}>
                    {profile.occasion}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}>
                    Occasion
                  </div>
                </div>
              )}
              {profile.style && (
                <div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    fontWeight: 400,
                    color: "var(--gold)",
                  }}>
                    {profile.style}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}>
                    Style
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Section — shown only if galleryImages exist */}
        {(() => {
          let galleryUrls: string[] = [];
          try {
            const raw = (profile as { galleryImages?: string | null }).galleryImages;
            if (raw) galleryUrls = JSON.parse(raw);
          } catch { /* ignore */ }
          if (!galleryUrls.length) return null;
          return (
            <div style={{ marginBottom: "72px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(22px, 3vw, 30px)",
                  fontWeight: 400,
                  color: "var(--text-dark)",
                  marginBottom: "6px",
                }}>Gallery</h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {profile.name} wearing The Jewel Gallery
                </p>
              </div>
              <div className={`celeb-profile-gallery celeb-profile-gallery-${Math.min(galleryUrls.length, 6)}`}>
                {galleryUrls.map((url, idx) => (
                  <GalleryImageItem key={url} url={url} featured={idx === 0} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Products Section */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "32px",
            fontWeight: 400,
            marginBottom: "8px",
            color: "var(--text-dark)",
          }}>
            Shop the Look
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Jewelry pieces worn by {profile.name}
          </p>
        </div>

        {linkedProducts.length > 0 ? (
          <div className="celeb-profile-products">
            {linkedProducts.map((row) => {
              const p = row.product;
              return (
                <div
                  key={p.id}
                  style={{
                    background: "white",
                    border: "1px solid var(--linen-dark)",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                    el.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = "none";
                    el.style.transform = "translateY(0)";
                  }}
                  onClick={() => navigate(`/product/${p.slug}`)}
                >
                  <div style={{ width: "100%", height: "300px", background: "var(--ivory-deep)", overflow: "hidden" }}>
                    <img
                      src={getCardImage(p.images, (p as any).imageTypes)}
                      alt={p.name}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ padding: "24px" }}>
                    <h3 style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "16px",
                      fontWeight: 400,
                      marginBottom: "8px",
                      color: "var(--text-dark)",
                    }}>
                      {p.name}
                    </h3>
                    {p.material && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                        {p.material}
                      </p>
                    )}
                    <div style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "20px",
                      fontWeight: 400,
                      color: "var(--gold)",
                      marginBottom: "16px",
                    }}>
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </div>
                    <button
                      style={{
                        background: "var(--gold)",
                        color: "var(--ivory)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        padding: "12px 20px",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.3s ease",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--gold-dark)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--gold)"; }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${p.slug}`);
                      }}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "60px 0",
            marginBottom: "60px",
            border: "1px solid var(--linen-dark)",
            background: "var(--ivory-deep)",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--gold)", marginBottom: "12px" }}>◆</div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Product collection coming soon</p>
          </div>
        )}

        {/* Related Celebrities */}
        {relatedCelebrities.length > 0 && (
          <div style={{
            marginTop: "80px",
            paddingTop: "60px",
            borderTop: "2px solid var(--linen-dark)",
          }}>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "28px",
              fontWeight: 400,
              marginBottom: "32px",
              color: "var(--text-dark)",
            }}>
              Explore Other Celebrity Looks
            </h2>
            <div className="celeb-profile-related">
              {relatedCelebrities.map((c) => (
                <div
                  key={c.id}
                  style={{
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  onClick={() => navigate(`/celebrity/${c.slug}`)}
                >
                  <div style={{
                    width: "100%",
                    height: "280px",
                    background: "var(--ivory-deep)",
                    border: "1px solid var(--linen-dark)",
                    overflow: "hidden",
                    marginBottom: "12px",
                  }}>
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                        fontSize: "36px",
                      }}>
                        ◆
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "var(--text-dark)",
                  }}>
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <button
            style={{
              background: "transparent",
              color: "var(--text-dark)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              padding: "12px 24px",
              border: "1px solid var(--linen-dark)",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--gold)";
              el.style.color = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--linen-dark)";
              el.style.color = "var(--text-dark)";
            }}
            onClick={() => navigate("/celebrity")}
          >
            Back to Celebrity Looks
          </button>
        </div>
      </div>
    </StorefrontLayout>
  );
}

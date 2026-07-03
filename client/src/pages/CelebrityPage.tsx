import StorefrontLayout from "@/components/StorefrontLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

const STYLE_OPTIONS = ["All Styles", "Statement Pieces", "Evening Wear", "Casual Luxury", "Bridal"];
const OCCASION_OPTIONS = ["All Occasions", "Awards Show", "Red Carpet", "Event", "Wedding"];

export default function CelebrityPage() {
  const [, navigate] = useLocation();
  const [styleFilter, setStyleFilter] = useState("");
  const [occasionFilter, setOccasionFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data: celebrities, isLoading } = trpc.celebrities.list.useQuery({});

  const filtered = (celebrities ?? []).filter((c) => {
    const matchStyle = !styleFilter || c.style === styleFilter;
    const matchOccasion = !occasionFilter || c.occasion === occasionFilter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchStyle && matchOccasion && matchSearch;
  });

  return (
    <StorefrontLayout>
      {/* Category Hero */}
      <section style={{
        background: "var(--ivory)",
        padding: "clamp(48px, 8vw, 100px) clamp(16px, 5vw, 60px)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: "24px",
          }}>
            COLLECTIONS / CELEBRITY LOOKS
          </div>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: "16px",
            color: "var(--text-dark)",
          }}>
            Worn by <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Celebrities</em>
          </h1>
          <p style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
            maxWidth: "600px",
            margin: "0 auto",
          }}>
            Discover the jewelry pieces worn by your favorite celebrities and style icons.
            Shop the exact looks from red carpet moments, award shows, and exclusive events.
            Elevate your style with pieces loved by the stars.
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section style={{
        background: "var(--ivory)",
        padding: "24px clamp(16px, 5vw, 60px)",
        borderBottom: "1px solid var(--linen-dark)",
        borderTop: "1px solid var(--linen-dark)",
      }}>
        <div className="celeb-filter-bar">
          {/* Search */}
          <div className="celeb-filter-search">
            <input
              type="text"
              placeholder="Search by celebrity name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "10px 16px",
                border: "1px solid var(--linen-dark)",
                background: "white",
                color: "var(--text-dark)",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                width: "100%",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--gold)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--linen-dark)"; }}
            />
          </div>

          {/* Filters */}
          <div className="celeb-filter-dropdowns">
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}>
              Filter By:
            </span>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value === "All Styles" ? "" : e.target.value)}
              style={{
                padding: "10px 16px",
                border: "1px solid var(--linen-dark)",
                background: "white",
                color: "var(--text-dark)",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {STYLE_OPTIONS.map((s) => (
                <option key={s} value={s === "All Styles" ? "" : s}>{s}</option>
              ))}
            </select>
            <select
              value={occasionFilter}
              onChange={(e) => setOccasionFilter(e.target.value === "All Occasions" ? "" : e.target.value)}
              style={{
                padding: "10px 16px",
                border: "1px solid var(--linen-dark)",
                background: "white",
                color: "var(--text-dark)",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {OCCASION_OPTIONS.map((o) => (
                <option key={o} value={o === "All Occasions" ? "" : o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Celebrities Grid */}
      <section style={{
        background: "var(--ivory)",
        padding: "clamp(32px, 5vw, 60px) clamp(16px, 5vw, 60px)",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--linen-dark)",
                borderTopColor: "var(--gold)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto",
              }} />
            </div>
          ) : filtered.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 45vw), 1fr))",
              gap: "clamp(16px, 3vw, 40px)",
              marginBottom: "60px",
            }}>
              {filtered.map((c) => (
                <CelebrityCard
                  key={c.id}
                  celebrity={c}
                  onClick={() => navigate(`/celebrity/${c.slug}`)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", marginBottom: "12px" }}>
                No Results Found
              </h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                Try adjusting your search or filters.
              </p>
              <button
                style={{
                  background: "var(--gold)",
                  color: "var(--ivory)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "12px 24px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => { setSearch(""); setStyleFilter(""); setOccasionFilter(""); }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </StorefrontLayout>
  );
}

function CelebrityCard({
  celebrity,
  onClick,
}: {
  celebrity: { id: number; name: string; designation?: string | null; imageUrl?: string | null; style?: string | null; occasion?: string | null };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        cursor: "pointer",
        transition: "transform 0.3s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {/* Image */}
      <div style={{
        width: "100%",
        height: "400px",
        background: "var(--ivory-deep)",
        border: "1px solid var(--linen-dark)",
        overflow: "hidden",
        position: "relative",
      }}>
        {celebrity.imageUrl ? (
          <img
            src={celebrity.imageUrl}
            alt={celebrity.name}
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
            fontSize: "48px",
          }}>
            ◆
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 400, color: "var(--text-dark)", lineHeight: 1.3 }}>
        {celebrity.name}
      </div>
      {celebrity.designation && (
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "-8px" }}>
          {celebrity.designation}
        </div>
      )}

      {/* CTA */}
      <button
        style={{
          background: "var(--gold)",
          color: "var(--ivory)",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          padding: "12px 24px",
          border: "none",
          cursor: "pointer",
          transition: "background 0.3s ease",
          width: "100%",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--gold-dark)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--gold)"; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        View Look
      </button>
    </div>
  );
}

import StorefrontLayout from "@/components/StorefrontLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

const FALLBACK_CELEBRITIES = [
  { id: 1, name: "Deepika Padukone", slug: "deepika-padukone", designation: "Film Artiste", imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80", style: "Classic Elegance", occasion: "Awards" },
  { id: 2, name: "Anushka Sharma", slug: "anushka-sharma", designation: "Film Artiste", imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80", style: "Bridal", occasion: "Wedding" },
  { id: 3, name: "Kareena Kapoor", slug: "kareena-kapoor", designation: "Film Artiste", imageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80", style: "Statement", occasion: "Festive" },
  { id: 4, name: "Priyanka Chopra", slug: "priyanka-chopra", designation: "Global Artiste", imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80", style: "Contemporary", occasion: "International" },
  { id: 5, name: "Alia Bhatt", slug: "alia-bhatt", designation: "Film Artiste", imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80", style: "Minimalist", occasion: "Casual" },
  { id: 6, name: "Katrina Kaif", slug: "katrina-kaif", designation: "Film Artiste", imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80", style: "Glamour", occasion: "Red Carpet" },
  { id: 7, name: "Sonam Kapoor", slug: "sonam-kapoor", designation: "Style Icon", imageUrl: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=400&q=80", style: "Avant-Garde", occasion: "Fashion Week" },
  { id: 8, name: "Vidya Balan", slug: "vidya-balan", designation: "Film Artiste", imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", style: "Heritage", occasion: "Cultural Events" },
];

const STYLE_FILTERS = ["All", "Classic Elegance", "Bridal", "Statement", "Contemporary", "Minimalist", "Heritage", "Glamour"];
const OCCASION_FILTERS = ["All", "Awards", "Wedding", "Festive", "Red Carpet", "International", "Casual"];

export default function CelebrityPage() {
  const [, navigate] = useLocation();
  const [styleFilter, setStyleFilter] = useState("All");
  const [occasionFilter, setOccasionFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { data: celebrities } = trpc.celebrities.list.useQuery({});

  const displayList = (celebrities && celebrities.length > 0 ? celebrities : FALLBACK_CELEBRITIES);

  const filtered = displayList.filter((c) => {
    const matchStyle = styleFilter === "All" || c.style === styleFilter;
    const matchOccasion = occasionFilter === "All" || c.occasion === occasionFilter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchStyle && matchOccasion && matchSearch;
  });

  return (
    <StorefrontLayout>
      {/* Hero */}
      <div className="category-hero">
        <div className="breadcrumb">
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
          {" / "}
          <span style={{ color: "var(--gold)" }}>As Worn By</span>
        </div>
        <div className="section-eyebrow">Adorned by Icons</div>
        <h1 className="section-title">As <em>Worn By</em></h1>
        <p className="section-desc" style={{ margin: "0 auto" }}>
          Distinguished artistes and cultural icons have chosen The Jewel Gallery for their most memorable moments.
          Discover the pieces that graced the spotlight.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        padding: "24px 60px",
        background: "var(--ivory)",
        borderBottom: "1px solid var(--linen-dark)",
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 16px",
            border: "1px solid var(--linen-dark)",
            background: "white",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--text-dark)",
            outline: "none",
            width: "200px",
          }}
        />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="filter-label">Style:</span>
          {STYLE_FILTERS.map((f) => (
            <button
              key={f}
              className={`sort-btn ${styleFilter === f ? "active" : ""}`}
              onClick={() => setStyleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="filter-label">Occasion:</span>
          {OCCASION_FILTERS.map((f) => (
            <button
              key={f}
              className={`sort-btn ${occasionFilter === f ? "active" : ""}`}
              onClick={() => setOccasionFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Celebrity Grid */}
      <div style={{
        padding: "60px",
        background: "linear-gradient(135deg, var(--ivory) 0%, var(--linen) 100%)",
      }}>
        {filtered.length > 0 ? (
          <div className="celeb-grid">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="celeb-card"
                onClick={() => navigate(`/celebrity/${c.slug}`)}
              >
                <div className="celeb-card-img">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} loading="lazy" />
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
                </div>
                <div className="celeb-card-name">{c.name}</div>
                <div className="celeb-card-role">{c.designation}</div>
                {c.style && (
                  <div style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    background: "rgba(201,169,110,0.1)",
                    border: "1px solid rgba(201,169,110,0.3)",
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    marginTop: "8px",
                  }}>
                    {c.style}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No Results Found</h3>
            <p>Try adjusting your search or filters.</p>
            <button className="btn-primary" style={{ marginTop: "24px" }} onClick={() => { setSearch(""); setStyleFilter("All"); setOccasionFilter("All"); }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}

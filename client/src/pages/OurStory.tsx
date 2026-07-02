import StorefrontLayout from "@/components/StorefrontLayout";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";

const CELEBRITIES = [
  {
    name: "Poonam Pandey",
    designation: "Actress & Model",
    slug: "poonam-pandey",
    imageUrl: "/images/celebrity-poonam-pandey.jpg",
    quote: "The Jewel Gallery pieces feel like they were made for me — every stone tells a story.",
  },
  {
    name: "Isha Koppikar",
    designation: "Actress",
    slug: "isha-koppikar",
    imageUrl: "/images/celebrity-isha-koppikar.jpg",
    quote: "Timeless craftsmanship that elevates every look — from red carpet to everyday elegance.",
  },
  {
    name: "Bindu Madhavi",
    designation: "Actress",
    slug: "bindu-madhavi",
    imageUrl: "/images/celebrity-bindu-madhavi.jpg",
    quote: "I love how each piece blends traditional artistry with a modern, wearable sensibility.",
  },
  {
    name: "Neha Chudasama",
    designation: "Model & Actress",
    slug: "neha-chudasama",
    imageUrl: "/images/celebrity-neha-chudasama.jpg",
    quote: "Statement pieces that make you feel powerful the moment you put them on.",
  },
  {
    name: "Avneet Kaur",
    designation: "Actress & Influencer",
    slug: "avneet-kaur",
    imageUrl: "/images/celebrity-avneet-kaur.jpg",
    quote: "Classic elegance meets modern trends — The Jewel Gallery always delivers.",
  },
];

const STORY_CAROUSEL_IMAGES = [
  { src: "/images/jewel-necklace-set.jpg", alt: "Lakshmi necklace set with jhumka earrings" },
  { src: "/images/jewel-pendant-closeup.jpg", alt: "Lakshmi pendant closeup — intricate gold craftsmanship" },
  { src: "/images/jewel-earrings.jpg", alt: "Lakshmi jhumka earrings with emerald beads" },
];

const BRAND_PILLARS = [
  {
    icon: "◆",
    title: "Handcrafted Mastery",
    desc: "Every piece is shaped by hand in our Mumbai atelier, where master artisans trained in generations-old techniques bring each design to life.",
  },
  {
    icon: "❋",
    title: "Celebrity Endorsed",
    desc: "Worn by 200+ celebrities and style icons across India, our pieces have graced red carpets, award shows, and editorial spreads.",
  },
  {
    icon: "◈",
    title: "Lifetime Partnership",
    desc: "We stand behind every piece with complimentary lifetime servicing — because jewellery that lasts a lifetime deserves care that does too.",
  },
];

function StoryCarousel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
    }, 400);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % STORY_CAROUSEL_IMAGES.length);
    }, 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "420px", background: "#f5f0ea" }}>
      {STORY_CAROUSEL_IMAGES.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: i === active ? 1 : 0,
            transition: "opacity 0.7s cubic-bezier(0.23,1,0.32,1)",
            display: "block",
          }}
        />
      ))}
      {/* Badge */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        left: "24px",
        background: "var(--ivory)",
        padding: "16px 24px",
        borderLeft: "3px solid var(--gold)",
        zIndex: 2,
      }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "4px" }}>Since 2014</div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", color: "var(--text-dark)" }}>Handcrafted in India</div>
      </div>
      {/* Dot indicators */}
      <div style={{
        position: "absolute",
        bottom: "24px",
        right: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 2,
      }}>
        {STORY_CAROUSEL_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`View image ${i + 1}`}
            style={{
              width: i === active ? "8px" : "6px",
              height: i === active ? "24px" : "6px",
              borderRadius: i === active ? "4px" : "50%",
              background: i === active ? "var(--gold)" : "rgba(255,255,255,0.6)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function OurStory() {
  const [, navigate] = useLocation();

  return (
    <StorefrontLayout>
      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(135deg, var(--ivory) 0%, var(--linen) 100%)",
        padding: "clamp(60px, 10vw, 120px) clamp(20px, 6vw, 80px)",
        textAlign: "center",
        borderBottom: "1px solid var(--linen-dark)",
      }}>
        <div className="section-eyebrow">Our Story</div>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(36px, 6vw, 72px)",
          fontWeight: 400,
          lineHeight: 1.15,
          color: "var(--text-dark)",
          marginBottom: "24px",
          maxWidth: "800px",
          margin: "0 auto 24px",
        }}>
          Crafted with <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Devotion</em>,<br />
          Worn with <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Pride</em>
        </h1>
        <p style={{
          fontSize: "clamp(14px, 1.6vw, 17px)",
          color: "var(--text-muted)",
          lineHeight: 1.9,
          maxWidth: "620px",
          margin: "0 auto",
        }}>
          At The Jewel Gallery, we believe that a piece of jewellery is never merely an accessory — it is a declaration. Founded in 2014 in the heart of Mumbai, we have spent over a decade perfecting the art of translating emotion into design and form.
        </p>
      </section>

      {/* ── Origin Story ── */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0",
        minHeight: "520px",
      }}
        className="story-origin-grid"
      >
        {/* Jewellery Carousel */}
        <StoryCarousel />

        {/* Text */}
        <div style={{
          background: "var(--ivory-deep)",
          padding: "clamp(40px, 6vw, 80px) clamp(32px, 5vw, 72px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
          <div className="section-eyebrow" style={{ textAlign: "left" }}>Our Beginning</div>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(26px, 3vw, 38px)",
            fontWeight: 400,
            color: "var(--text-dark)",
            marginBottom: "24px",
            lineHeight: 1.3,
          }}>
            A Dream Born in the Lanes of Mumbai
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.9, marginBottom: "20px" }}>
            The Jewel Gallery was born from a simple but powerful belief: that every woman deserves to wear jewellery that feels like it was made for her — not mass-produced for the masses, but crafted with intention, precision, and love.
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.9, marginBottom: "20px" }}>
            Our founder, inspired by the rich tradition of Indian jewellery-making and the vibrant energy of Mumbai's creative scene, set out to create a brand that bridges artistic craftsmanship with contemporary design sensibility.
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.9 }}>
            Today, with over 2,400 pieces crafted, 18 collections launched, and jewellery worn by 200+ celebrities and style icons, The Jewel Gallery stands as a testament to what happens when artistic vision meets devotion.
          </p>
        </div>
      </section>

      {/* ── Brand Pillars ── */}
      <section style={{
        padding: "clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)",
        background: "var(--ivory)",
        borderTop: "1px solid var(--linen-dark)",
        borderBottom: "1px solid var(--linen-dark)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(40px, 5vw, 64px)" }}>
          <div className="section-eyebrow">What We Stand For</div>
          <h2 className="section-title">Our <em>Promise</em> to You</h2>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
        }}
          className="brand-pillars-grid"
        >
          {BRAND_PILLARS.map((p) => (
            <div key={p.title} style={{
              textAlign: "center",
              padding: "40px 24px",
              background: "var(--ivory-deep)",
              border: "1px solid var(--linen-dark)",
              transition: "box-shadow 0.3s ease, transform 0.3s ease",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(201,169,110,0.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                color: "var(--gold)",
                marginBottom: "20px",
                lineHeight: 1,
              }}>
                {p.icon}
              </div>
              <h3 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "18px",
                fontWeight: 400,
                color: "var(--text-dark)",
                marginBottom: "12px",
              }}>
                {p.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.8 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Celebrity Section ── */}
      <section style={{
        padding: "clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)",
        background: "linear-gradient(135deg, var(--linen) 0%, var(--ivory) 100%)",
        borderBottom: "1px solid var(--linen-dark)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(40px, 5vw, 64px)" }}>
          <div className="section-eyebrow">As Worn By</div>
          <h2 className="section-title">Loved by <em>Icons</em></h2>
          <p style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            maxWidth: "520px",
            margin: "16px auto 0",
            lineHeight: 1.8,
          }}>
            From red carpets to award shows, The Jewel Gallery has become the jewellery of choice for India's most celebrated actresses, models, and style icons.
          </p>
        </div>

        {/* Celebrity grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "24px",
          marginBottom: "48px",
        }}
          className="celebrity-story-grid"
        >
          {CELEBRITIES.map((c) => (
            <div
              key={c.slug}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/celebrity/${c.slug}`)}
            >
              {/* Photo */}
              <div style={{
                width: "100%",
                paddingBottom: "125%",
                position: "relative",
                overflow: "hidden",
                background: "var(--ivory-deep)",
                border: "1px solid var(--linen-dark)",
                marginBottom: "16px",
              }}>
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.5s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                />
                {/* Gold overlay on hover */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(to top, rgba(201,169,110,0.85) 0%, transparent 60%)",
                  padding: "24px 16px 16px",
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                }}
                  className="celebrity-overlay"
                >
                  <p style={{
                    fontSize: "11px",
                    color: "var(--ivory)",
                    lineHeight: 1.6,
                    fontStyle: "italic",
                  }}>
                    "{c.quote}"
                  </p>
                </div>
              </div>
              {/* Name */}
              <div style={{
                fontFamily: "var(--font-heading)",
                fontSize: "15px",
                fontWeight: 400,
                color: "var(--text-dark)",
                marginBottom: "4px",
              }}>
                {c.name}
              </div>
              <div style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "10px",
              }}>
                {c.designation}
              </div>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid var(--gold)",
                  color: "var(--gold)",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  padding: "8px 16px",
                  cursor: "pointer",
                  transition: "background 0.3s ease, color 0.3s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--gold)";
                  (e.currentTarget as HTMLElement).style.color = "var(--ivory)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                }}
                onClick={(e) => { e.stopPropagation(); navigate(`/celebrity/${c.slug}`); }}
              >
                Shop the Look
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            className="btn-secondary"
            onClick={() => navigate("/celebrity")}
          >
            View All Celebrity Looks
          </button>
        </div>
      </section>

      {/* ── Store Locations ── */}
      <section style={{
        padding: "clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)",
        background: "var(--ivory-deep)",
        borderBottom: "1px solid var(--linen-dark)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(40px, 5vw, 64px)" }}>
          <div className="section-eyebrow">Visit Us</div>
          <h2 className="section-title">Experience the <em>Gallery</em></h2>
          <p style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            maxWidth: "480px",
            margin: "16px auto 0",
            lineHeight: 1.8,
          }}>
            Step into our world. Our boutiques are designed to be an experience — a sanctuary where you can discover, touch, and fall in love with each piece.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
        }}
          className="stores-grid"
        >
          {/* Store 1 */}
          <div style={{
            background: "var(--ivory)",
            border: "1px solid var(--linen-dark)",
            overflow: "hidden",
          }}>
            <div style={{ height: "280px", overflow: "hidden" }}>
              <img
                src="/images/store-2.jpg"
                alt="The Jewel Gallery — Lokhandwala Market, Mumbai"
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              />
            </div>
            <div style={{ padding: "32px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--gold)" }}>
                  Mumbai
                </span>
              </div>
              <h3 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "24px",
                fontWeight: 400,
                color: "var(--text-dark)",
                marginBottom: "8px",
              }}>
                Lokhandwala Market
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.8, marginBottom: "20px" }}>
                Our flagship store in the heart of Andheri West — where Mumbai's fashion-forward crowd discovers their next statement piece. Open daily, 11 AM – 9 PM.
              </p>
              <div style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                borderTop: "1px solid var(--linen-dark)",
                paddingTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
                <span>📍 Lokhandwala Market, Andheri West, Mumbai – 400 053</span>
                <span>🕐 Mon – Sun: 11:00 AM – 9:00 PM</span>
              </div>
            </div>
          </div>

          {/* Store 2 */}
          <div style={{
            background: "var(--ivory)",
            border: "1px solid var(--linen-dark)",
            overflow: "hidden",
          }}>
            <div style={{ height: "280px", overflow: "hidden" }}>
              <img
                src="/images/store-3.jpg"
                alt="The Jewel Gallery — InOrbit Mall, Hyderabad"
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              />
            </div>
            <div style={{ padding: "32px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--gold)" }}>
                  Hyderabad
                </span>
              </div>
              <h3 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "24px",
                fontWeight: 400,
                color: "var(--text-dark)",
                marginBottom: "8px",
              }}>
                InOrbit Mall
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.8, marginBottom: "20px" }}>
                Our Hyderabad boutique at InOrbit Mall brings The Jewel Gallery experience to the City of Pearls — where tradition and luxury have always been at home. Open daily, 11 AM – 9:30 PM.
              </p>
              <div style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                borderTop: "1px solid var(--linen-dark)",
                paddingTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
                <span>📍 InOrbit Mall, Cyberabad, Hyderabad – 500 081</span>
                <span>🕐 Mon – Sun: 11:00 AM – 9:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop Online / Trust Signals ── */}
      <section style={{
        padding: "clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)",
        background: "var(--ivory)",
        borderTop: "1px solid var(--linen-dark)",
        borderBottom: "1px solid var(--linen-dark)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(40px, 5vw, 64px)" }}>
          <div className="section-eyebrow">Shop Online</div>
          <h2 className="section-title">The Gallery, <em>Delivered to You</em></h2>
          <p style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            maxWidth: "560px",
            margin: "16px auto 0",
            lineHeight: 1.9,
          }}>
            Can't visit us in person? Shop our full collection from the comfort of your home.
            Every order ships free, arrives beautifully packaged, and is backed by our promise of care.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
        }}
          className="trust-grid"
        >
          {[
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              ),
              title: "Free Shipping Across India",
              desc: "Every order, no minimum. We deliver to every pin code in India — completely free.",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <path d="M16 8h4l3 5v3h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              ),
              title: "Secure & Tracked Delivery",
              desc: "Your order is packed with care and shipped with full tracking so you always know where it is.",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: "Easy Returns & Exchanges",
              desc: "Not in love with your piece? We offer hassle-free returns and exchanges within 7 days.",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              title: "Lifetime Service Promise",
              desc: "Every piece comes with our lifetime service commitment — we care for your jewellery as long as you wear it.",
            },
          ].map((t) => (
            <div key={t.title} style={{
              textAlign: "center",
              padding: "40px 24px",
              background: "var(--ivory-deep)",
              border: "1px solid var(--linen-dark)",
              transition: "box-shadow 0.3s ease, transform 0.3s ease",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(201,169,110,0.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                {t.icon}
              </div>
              <h3 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "17px",
                fontWeight: 400,
                color: "var(--text-dark)",
                marginBottom: "12px",
              }}>
                {t.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.8 }}>
                {t.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Social proof strip */}
        <div style={{
          marginTop: "56px",
          padding: "32px 40px",
          background: "linear-gradient(135deg, var(--linen) 0%, var(--ivory-deep) 100%)",
          border: "1px solid var(--linen-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
        }}
          className="trust-strip"
        >
          {[
            { value: "200+", label: "Celebrities who trust us" },
            { value: "4.9 ★", label: "Average customer rating" },
            { value: "10,000+", label: "Happy customers" },
            { value: "12+ Years", label: "Of crafting jewellery" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", flex: "1 1 120px" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(22px, 3vw, 32px)",
                color: "var(--gold)",
                marginBottom: "6px",
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section style={{
        background: "var(--gold)",
        padding: "clamp(40px, 5vw, 60px) clamp(20px, 6vw, 80px)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
          textAlign: "center",
        }}
          className="stats-banner-grid"
        >
          {[
            { number: "2,400+", label: "Pieces Crafted" },
            { number: "18", label: "Collections" },
            { number: "200+", label: "Celebrities Styled" },
            { number: "12+", label: "Years of Craft" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 400,
                color: "var(--ivory)",
                marginBottom: "8px",
              }}>
                {s.number}
              </div>
              <div style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(250,246,240,0.75)",
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)",
        background: "var(--ivory)",
        textAlign: "center",
      }}>
        <div className="section-eyebrow">Begin Your Journey</div>
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 400,
          color: "var(--text-dark)",
          marginBottom: "20px",
          lineHeight: 1.3,
        }}>
          Find the Piece That <em style={{ color: "var(--gold)" }}>Speaks to You</em>
        </h2>
        <p style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          maxWidth: "480px",
          margin: "0 auto 36px",
          lineHeight: 1.8,
        }}>
          Explore our full collection of handcrafted necklaces, earrings, bracelets, and rings — each one a declaration of who you are.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => navigate("/collections")}>
            Explore Collections
          </button>
          <button className="btn-secondary" onClick={() => navigate("/celebrity")}>
            Celebrity Looks
          </button>
        </div>
      </section>

      {/* CSS for responsive grids and celebrity overlay */}
      <style>{`
        @media (max-width: 1024px) {
          .brand-pillars-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .celebrity-story-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .stats-banner-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .story-origin-grid { grid-template-columns: 1fr !important; }
          .brand-pillars-grid { grid-template-columns: 1fr !important; }
          .celebrity-story-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stores-grid { grid-template-columns: 1fr !important; }
          .stats-banner-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .celebrity-story-grid > div:hover .celebrity-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </StorefrontLayout>
  );
}

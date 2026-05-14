import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Brand Column */}
        <div>
          <div className="footer-logo-main">
            The Jewel <span>Gallery</span>
          </div>
          <div className="footer-logo-sub">Luxury Handcrafted Jewellery</div>
          <p className="footer-tagline">
            Each piece in our collection is handcrafted by master artisans, using only the finest
            materials — hallmarked sterling silver, 18K gold, and certified gemstones.
          </p>
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            {["Instagram", "Pinterest", "Facebook"].map((s) => (
              <a
                key={s}
                href="#"
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px solid rgba(201,169,110,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  color: "rgba(250,246,240,0.6)",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--gold)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(201,169,110,0.3)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,246,240,0.6)";
                }}
              >
                {s[0]}
              </a>
            ))}
          </div>
        </div>

        {/* Shop Column */}
        <div>
          <div className="footer-col-title">Shop</div>
          <div className="footer-links">
            <Link href="/category/rings" className="footer-link">Rings</Link>
            <Link href="/category/necklaces" className="footer-link">Necklaces</Link>
            <Link href="/category/earrings" className="footer-link">Earrings</Link>
            <Link href="/category/bracelets" className="footer-link">Bracelets</Link>
            <Link href="/collections" className="footer-link">All Collections</Link>
            <Link href="/celebrity" className="footer-link">As Worn By</Link>
          </div>
        </div>

        {/* Help Column */}
        <div>
          <div className="footer-col-title">Help & Information</div>
          <div className="footer-links">
            <Link href="/policies?tab=shipping" className="footer-link">Shipping Policy</Link>
            <Link href="/policies?tab=returns" className="footer-link">Returns & Exchanges</Link>
            <Link href="/policies?tab=privacy" className="footer-link">Privacy Policy</Link>
            <Link href="/policies?tab=terms" className="footer-link">Terms of Service</Link>
            <Link href="/account" className="footer-link">My Account</Link>
          </div>
          <div style={{ marginTop: "24px" }}>
            <div className="footer-col-title">Contact</div>
            <p style={{ fontSize: "12px", color: "rgba(250,246,240,0.6)", lineHeight: 1.7 }}>
              care@thejewelgallery.in<br />
              Mon–Sat, 10am–6pm IST
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} The Jewel Gallery. All rights reserved.</span>
        <span>Handcrafted with care in India</span>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href="/policies?tab=privacy" className="footer-link" style={{ fontSize: "11px" }}>Privacy</Link>
          <Link href="/policies?tab=terms" className="footer-link" style={{ fontSize: "11px" }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}

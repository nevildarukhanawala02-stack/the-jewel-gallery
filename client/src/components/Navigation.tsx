import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingBag, Search, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_LINKS = [
  { label: "Collections", href: "/collections" },
  { label: "Rings", href: "/category/rings" },
  { label: "Necklaces", href: "/category/necklaces" },
  { label: "Earrings", href: "/category/earrings" },
  { label: "Bracelets", href: "/category/bracelets" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "As Worn By", href: "/celebrity" },
];

export default function Navigation() {
  const { totalItems } = useCart();
  const { customer, logout } = useCustomerAuth();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Main Navigation */}
      <nav className="nav">
        {/* Logo */}
        <Link href="/" className="nav-logo" style={{ textDecoration: "none" }}>
          <div className="nav-logo-main">
            The Jewel <span>Gallery</span>
          </div>
          <div className="nav-logo-sub">Luxury Handcrafted Jewellery</div>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${location === link.href || location.startsWith(link.href + "/") ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <button
            className="nav-action-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search size={15} />
          </button>

          {/* Desktop auth buttons — hidden on mobile */}
          <div className="nav-auth-desktop">
            {isAdmin && (
              <button
                className="nav-auth-btn"
                onClick={() => navigate("/admin")}
                style={{ display: "flex", alignItems: "center", gap: "5px", background: "var(--gold)", color: "#fff", border: "none" }}
                title="Admin Dashboard"
              >
                <LayoutDashboard size={12} />
                Admin
              </button>
            )}
            {customer ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className="nav-auth-btn"
                  onClick={() => navigate("/account")}
                >
                  {customer.name?.split(" ")[0] ?? "Account"}
                </button>
                <button className="nav-auth-btn" onClick={logout}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="nav-auth-btn" onClick={() => navigate("/login")}>
                  Sign In
                </button>
                <button className="nav-auth-btn nav-register" onClick={() => navigate("/register")}>
                  Register
                </button>
              </div>
            )}
          </div>

          <button
            className="nav-action-btn"
            onClick={() => navigate("/cart")}
            aria-label="Cart"
            style={{ position: "relative" }}
          >
            <ShoppingBag size={15} />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems > 9 ? "9+" : totalItems}</span>
            )}
          </button>

          {/* Mobile hamburger — shown only on mobile via CSS */}
          <button
            className="nav-action-btn nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Search Bar */}
      {searchOpen && (
        <div style={{
          background: "var(--ivory)",
          borderBottom: "1px solid var(--linen-dark)",
          padding: "16px 24px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          position: "sticky",
          top: "72px",
          zIndex: 999,
        }}>
          <Search size={16} color="var(--gold)" />
          <input
            autoFocus
            placeholder="Search for rings, necklaces, earrings..."
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text-dark)",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = (e.target as HTMLInputElement).value;
                if (q.trim()) {
                  navigate(`/collections?q=${encodeURIComponent(q)}`);
                  setSearchOpen(false);
                }
              }
              if (e.key === "Escape") setSearchOpen(false);
            }}
          />
          <button
            onClick={() => setSearchOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "var(--ivory)",
          zIndex: 1100,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}>
          {/* Drawer header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--linen-dark)",
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--text-dark)", letterSpacing: "2px" }}>
                The Jewel <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Gallery</span>
              </div>
              <div style={{ fontSize: "7px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "2px" }}>
                Luxury Handcrafted Jewellery
              </div>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
              <X size={22} color="var(--text-dark)" />
            </button>
          </div>

          {/* Nav links */}
          <div style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 300,
                  color: location === link.href || location.startsWith(link.href + "/") ? "var(--gold)" : "var(--text-dark)",
                  textDecoration: "none",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--linen-dark)",
                  display: "block",
                  letterSpacing: "1px",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth section */}
          <div style={{ padding: "24px", marginTop: "auto", borderTop: "1px solid var(--linen-dark)" }}>
            {isAdmin && (
              <button
                className="nav-auth-btn"
                style={{ width: "100%", padding: "14px", fontSize: "11px", marginBottom: "12px", background: "var(--gold)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={() => { navigate("/admin"); setMobileOpen(false); }}
              >
                <LayoutDashboard size={13} /> Admin Dashboard
              </button>
            )}
            {customer ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Signed in as <strong style={{ color: "var(--text-dark)" }}>{customer.name}</strong>
                </div>
                <button className="nav-auth-btn" style={{ width: "100%", padding: "14px", fontSize: "11px" }}
                  onClick={() => { navigate("/account"); setMobileOpen(false); }}>My Account</button>
                <button className="nav-auth-btn" style={{ width: "100%", padding: "14px", fontSize: "11px" }}
                  onClick={() => { logout(); setMobileOpen(false); }}>Sign Out</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button className="nav-auth-btn nav-register" style={{ width: "100%", padding: "14px", fontSize: "11px" }}
                  onClick={() => { navigate("/register"); setMobileOpen(false); }}>Register</button>
                <button className="nav-auth-btn" style={{ width: "100%", padding: "14px", fontSize: "11px" }}
                  onClick={() => { navigate("/login"); setMobileOpen(false); }}>Sign In</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ShoppingBag, User, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_LINKS = [
  { label: "Collections", href: "/collections" },
  { label: "Rings", href: "/category/rings" },
  { label: "Necklaces", href: "/category/necklaces" },
  { label: "Earrings", href: "/category/earrings" },
  { label: "Bracelets", href: "/category/bracelets" },
  { label: "As Worn By", href: "/celebrity" },
];

export default function Navigation() {
  const { totalItems } = useCart();
  const { customer, logout } = useCustomerAuth();
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
        <div className="nav-links" style={{ display: "flex" }}>
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

          {/* Mobile menu toggle */}
          <button
            className="nav-action-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            style={{ display: "none" }}
          >
            {mobileOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </nav>

      {/* Search Bar */}
      {searchOpen && (
        <div style={{
          background: "var(--ivory)",
          borderBottom: "1px solid var(--linen-dark)",
          padding: "16px 60px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
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

      {/* Mobile Nav */}
      {mobileOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "var(--ivory)",
          zIndex: 999,
          padding: "80px 32px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={24} />
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 300,
                color: "var(--text-dark)",
                textDecoration: "none",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

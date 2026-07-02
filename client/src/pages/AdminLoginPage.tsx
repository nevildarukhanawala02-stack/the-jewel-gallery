import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await utils.auth.me.invalidate();
        toast.success(`Welcome back, ${data.name || "Admin"}!`);
        navigate("/admin");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Visual Side */}
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80"
          alt="Luxury jewellery"
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(28,28,28,0.6) 0%, rgba(201,169,110,0.2) 100%)",
        }} />
        <div style={{ position: "absolute", bottom: "60px", left: "40px", right: "40px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 300, color: "white", lineHeight: 1.3 }}>
            The Jewel Gallery<br />
            <span style={{ fontSize: "16px", opacity: 0.8 }}>Admin Console</span>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          The Jewel <span>Gallery</span>
        </div>

        <h1 className="auth-title">Admin Sign In</h1>
        <p className="auth-subtitle">Access the administration dashboard.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@thejewelgallery.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Your admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              fontSize: "12px",
              color: "#B91C1C",
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: "12px" }}>
          <a onClick={() => navigate("/")}>← Back to Store</a>
        </div>
      </div>
    </div>
  );
}

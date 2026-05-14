import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login, loading } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await login(email, password);
    if (result.success) {
      toast.success("Welcome back to The Jewel Gallery");
      navigate("/account");
    } else {
      setError(result.error ?? "Invalid email or password");
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
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(28,28,28,0.4) 0%, rgba(201,169,110,0.2) 100%)",
        }} />
        <div style={{
          position: "absolute",
          bottom: "60px",
          left: "40px",
          right: "40px",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 300, color: "white", lineHeight: 1.3 }}>
            "Crafted for those who<br />appreciate the extraordinary"
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          The Jewel <span>Gallery</span>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to access your account, order history, and saved pieces.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account?{" "}
          <a onClick={() => navigate("/register")}>Create one</a>
        </div>

        <div className="auth-switch" style={{ marginTop: "12px" }}>
          <a onClick={() => navigate("/")}>← Continue Shopping</a>
        </div>
      </div>
    </div>
  );
}

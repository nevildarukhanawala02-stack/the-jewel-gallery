import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { register, loading } = useCustomerAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    const result = await register(form.name, form.email, form.phone, form.password);
    if (result.success) {
      toast.success("Welcome to The Jewel Gallery", {
        description: "Your account has been created.",
      });
      navigate("/account");
    } else {
      setError(result.error ?? "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      {/* Visual Side */}
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1573408301185-9519f94815b1?w=800&q=80"
          alt="Luxury jewellery craftsmanship"
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
          <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 300, color: "white", lineHeight: 1.3 }}>
            "Every masterpiece begins with a single vision"
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          The Jewel <span>Gallery</span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join The Jewel Gallery family and discover a world of handcrafted luxury.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                className="form-input"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
                required
              />
            </div>
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{" "}
          <a onClick={() => navigate("/login")}>Sign in</a>
        </div>

        <div className="auth-switch" style={{ marginTop: "12px" }}>
          <a onClick={() => navigate("/")}>← Continue Shopping</a>
        </div>
      </div>
    </div>
  );
}

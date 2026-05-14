import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useState } from "react";
import { useLocation } from "wouter";

const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

// EXACTLY TWO shipping options — NO overnight option
const SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Standard Shipping",
    days: "5–7 Business Days",
    price: 0,
    label: "FREE",
    description: "Complimentary shipping on all orders",
  },
  {
    id: "express",
    name: "Express Shipping",
    days: "2–3 Business Days",
    price: 500,
    label: "₹500",
    description: "Priority handling and expedited delivery",
  },
];

export default function ShippingPage() {
  const [, navigate] = useLocation();
  const { items, subtotal } = useCart();
  const { customer } = useCustomerAuth();
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [form, setForm] = useState({
    firstName: customer?.name?.split(" ")[0] ?? "",
    lastName: customer?.name?.split(" ").slice(1).join(" ") ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const shippingCost = shippingMethod === "express" ? 500 : 0;
  const gstBase = subtotal + shippingCost;
  const gstAmount = Math.round(gstBase * 0.18);
  const total = gstBase + gstAmount;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store shipping info in sessionStorage for payment page
    sessionStorage.setItem("tjg_shipping", JSON.stringify({
      ...form,
      shippingMethod,
      shippingCost,
      gstAmount,
      total,
    }));
    navigate("/payment");
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            The Jewel <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Gallery</span>
          </div>
          <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Secure Checkout
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="checkout-steps">
        {[
          { label: "Bag", step: 1 },
          { label: "Shipping", step: 2 },
          { label: "Payment", step: 3 },
          { label: "Confirmation", step: 4 },
        ].map((s) => (
          <div key={s.step} className={`checkout-step ${s.step === 2 ? "active" : s.step < 2 ? "completed" : ""}`}>
            <div className="step-circle">{s.step < 2 ? "✓" : s.step}</div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          {/* Left: Form */}
          <div>
            {/* Delivery Address */}
            <div className="checkout-form-section" style={{ marginBottom: "24px" }}>
              <h2 className="checkout-form-title">Delivery Address</h2>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">First Name *</label>
                  <input name="firstName" type="text" className="form-input" value={form.firstName} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Last Name *</label>
                  <input name="lastName" type="text" className="form-input" value={form.lastName} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Email Address *</label>
                  <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Phone Number *</label>
                  <input name="phone" type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} required />
                </div>
                <div className="form-field full-width">
                  <label className="form-label">Street Address *</label>
                  <input name="streetAddress" type="text" className="form-input" placeholder="House/Flat No., Street, Area" value={form.streetAddress} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label className="form-label">City *</label>
                  <input name="city" type="text" className="form-input" value={form.city} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label className="form-label">State *</label>
                  <select name="state" className="form-select" value={form.state} onChange={handleChange} required>
                    <option value="">Select State</option>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">PIN Code *</label>
                  <input name="postalCode" type="text" className="form-input" placeholder="400001" value={form.postalCode} onChange={handleChange} required pattern="[0-9]{6}" />
                </div>
                <div className="form-field">
                  <label className="form-label">Country</label>
                  <input type="text" className="form-input" value="India" readOnly style={{ background: "var(--linen)", color: "var(--text-muted)" }} />
                </div>
              </div>
            </div>

            {/* Shipping Method — EXACTLY TWO OPTIONS */}
            <div className="checkout-form-section">
              <h2 className="checkout-form-title">Shipping Method</h2>
              <div className="shipping-options">
                {SHIPPING_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`shipping-option ${shippingMethod === opt.id ? "selected" : ""}`}
                    onClick={() => setShippingMethod(opt.id as "standard" | "express")}
                  >
                    <div className="shipping-option-radio" />
                    <div className="shipping-option-info">
                      <div className="shipping-option-name">{opt.name}</div>
                      <div className="shipping-option-days">{opt.days} — {opt.description}</div>
                    </div>
                    <div className="shipping-option-price">{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="order-summary-box">
              <div className="order-summary-title">Order Summary</div>

              {items.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="order-item-img">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--linen)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)" }}>◆</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-collection">Qty: {item.quantity}</div>
                  </div>
                  <div className="order-item-price">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>Shipping ({shippingMethod === "express" ? "Express" : "Standard"})</span>
                  <span style={{ color: shippingCost === 0 ? "var(--gold)" : "inherit" }}>
                    {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="total-row">
                  <span>GST (18%)</span>
                  <span>{formatPrice(gstAmount)}</span>
                </div>
                <div className="total-row grand">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "24px", padding: "16px" }}>
                Continue to Payment
              </button>

              <button
                type="button"
                className="btn-ghost"
                style={{ width: "100%", marginTop: "12px" }}
                onClick={() => navigate("/cart")}
              >
                ← Back to Bag
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

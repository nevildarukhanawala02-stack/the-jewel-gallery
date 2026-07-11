import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { trpc } from "@/lib/trpc";
import { getSessionId } from "@/lib/analytics";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

export default function PaymentPage() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart } = useCart();
  const { customer, token } = useCustomerAuth();
  const [shippingData, setShippingData] = useState<Record<string, unknown> | null>(null);
  const [processing, setProcessing] = useState(false);

  const createOrderMutation = trpc.orders.create.useMutation();
  const verifyPaymentMutation = trpc.orders.verifyPayment.useMutation();
  const trackEvent = trpc.analytics.track.useMutation();

  useEffect(() => {
    trackEvent.mutate({ sessionId: getSessionId(), eventType: "checkout_start" });
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("tjg_shipping");
    if (!stored) {
      navigate("/shipping");
      return;
    }
    setShippingData(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    // Load Razorpay script
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
    }
  }, []);

  if (!shippingData || items.length === 0) return null;

  const shippingCost = Number(shippingData.shippingCost ?? 0);
  const gstAmount = Number(shippingData.gstAmount ?? Math.round((subtotal + shippingCost) * 0.18));
  const total = subtotal + shippingCost + gstAmount;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Create order on backend
      const orderResult = await createOrderMutation.mutateAsync({
        token: token ?? "",
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        shippingAddress: {
          firstName: String(shippingData.firstName ?? ""),
          lastName: String(shippingData.lastName ?? ""),
          email: String(shippingData.email ?? ""),
          phone: String(shippingData.phone ?? ""),
          streetAddress: String(shippingData.streetAddress ?? ""),
          city: String(shippingData.city ?? ""),
          state: String(shippingData.state ?? ""),
          postalCode: String(shippingData.postalCode ?? ""),
        },
        shippingMethod: (String(shippingData.shippingMethod ?? "standard")) as "standard" | "express",
      });

      if (!orderResult.razorpayOrderId) {
        // Razorpay not configured — simulate success for testing
        clearCart();
        sessionStorage.removeItem("tjg_shipping");
        sessionStorage.setItem("tjg_order_number", orderResult.orderNumber);
        navigate("/confirmation");
        return;
      }

      // Use server-calculated totals for Razorpay
      const serverTotal = orderResult.totalAmount;

      // Open Razorpay
      const options: RazorpayOptions = {
        key: orderResult.razorpayKey,
        amount: serverTotal * 100, // paise
        currency: "INR",
        name: "The Jewel Gallery",
        description: `Order ${orderResult.orderNumber}`,
        order_id: orderResult.razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              orderId: orderResult.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            sessionStorage.removeItem("tjg_shipping");
            sessionStorage.setItem("tjg_order_number", orderResult.orderNumber);
            navigate("/confirmation");
          } catch {
            toast.error("Payment verification failed. Please contact support.");
            setProcessing(false);
          }
        },
        prefill: {
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          email: String(shippingData.email ?? ""),
          contact: String(shippingData.phone ?? ""),
        },
        theme: { color: "#C9A96E" },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.info("Payment cancelled. Your bag is still saved.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      toast.error(message);
      setProcessing(false);
    }
  };

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
          <div key={s.step} className={`checkout-step ${s.step === 3 ? "active" : s.step < 3 ? "completed" : ""}`}>
            <div className="step-circle">{s.step < 3 ? "✓" : s.step}</div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="checkout-layout">
        {/* Left: Review */}
        <div>
          {/* Delivery Summary */}
          <div className="checkout-form-section" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className="checkout-form-title" style={{ margin: 0 }}>Delivery Address</h2>
              <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: "10px" }} onClick={() => navigate("/shipping")}>
                Edit
              </button>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-mid)", lineHeight: 1.7 }}>
              <strong>{String(shippingData.firstName ?? "")} {String(shippingData.lastName ?? "")}</strong><br />
              {String(shippingData.streetAddress ?? "")}<br />
              {String(shippingData.city ?? "")}, {String(shippingData.state ?? "")} — {String(shippingData.postalCode ?? "")}<br />
              {String(shippingData.phone ?? "")} · {String(shippingData.email ?? "")}
            </div>
          </div>

          {/* Shipping Method Summary */}
          <div className="checkout-form-section" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className="checkout-form-title" style={{ margin: 0 }}>Shipping Method</h2>
              <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: "10px" }} onClick={() => navigate("/shipping")}>
                Edit
              </button>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-mid)" }}>
              {shippingData.shippingMethod === "express" ? "Express Shipping (2–3 Business Days) — ₹500" : "Standard Shipping (5–7 Business Days) — FREE"}
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-form-section">
            <h2 className="checkout-form-title">Payment</h2>
            <p style={{ fontSize: "13px", color: "var(--text-mid)", marginBottom: "24px" }}>
              You will be redirected to our secure payment gateway powered by Razorpay.
              We accept all major cards, UPI, net banking, and wallets.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {["Visa", "Mastercard", "Rupay", "UPI", "Net Banking", "Wallets"].map((p) => (
                <span key={p} style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  padding: "6px 12px",
                  border: "1px solid var(--linen-dark)",
                  color: "var(--text-muted)",
                  background: "white",
                }}>
                  {p}
                </span>
              ))}
            </div>

            <div style={{
              padding: "16px",
              background: "rgba(201,169,110,0.05)",
              border: "1px solid rgba(201,169,110,0.2)",
              fontSize: "12px",
              color: "var(--text-mid)",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}>
              <span style={{ color: "var(--gold)", fontSize: "16px" }}>🔒</span>
              <span>
                Your payment information is encrypted and secure. We never store your card details.
                All transactions are processed through Razorpay's PCI-DSS compliant gateway.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Summary */}
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
                <div className="order-item-price">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="total-row">
                <span>Shipping</span>
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

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: "24px", padding: "16px" }}
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? "Processing..." : `Pay ${formatPrice(total)}`}
            </button>

            <button
              className="btn-ghost"
              style={{ width: "100%", marginTop: "12px" }}
              onClick={() => navigate("/shipping")}
              disabled={processing}
            >
              ← Back to Shipping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import StorefrontLayout from "@/components/StorefrontLayout";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function ConfirmationPage() {
  const [, navigate] = useLocation();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const num = sessionStorage.getItem("tjg_order_number");
    if (num) {
      setOrderNumber(num);
    }
  }, []);

  return (
    <StorefrontLayout>
      <div style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 60px",
        background: "linear-gradient(135deg, var(--ivory) 0%, var(--linen) 100%)",
        textAlign: "center",
      }}>
        {/* Success Icon */}
        <div style={{
          width: "80px",
          height: "80px",
          border: "2px solid var(--gold)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
          fontSize: "32px",
          color: "var(--gold)",
        }}>
          ✓
        </div>

        <div className="section-eyebrow" style={{ marginBottom: "16px" }}>Order Confirmed</div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 300,
          color: "var(--text-dark)",
          lineHeight: 1.2,
          marginBottom: "16px",
        }}>
          Thank You for Your <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Order</em>
        </h1>

        {orderNumber && (
          <div style={{
            padding: "16px 32px",
            background: "white",
            border: "1px solid var(--linen-dark)",
            marginBottom: "32px",
          }}>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>
              Order Number
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--gold)" }}>
              {orderNumber}
            </div>
          </div>
        )}

        <p style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.8, maxWidth: "560px", marginBottom: "40px" }}>
          Your order has been confirmed and our artisans are preparing your pieces with the utmost care.
          You will receive an email confirmation with tracking details once your order is dispatched.
        </p>

        {/* What's Next */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          maxWidth: "700px",
          marginBottom: "48px",
          textAlign: "left",
        }}>
          {[
            {
              step: "01",
              title: "Order Confirmed",
              desc: "Your order has been received and payment verified.",
            },
            {
              step: "02",
              title: "Carefully Packed",
              desc: "Your jewellery will be gift-wrapped and packed with care.",
            },
            {
              step: "03",
              title: "Dispatched",
              desc: "You'll receive a tracking number once your order ships.",
            },
          ].map((s) => (
            <div key={s.step} style={{
              padding: "24px",
              background: "white",
              border: "1px solid var(--linen-dark)",
            }}>
              <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2px", color: "var(--gold)", marginBottom: "8px" }}>
                {s.step}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--text-dark)", marginBottom: "8px" }}>
                {s.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn-primary" onClick={() => navigate("/account")}>
            View My Orders
          </button>
          <button className="btn-ghost" onClick={() => navigate("/collections")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </StorefrontLayout>
  );
}

import StorefrontLayout from "@/components/StorefrontLayout";
import { useCart } from "@/contexts/CartContext";
import { Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function CartPage() {
  const [, navigate] = useLocation();
  const { items, totalItems, subtotal, removeItem, updateQty } = useCart();

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  const shippingThreshold = 5000;
  const freeShipping = subtotal >= shippingThreshold;

  return (
    <StorefrontLayout>
      {/* Header */}
      <div style={{ padding: "40px 60px 24px", background: "var(--ivory)", borderBottom: "1px solid var(--linen-dark)" }}>
        <div className="breadcrumb">
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
          {" / "}
          <span style={{ color: "var(--gold)" }}>Shopping Bag</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300, color: "var(--text-dark)", marginTop: "12px" }}>
          Your <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Bag</em>
          <span style={{ fontSize: "16px", color: "var(--text-muted)", marginLeft: "16px", fontFamily: "var(--font-body)", fontWeight: 400 }}>
            ({totalItems} {totalItems === 1 ? "piece" : "pieces"})
          </span>
        </h1>
      </div>

      <div className="cart-page">
        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: "80px 40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>◆</div>
            <h3>Your Bag is Empty</h3>
            <p>Discover our handcrafted collections and find your perfect piece.</p>
            <button className="btn-primary" style={{ marginTop: "24px" }} onClick={() => navigate("/collections")}>
              Explore Collections
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-img">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          background: "var(--linen)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--gold)",
                          fontSize: "24px",
                        }}>◆</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      {item.collection && (
                        <div className="cart-item-collection">{item.collection}</div>
                      )}
                      <div className="cart-item-name">{item.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                        {formatPrice(item.price)} each
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div className="cart-qty">
                          <button className="cart-qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                          <span className="cart-qty-num">{item.quantity}</span>
                          <button className="cart-qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <button className="cart-remove" onClick={() => removeItem(item.id)}>
                          <Trash2 size={12} style={{ display: "inline", marginRight: "4px" }} />
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <div style={{ marginTop: "24px" }}>
                <button className="btn-ghost" onClick={() => navigate("/collections")}>
                  ← Continue Shopping
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="order-summary-box">
                <div className="order-summary-title">Order Summary</div>

                {items.map((item) => (
                  <div key={item.id} className="order-item">
                    <div className="order-item-img">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          background: "var(--linen)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--gold)",
                        }}>◆</div>
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
                    <span style={{ color: "var(--gold)" }}>
                      {freeShipping ? "FREE" : "Calculated at checkout"}
                    </span>
                  </div>
                  {!freeShipping && (
                    <div style={{ fontSize: "11px", color: "var(--gold)", marginTop: "4px" }}>
                      Add {formatPrice(shippingThreshold - subtotal)} more for free shipping
                    </div>
                  )}
                  <div className="total-row" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    <span>GST (18%)</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="total-row grand">
                    <span>Estimated Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "24px", padding: "16px" }}
                  onClick={() => navigate("/shipping")}
                >
                  Proceed to Checkout
                </button>

                <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  {["Visa", "Mastercard", "UPI", "Razorpay"].map((p) => (
                    <span key={p} style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      padding: "4px 8px",
                      border: "1px solid var(--linen-dark)",
                      color: "var(--text-muted)",
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}

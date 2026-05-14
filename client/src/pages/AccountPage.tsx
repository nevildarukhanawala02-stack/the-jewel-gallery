import StorefrontLayout from "@/components/StorefrontLayout";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  returned: "Returned",
};

export default function AccountPage() {
  const [, navigate] = useLocation();
  const { customer, logout, isAuthenticated, loading } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  const { data: orders, isLoading: ordersLoading } = trpc.orders.myOrders.useQuery(
    { token: localStorage.getItem("tjg_customer_token") ?? "" },
    { enabled: isAuthenticated }
  );

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  if (loading || !customer) {
    return (
      <StorefrontLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="loading-spinner" />
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="account-page">
        {/* Header */}
        <div className="account-header">
          <div className="section-eyebrow">My Account</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300, color: "var(--text-dark)" }}>
            Welcome, <em style={{ color: "var(--gold)", fontStyle: "italic" }}>{customer.name?.split(" ")[0] ?? "Valued Member"}</em>
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>{customer.email}</p>
        </div>

        {/* Tabs */}
        <div className="account-tabs">
          {[
            { id: "orders", label: "My Orders" },
            { id: "profile", label: "Profile" },
            { id: "addresses", label: "Addresses" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`account-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            {ordersLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <div className="loading-spinner" />
              </div>
            ) : orders && orders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {orders.map((order) => (
                  <div key={order.id} style={{
                    background: "white",
                    border: "1px solid var(--linen-dark)",
                    padding: "24px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--text-dark)", marginBottom: "4px" }}>
                          {order.orderNumber}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`status-badge status-${order.deliveryStatus}`}>
                          {STATUS_LABELS[order.deliveryStatus ?? "pending"] ?? order.deliveryStatus}
                        </span>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--text-dark)", marginTop: "8px" }}>
                          {formatPrice(Number(order.totalAmount))}
                        </div>
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                        Tracking: <strong style={{ color: "var(--gold)" }}>{order.trackingNumber}</strong>
                        {order.courierName && ` via ${order.courierName}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No Orders Yet</h3>
                <p>Your order history will appear here once you make your first purchase.</p>
                <button className="btn-primary" style={{ marginTop: "24px" }} onClick={() => navigate("/collections")}>
                  Explore Collections
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={{ background: "white", border: "1px solid var(--linen-dark)", padding: "40px", maxWidth: "600px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 400, color: "var(--text-dark)", marginBottom: "32px" }}>
              Profile Information
            </h2>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" defaultValue={customer.name ?? ""} readOnly />
              </div>
              <div className="form-field">
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" defaultValue={customer.phone ?? ""} readOnly />
              </div>
              <div className="form-field full-width">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" defaultValue={customer.email} readOnly />
              </div>
            </div>
            <button
              className="btn-ghost"
              style={{ marginTop: "24px" }}
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === "addresses" && (
          <div>
            <div className="empty-state">
              <h3>No Saved Addresses</h3>
              <p>Addresses saved during checkout will appear here for faster future purchases.</p>
              <button className="btn-primary" style={{ marginTop: "24px" }} onClick={() => navigate("/cart")}>
                Start Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}

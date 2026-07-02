import { AdminLayout } from "./AdminDashboard";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "../const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "payment_failed", label: "Payment Failed" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  packed: "#3B82F6",
  shipped: "#8B5CF6",
  out_for_delivery: "#06B6D4",
  delivered: "#10B981",
  returned: "#EF4444",
  payment_failed: "#EF4444",
};

export default function AdminOrders() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<number, { tracking: string; courier: string }>>({});

  const { data: orders, isLoading } = trpc.admin.getAllOrders.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter as "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "returned" },
    { enabled: !!user }
  );

  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation();
  const updateTrackingMutation = trpc.admin.updateOrderTracking.useMutation();
  const utils = trpc.useUtils();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F8F5F0" }}>
        <div style={{ color: "var(--gold)", fontSize: "24px" }}>◆</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F8F5F0", gap: "24px" }}>
        <div style={{ color: "var(--gold)", fontSize: "48px" }}>◆</div>
        <h2 style={{ color: "var(--text-dark)", fontFamily: "var(--font-serif)", fontSize: "24px", margin: 0 }}>Session Expired</h2>
        <p style={{ color: "#aaa", fontSize: "14px", margin: 0, textAlign: "center", maxWidth: "320px" }}>Your session has expired. Please sign in again.</p>
        <a href={getLoginUrl("/admin/orders")} style={{ background: "var(--gold)", color: "#fff", padding: "12px 32px", borderRadius: "4px", textDecoration: "none", fontWeight: 600, fontSize: "13px", letterSpacing: "0.1em" }}>SIGN IN</a>
        <a href="/" style={{ color: "#aaa", fontSize: "13px", textDecoration: "none" }}>Go to Homepage</a>
      </div>
    );
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  const filteredOrders = (orders ?? []).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName ?? "").toLowerCase().includes(q) ||
      (o.customerEmail ?? "").toLowerCase().includes(q)
    );
  });

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: status as "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "returned",
      });
      utils.admin.getAllOrders.invalidate();
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleTrackingUpdate = async (orderId: number) => {
    const input = trackingInputs[orderId];
    if (!input?.tracking) return;
    try {
      await updateTrackingMutation.mutateAsync({
        orderId,
        trackingNumber: input.tracking,
        courierName: input.courier,
      });
      utils.admin.getAllOrders.invalidate();
      toast.success("Tracking information saved");
    } catch {
      toast.error("Failed to save tracking");
    }
  };

  return (
    <AdminLayout title="Orders">
      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by order number, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 12px 11px 36px",
              background: "#fff",
              border: "1px solid rgba(201,169,110,0.2)",
              color: "var(--text-dark)",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Status Filter — horizontal scroll on mobile */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              style={{
                padding: "9px 14px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                background: statusFilter === opt.value ? "rgba(201,169,110,0.15)" : "transparent",
                border: `1px solid ${statusFilter === opt.value ? "var(--gold)" : "var(--linen-dark)"}`,
                color: statusFilter === opt.value ? "var(--gold)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
                minHeight: "40px",
              }}
            >
              {opt.label}
            </button>
          ))}
          <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", paddingLeft: "8px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ background: "#fff", border: "1px solid var(--linen-dark)" }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            No orders found
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} style={{ borderBottom: "1px solid var(--linen-dark)" }}>
              {/* Order Row — card layout on mobile, grid on desktop */}
              <div
                className="admin-order-row"
                style={{
                  padding: "16px 18px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                {/* Top line: order number + date + chevron */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "14px", color: "var(--gold)", fontFamily: "var(--font-body)", marginBottom: "2px" }}>
                      {order.orderNumber}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Middle line: customer + amount */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: "var(--text-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.customerName ?? "Guest"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.customerEmail ?? ""}
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-dark)", fontFamily: "var(--font-display)", flexShrink: 0 }}>
                    {formatPrice(Number(order.totalAmount))}
                  </div>
                </div>

                {/* Bottom line: status badge + status select */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{
                    padding: "4px 10px",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    background: `${STATUS_COLORS[order.deliveryStatus ?? "pending"]}20`,
                    color: STATUS_COLORS[order.deliveryStatus ?? "pending"],
                    border: `1px solid ${STATUS_COLORS[order.deliveryStatus ?? "pending"]}40`,
                    whiteSpace: "nowrap",
                  }}>
                    {STATUS_OPTIONS.find((s) => s.value === order.deliveryStatus)?.label ?? "Pending"}
                  </span>
                  <select
                    style={{
                      background: "#F8F5F0",
                      border: "1px solid rgba(201,169,110,0.2)",
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      padding: "6px 8px",
                      cursor: "pointer",
                      flex: 1,
                      minWidth: "140px",
                      maxWidth: "220px",
                    }}
                    value={order.deliveryStatus ?? "pending"}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(order.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUS_OPTIONS.filter((s) => s.value !== "all").map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div style={{
                  padding: "20px 18px",
                  background: "#F8F5F0",
                  borderTop: "1px solid rgba(201,169,110,0.08)",
                }}>
                  <div className="admin-orders-expanded" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                    {/* Shipping Address */}
                    <div>
                      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
                        Delivery Address
                      </div>
                      {order.shippingAddress ? (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7 }}>
                          {typeof order.shippingAddress === "object" && (
                            <>
                              <div>{(order.shippingAddress as Record<string, string>).firstName} {(order.shippingAddress as Record<string, string>).lastName}</div>
                              <div>{(order.shippingAddress as Record<string, string>).streetAddress}</div>
                              <div>{(order.shippingAddress as Record<string, string>).city}, {(order.shippingAddress as Record<string, string>).state}</div>
                              <div>{(order.shippingAddress as Record<string, string>).postalCode}</div>
                              <div>{(order.shippingAddress as Record<string, string>).phone}</div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No address on file</div>
                      )}
                    </div>

                    {/* Tracking */}
                    <div>
                      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
                        Tracking Information
                      </div>
                      {order.trackingNumber ? (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                          <div>Tracking: <span style={{ color: "var(--gold)" }}>{order.trackingNumber}</span></div>
                          {order.courierName && <div>Courier: {order.courierName}</div>}
                        </div>
                      ) : null}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Tracking number"
                          value={trackingInputs[order.id]?.tracking ?? ""}
                          onChange={(e) => setTrackingInputs((prev) => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], tracking: e.target.value },
                          }))}
                          style={{
                            padding: "9px 12px",
                            background: "#fff",
                            border: "1px solid rgba(201,169,110,0.2)",
                            color: "var(--text-dark)",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Courier name (e.g. BlueDart)"
                          value={trackingInputs[order.id]?.courier ?? ""}
                          onChange={(e) => setTrackingInputs((prev) => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], courier: e.target.value },
                          }))}
                          style={{
                            padding: "9px 12px",
                            background: "#fff",
                            border: "1px solid rgba(201,169,110,0.2)",
                            color: "var(--text-dark)",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => handleTrackingUpdate(order.id)}
                          style={{
                            padding: "9px 16px",
                            background: "rgba(201,169,110,0.15)",
                            border: "1px solid rgba(201,169,110,0.4)",
                            color: "var(--gold)",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          Save Tracking
                        </button>
                      </div>
                    </div>

                    {/* Payment */}
                    <div>
                      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
                        Payment Details
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.8 }}>
                        <div>Method: {order.paymentMethod ?? "Razorpay"}</div>
                        <div>Status: <span style={{ color: order.paymentStatus === "paid" ? "#10B981" : "#F59E0B" }}>{order.paymentStatus ?? "pending"}</span></div>
                        {order.razorpayPaymentId && (
                          <div style={{ fontSize: "10px", marginTop: "4px", wordBreak: "break-all" }}>
                            ID: {order.razorpayPaymentId}
                          </div>
                        )}
                        <div style={{ marginTop: "12px" }}>
                          <div>Subtotal: {formatPrice(Number(order.subtotalAmount ?? 0))}</div>
                          <div>Shipping: {formatPrice(Number(order.shippingCost ?? 0))}</div>
                          <div>GST: {formatPrice(Number(order.gstAmount ?? 0))}</div>
                          <div style={{ fontWeight: 700, color: "var(--text-dark)", marginTop: "4px" }}>
                            Total: {formatPrice(Number(order.totalAmount))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}

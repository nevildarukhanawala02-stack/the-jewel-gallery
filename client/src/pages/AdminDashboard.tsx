import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "../const";
import { useLocation } from "wouter";
import { Package, TrendingUp, ShoppingBag, AlertTriangle, Truck, CreditCard, Users, BarChart2, FileSpreadsheet, Upload, ImageIcon, Star, Menu, X, Crown } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  returned: "Returned",
  payment_failed: "Payment Failed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  packed: "#3B82F6",
  shipped: "#8B5CF6",
  out_for_delivery: "#06B6D4",
  delivered: "#10B981",
  returned: "#EF4444",
  payment_failed: "#EF4444",
};

function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const [location, navigate] = useLocation();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NAV_ITEMS = [
    { href: "/admin/ceo", label: "Command Centre", icon: Crown },
    { href: "/admin", label: "Dashboard", icon: BarChart2 },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/sku-upload", label: "SKU Upload", icon: FileSpreadsheet },
    { href: "/admin/celebrities", label: "Celebrities", icon: Star },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{
        padding: "28px 24px",
        borderBottom: "1px solid rgba(201,169,110,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "16px",
            fontWeight: 400,
            color: "white",
            letterSpacing: "1px",
          }}>
            The Jewel <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Gallery</span>
          </div>
          <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
            Admin Console
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="admin-sidebar-close"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            padding: "4px",
            display: "none",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 0" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => { navigate(item.href); setSidebarOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "14px 24px",
                background: isActive ? "rgba(201,169,110,0.1)" : "transparent",
                border: "none",
                borderLeft: `3px solid ${isActive ? "var(--gold)" : "transparent"}`,
                color: isActive ? "var(--gold)" : "rgba(255,255,255,0.5)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                minHeight: "48px",
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(201,169,110,0.15)" }}>
        <button
          onClick={() => { navigate("/"); setSidebarOpen(false); }}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 0",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            fontSize: "11px",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: "8px",
          }}
        >
          ← View Storefront
        </button>
        <button
          onClick={logout}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 0",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            fontSize: "11px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F0F" }}>
      {/* ── Desktop Sidebar ── */}
      <aside className="admin-sidebar-desktop" style={{
        width: "240px",
        background: "#1A1A1A",
        borderRight: "1px solid rgba(201,169,110,0.15)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 200,
          }}
        />
      )}
      <aside
        className="admin-sidebar-mobile"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          background: "#1A1A1A",
          borderRight: "1px solid rgba(201,169,110,0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 201,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(201,169,110,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 400, color: "white", letterSpacing: "1px" }}>
              The Jewel <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Gallery</span>
            </div>
            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
              Admin Console
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "14px 24px",
                  background: isActive ? "rgba(201,169,110,0.1)" : "transparent",
                  border: "none",
                  borderLeft: `3px solid ${isActive ? "var(--gold)" : "transparent"}`,
                  color: isActive ? "var(--gold)" : "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  textAlign: "left",
                  minHeight: "52px",
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(201,169,110,0.15)" }}>
          <button onClick={() => { navigate("/"); setSidebarOpen(false); }} style={{ display: "block", width: "100%", padding: "10px 0", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "12px", cursor: "pointer", textAlign: "left", marginBottom: "8px" }}>
            ← View Storefront
          </button>
          <button onClick={logout} style={{ display: "block", width: "100%", padding: "10px 0", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "12px", cursor: "pointer", textAlign: "left" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          padding: "0 24px",
          borderBottom: "1px solid rgba(201,169,110,0.1)",
          background: "#1A1A1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Hamburger — only on mobile */}
            <button
              className="admin-hamburger"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                padding: "4px",
                display: "none",
              }}
            >
              <Menu size={22} />
            </button>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, color: "white", margin: 0 }}>
              {title}
            </h1>
          </div>
          <div className="admin-topbar-date" style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        <div className="admin-content-padding" style={{ padding: "32px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export { AdminLayout };

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: metrics } = trpc.admin.getDashboardMetrics.useQuery(undefined, { enabled: !!user });
  const { data: recentOrders } = trpc.admin.getRecentOrders.useQuery({ limit: 10 }, { enabled: !!user });
  const { data: lowStockProducts } = trpc.admin.getLowStockProducts.useQuery({ threshold: 5 }, { enabled: !!user });
  const { data: heroData, refetch: refetchHero } = trpc.siteSettings.getHeroImage.useQuery();

  // Image migration
  const [migrateResult, setMigrateResult] = useState<{ total: number; migrated: number; failed: number; errors: string[] } | null>(null);
  const migrateMutation = trpc.admin.migrateImages.useMutation({
    onSuccess: (data) => {
      setMigrateResult(data);
      if (data.failed === 0) {
        toast.success(`Successfully migrated ${data.migrated} product images to Manus storage.`);
      } else {
        toast.warning(`Migrated ${data.migrated} images, ${data.failed} failed. Check results below.`);
      }
    },
    onError: (err) => toast.error(`Migration failed: ${err.message}`),
  });

  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation();
  const updateHeroMutation = trpc.siteSettings.updateHeroImage.useMutation({
    onSuccess: () => {
      toast.success("Hero image updated successfully.");
      refetchHero();
    },
    onError: () => toast.error("Failed to update hero image."),
  });
  const utils = trpc.useUtils();

  const heroFileRef = useRef<HTMLInputElement>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setHeroPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setHeroUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-hero", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json() as { url: string };
      await updateHeroMutation.mutateAsync({ url });
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setHeroUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0F0F0F" }}>
        <div style={{ color: "var(--gold)", fontSize: "24px" }}>◆</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0F0F0F", gap: "24px" }}>
        <div style={{ color: "var(--gold)", fontSize: "48px" }}>◆</div>
        <h2 style={{ color: "#fff", fontFamily: "var(--font-serif)", fontSize: "24px", margin: 0 }}>Session Expired</h2>
        <p style={{ color: "#aaa", fontSize: "14px", margin: 0, textAlign: "center", maxWidth: "320px" }}>Your session has expired. Please sign in again to access the admin dashboard.</p>
        <a href={getLoginUrl("/admin")} style={{ background: "var(--gold)", color: "#0F0F0F", padding: "12px 32px", borderRadius: "4px", textDecoration: "none", fontWeight: 600, fontSize: "13px", letterSpacing: "0.1em" }}>SIGN IN</a>
        <a href="/" style={{ color: "#aaa", fontSize: "13px", textDecoration: "none" }}>Go to Homepage</a>
      </div>
    );
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  const METRIC_CARDS = [
    {
      label: "Total Revenue",
      value: metrics ? formatPrice(Number(metrics.totalRevenue ?? 0)) : "—",
      icon: TrendingUp,
      color: "#10B981",
      sub: `${metrics?.totalOrders ?? 0} orders`,
    },
    {
      label: "Pending Packing",
      value: String(metrics?.pendingOrders ?? 0),
      icon: Package,
      color: "#F59E0B",
      sub: "Awaiting dispatch",
    },
    {
      label: "In Transit",
      value: String(metrics?.shippedOrders ?? 0),
      icon: Truck,
      color: "#3B82F6",
      sub: "Active shipments",
    },
    {
      label: "Payment Issues",
      value: String(metrics?.failedPayments ?? 0),
      icon: CreditCard,
      color: "#EF4444",
      sub: "Require attention",
    },
    {
      label: "Total Customers",
      value: String(metrics?.totalCustomers ?? 0),
      icon: Users,
      color: "#8B5CF6",
      sub: "Registered accounts",
    },
    {
      label: "Low Stock Items",
      value: String(lowStockProducts?.length ?? 0),
      icon: AlertTriangle,
      color: "#F97316",
      sub: "Below threshold",
    },
  ];

  return (
    <AdminLayout title="Operations Dashboard">
      {/* Metric Cards — responsive grid */}
      <div className="admin-metrics-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "28px",
      }}>
        {METRIC_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{
              background: "#1A1A1A",
              border: "1px solid rgba(201,169,110,0.1)",
              padding: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  {card.label}
                </div>
                <Icon size={14} color={card.color} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 300, color: "white", marginBottom: "4px" }}>
                {card.value}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders + Low Stock — stack on mobile */}
      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", marginBottom: "28px" }}>
        {/* Recent Orders */}
        <div style={{ background: "#1A1A1A", border: "1px solid rgba(201,169,110,0.1)", overflow: "hidden" }}>
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(201,169,110,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
              Recent Orders
            </div>
            <button
              onClick={() => navigate("/admin/orders")}
              style={{ fontSize: "10px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer" }}
            >
              View All →
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,169,110,0.08)" }}>
                  {["Order", "Customer", "Amount", "Status", "Action"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders && recentOrders.length > 0 ? recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid rgba(201,169,110,0.05)" }}>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--gold)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
                      {order.orderNumber}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
                      {order.customerName ?? "Guest"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
                      {formatPrice(Number(order.totalAmount))}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        padding: "3px 8px",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        background: `${STATUS_COLORS[order.deliveryStatus ?? "pending"]}20`,
                        color: STATUS_COLORS[order.deliveryStatus ?? "pending"],
                        border: `1px solid ${STATUS_COLORS[order.deliveryStatus ?? "pending"]}40`,
                        whiteSpace: "nowrap",
                      }}>
                        {STATUS_LABELS[order.deliveryStatus ?? "pending"]}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <select
                        style={{
                          background: "#0F0F0F",
                          border: "1px solid rgba(201,169,110,0.2)",
                          color: "rgba(255,255,255,0.6)",
                          fontSize: "10px",
                          padding: "4px 8px",
                          cursor: "pointer",
                        }}
                        value={order.deliveryStatus ?? "pending"}
                        onChange={async (e) => {
                          await updateStatusMutation.mutateAsync({
                            orderId: order.id,
                            status: e.target.value as "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "returned",
                          });
                          utils.admin.getRecentOrders.invalidate();
                        }}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ background: "#1A1A1A", border: "1px solid rgba(201,169,110,0.1)", height: "fit-content" }}>
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(201,169,110,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
              Low Stock Alerts
            </div>
            <AlertTriangle size={14} color="#F97316" />
          </div>
          <div>
            {lowStockProducts && lowStockProducts.length > 0 ? lowStockProducts.map((p) => (
              <div key={p.id} style={{
                padding: "12px 18px",
                borderBottom: "1px solid rgba(201,169,110,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{"—"}</div>
                </div>
                <span style={{
                  padding: "3px 8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: p.stock === 0 ? "#EF444420" : "#F9731620",
                  color: p.stock === 0 ? "#EF4444" : "#F97316",
                  border: `1px solid ${p.stock === 0 ? "#EF444440" : "#F9731640"}`,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {p.stock === 0 ? "Out of Stock" : `${p.stock} left`}
                </span>
              </div>
            )) : (
              <div style={{ padding: "32px 18px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
                All products well-stocked
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Image Upload */}
      <div style={{
        background: "#1A1A1A",
        border: "1px solid rgba(201,169,110,0.15)",
        borderRadius: "4px",
        padding: "24px",
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <ImageIcon size={16} color="var(--gold)" />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 400, color: "white", letterSpacing: "1px", margin: 0 }}>
            Homepage Hero Image
          </h3>
        </div>
        <div className="admin-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Current Image</div>
            <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: "4px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              <img
                src={heroPreview ?? heroData?.url ?? "/manus-storage/hero_banner_5729f2e3.webp"}
                alt="Current hero"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Upload New Image</div>
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleHeroFileChange}
            />
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={heroUploading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                background: heroUploading ? "rgba(201,169,110,0.3)" : "rgba(201,169,110,0.15)",
                border: "1px solid rgba(201,169,110,0.4)",
                borderRadius: "4px",
                color: "var(--gold)",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: heroUploading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Upload size={14} />
              {heroUploading ? "Uploading..." : "Choose Image File"}
            </button>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "10px", lineHeight: 1.6 }}>
              Recommended: 1920×1080px or wider, JPEG/WebP format.
            </p>
          </div>
        </div>
      </div>

      {/* Migrate Product Images */}
      <div style={{
        background: "#1A1A1A",
        border: "1px solid rgba(201,169,110,0.15)",
        borderRadius: "4px",
        padding: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <ImageIcon size={16} color="var(--gold)" />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 400, color: "white", letterSpacing: "1px", margin: 0 }}>
            Migrate Product Images
          </h3>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "20px", lineHeight: 1.6 }}>
          Downloads all Google Drive product images server-side and re-hosts them on Manus storage so they display correctly on the storefront.
        </p>
        <button
          onClick={() => { setMigrateResult(null); migrateMutation.mutate(); }}
          disabled={migrateMutation.isPending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: migrateMutation.isPending ? "rgba(201,169,110,0.3)" : "rgba(201,169,110,0.15)",
            border: "1px solid rgba(201,169,110,0.4)",
            borderRadius: "4px",
            color: "var(--gold)",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: migrateMutation.isPending ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          <Upload size={14} />
          {migrateMutation.isPending ? "Migrating Images..." : "Start Image Migration"}
        </button>
        {migrateResult && (
          <div style={{ marginTop: "20px", padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: "24px", marginBottom: migrateResult.errors.length > 0 ? "16px" : 0 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 600, color: "white" }}>{migrateResult.total}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase" }}>Total</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 600, color: "#10B981" }}>{migrateResult.migrated}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase" }}>Migrated</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 600, color: migrateResult.failed > 0 ? "#EF4444" : "rgba(255,255,255,0.3)" }}>{migrateResult.failed}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase" }}>Failed</div>
              </div>
            </div>
            {migrateResult.errors.length > 0 && (
              <div style={{ fontSize: "11px", color: "rgba(255,100,100,0.8)", lineHeight: 1.8 }}>
                {migrateResult.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

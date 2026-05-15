import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────
type TimePreset = "today" | "7d" | "30d" | "mtd" | "ytd" | "custom";

interface DateRange {
  startAt: number;
  endAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPresetRange(preset: TimePreset): DateRange {
  const now = Date.now();
  const d = new Date();
  switch (preset) {
    case "today":
      return { startAt: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), endAt: now };
    case "7d":
      return { startAt: now - 7 * 86400000, endAt: now };
    case "30d":
      return { startAt: now - 30 * 86400000, endAt: now };
    case "mtd":
      return { startAt: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), endAt: now };
    case "ytd":
      return { startAt: new Date(d.getFullYear(), 0, 1).getTime(), endAt: now };
    default:
      return { startAt: now - 30 * 86400000, endAt: now };
  }
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtNum(n: number) {
  return n.toLocaleString("en-IN");
}

function delta(pct: number) {
  if (pct === 0) return null;
  const up = pct > 0;
  return (
    <span className={`ceo-delta ${up ? "ceo-delta-up" : "ceo-delta-down"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

const CATEGORY_COLORS = ["#C9A96E", "#8B6914", "#E8C98A", "#5C4008", "#F0DEB0", "#3D2A00"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PulseCard({
  label, value, sub, pct, accent = false,
}: { label: string; value: string; sub?: string; pct?: number; accent?: boolean }) {
  return (
    <div className={`ceo-pulse-card${accent ? " ceo-pulse-card--accent" : ""}`}>
      <div className="ceo-pulse-label">{label}</div>
      <div className="ceo-pulse-value">{value}</div>
      {sub && <div className="ceo-pulse-sub">{sub}</div>}
      {pct !== undefined && delta(pct)}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="ceo-section-header">
      <h2 className="ceo-section-title">{title}</h2>
      {subtitle && <p className="ceo-section-sub">{subtitle}</p>}
    </div>
  );
}

function AlertBadge({ type }: { type: "critical" | "warning" | "info" }) {
  const map = { critical: "ceo-alert-critical", warning: "ceo-alert-warning", info: "ceo-alert-info" };
  const label = { critical: "CRITICAL", warning: "WARNING", info: "INFO" };
  return <span className={`ceo-alert-badge ${map[type]}`}>{label[type]}</span>;
}

function StockDot({ status }: { status: "in_stock" | "low_stock" | "out_of_stock" }) {
  const map = { in_stock: "#22c55e", low_stock: "#f59e0b", out_of_stock: "#ef4444" };
  return <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: map[status], flexShrink: 0 }} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCEO() {
  const [preset, setPreset] = useState<TimePreset>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "low_stock" | "out_of_stock" | "dead">("all");

  const range = useMemo<DateRange>(() => {
    if (preset === "custom" && customStart && customEnd) {
      return { startAt: new Date(customStart).getTime(), endAt: new Date(customEnd + "T23:59:59").getTime() };
    }
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  const metricsQ = trpc.admin.getCeoMetrics.useQuery(range, { refetchInterval: 60000 });
  const revenueByDayQ = trpc.admin.getRevenueByDay.useQuery(range, { refetchInterval: 60000 });
  const revByCatQ = trpc.admin.getRevenueByCategory.useQuery(range, { refetchInterval: 60000 });
  const topProductsQ = trpc.admin.getTopProducts.useQuery(range, { refetchInterval: 60000 });
  const inventoryQ = trpc.admin.getInventoryHealth.useQuery(undefined, { refetchInterval: 120000 });
  const fulfilmentQ = trpc.admin.getFulfilmentMetrics.useQuery(range, { refetchInterval: 60000 });
  const alertsQ = trpc.admin.getCeoAlerts.useQuery(undefined, { refetchInterval: 30000 });

  const m = metricsQ.data;
  const inv = inventoryQ.data;
  const ful = fulfilmentQ.data;
  const alerts = alertsQ.data ?? [];

  const filteredProducts = useMemo(() => {
    const all = inv?.products ?? [];
    if (inventoryFilter === "all") return all;
    if (inventoryFilter === "dead") return all.filter(p => p.isDeadStock);
    return all.filter(p => p.status === inventoryFilter);
  }, [inv, inventoryFilter]);

  const presets: { key: TimePreset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "mtd", label: "This Month" },
    { key: "ytd", label: "This Year" },
    { key: "custom", label: "Custom" },
  ];

  const pipelineStages = [
    { key: "pending", label: "Pending", color: "#6b7280" },
    { key: "packed", label: "Packed", color: "#3b82f6" },
    { key: "shipped", label: "Shipped", color: "#8b5cf6" },
    { key: "out_for_delivery", label: "Out for Delivery", color: "#f59e0b" },
    { key: "delivered", label: "Delivered", color: "#22c55e" },
    { key: "returned", label: "Returned", color: "#ef4444" },
  ];

  return (
    <div className="ceo-root">
      {/* ── Top Bar ── */}
      <div className="ceo-topbar">
        <div className="ceo-topbar-left">
          <Link href="/admin" className="ceo-back-link">← Admin</Link>
          <div>
            <h1 className="ceo-topbar-title">CEO Command Centre</h1>
            <p className="ceo-topbar-sub">The Jewel Gallery · One view of your entire business</p>
          </div>
        </div>
        <div className="ceo-topbar-right">
          {/* Time Selector */}
          <div className="ceo-time-selector">
            {presets.map(p => (
              <button
                key={p.key}
                className={`ceo-time-btn${preset === p.key ? " ceo-time-btn--active" : ""}`}
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="ceo-custom-range">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="ceo-date-input" />
              <span>–</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="ceo-date-input" />
            </div>
          )}
        </div>
      </div>

      <div className="ceo-body">
        {/* ── Alerts Sidebar ── */}
        {alerts.length > 0 && (
          <aside className="ceo-alerts-sidebar">
            <div className="ceo-alerts-title">⚡ Action Required</div>
            {alerts.map((a, i) => (
              <div key={i} className="ceo-alert-item">
                <AlertBadge type={a.type} />
                <div className="ceo-alert-text">
                  <div className="ceo-alert-name">{a.title}</div>
                  <div className="ceo-alert-detail">{a.detail}</div>
                </div>
              </div>
            ))}
          </aside>
        )}

        <div className="ceo-main">
          {/* ═══════════════════════════════════════════════════════
              ZONE 1 — PULSE BAR
          ═══════════════════════════════════════════════════════ */}
          <section className="ceo-section">
            <div className="ceo-pulse-grid">
              <PulseCard label="Revenue Today" value={fmt(m?.revenueToday ?? 0)} accent />
              <PulseCard label="Revenue MTD" value={fmt(m?.revenueMTD ?? 0)} sub={`YTD: ${fmt(m?.revenueYTD ?? 0)}`} />
              <PulseCard
                label={`Revenue (${presets.find(p => p.key === preset)?.label})`}
                value={fmt(m?.revenueInRange ?? 0)}
                pct={m?.revenueVsPrev}
              />
              <PulseCard
                label="Orders"
                value={fmtNum(m?.ordersInRange ?? 0)}
                sub={`Today: ${m?.ordersToday ?? 0}`}
                pct={m?.ordersVsPrev}
              />
              <PulseCard
                label="Avg Order Value"
                value={fmt(m?.aov ?? 0)}
              />
              <PulseCard
                label="New Customers"
                value={fmtNum(m?.newCustomersInRange ?? 0)}
                sub={`Total: ${fmtNum(m?.totalCustomers ?? 0)}`}
              />
              <PulseCard
                label="Repeat Rate"
                value={`${m?.repeatRate ?? 0}%`}
                sub={`${m?.repeatCustomers ?? 0} repeat buyers`}
              />
              <PulseCard
                label="Payment Failure"
                value={`${m?.paymentFailureRate ?? 0}%`}
                accent={Boolean(m?.paymentFailureRate && m.paymentFailureRate > 5)}
              />
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              ZONE 2 — REVENUE INTELLIGENCE
          ═══════════════════════════════════════════════════════ */}
          <section className="ceo-section">
            <SectionHeader
              title="Revenue Intelligence"
              subtitle="Daily revenue trend, category breakdown, and top-performing products"
            />
            <div className="ceo-revenue-grid">
              {/* Daily Revenue Chart */}
              <div className="ceo-chart-card ceo-chart-card--wide">
                <div className="ceo-chart-title">Daily Revenue</div>
                {revenueByDayQ.isLoading ? (
                  <div className="ceo-loading">Loading chart…</div>
                ) : (revenueByDayQ.data?.length ?? 0) === 0 ? (
                  <div className="ceo-empty">No revenue data for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueByDayQ.data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickFormatter={v => {
                          const d = new Date(v);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={v => fmt(v)} width={60} />
                      <Tooltip
                        formatter={(v: number) => [fmt(v), "Revenue"]}
                        labelFormatter={l => new Date(l).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        contentStyle={{ background: "#fff", border: "1px solid var(--linen-dark)", borderRadius: 6, fontSize: 12, color: "var(--text-dark)" }}
                      />
                      <Bar dataKey="revenue" fill="#C9A96E" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category Donut */}
              <div className="ceo-chart-card">
                <div className="ceo-chart-title">Revenue by Category</div>
                {revByCatQ.isLoading ? (
                  <div className="ceo-loading">Loading…</div>
                ) : (revByCatQ.data?.length ?? 0) === 0 ? (
                  <div className="ceo-empty">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={revByCatQ.data}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {revByCatQ.data!.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [fmt(v), "Revenue"]}
                        contentStyle={{ background: "#fff", border: "1px solid var(--linen-dark)", borderRadius: 6, fontSize: 12, color: "var(--text-dark)" }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => <span style={{ fontSize: 11, color: "#ccc" }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Products Table */}
            <div className="ceo-chart-card" style={{ marginTop: 16 }}>
              <div className="ceo-chart-title">Top 10 Products by Revenue</div>
              {topProductsQ.isLoading ? (
                <div className="ceo-loading">Loading…</div>
              ) : (topProductsQ.data?.length ?? 0) === 0 ? (
                <div className="ceo-empty">No sales data for this period</div>
              ) : (
                <div className="ceo-table-wrap">
                  <table className="ceo-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th className="ceo-th-right">Units</th>
                        <th className="ceo-th-right">Orders</th>
                        <th className="ceo-th-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductsQ.data!.map((p, i) => (
                        <tr key={i}>
                          <td className="ceo-td-rank">{i + 1}</td>
                          <td>
                            <div className="ceo-product-cell">
                              {p.productImage && (
                                <img src={p.productImage} alt="" className="ceo-product-thumb" />
                              )}
                              <span className="ceo-product-name">{p.productName}</span>
                            </div>
                          </td>
                          <td className="ceo-td-right">{p.units}</td>
                          <td className="ceo-td-right">{p.orderCount}</td>
                          <td className="ceo-td-right ceo-td-gold">{fmt(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              ZONE 3 — INVENTORY HEALTH
          ═══════════════════════════════════════════════════════ */}
          <section className="ceo-section">
            <SectionHeader
              title="Inventory Health"
              subtitle="Stock status, dead stock, and days of supply for every active product"
            />

            {/* Summary Cards */}
            {inv && (
              <div className="ceo-inv-summary">
                <div className="ceo-inv-card ceo-inv-card--green">
                  <div className="ceo-inv-num">{inv.summary.inStock}</div>
                  <div className="ceo-inv-lbl">In Stock</div>
                </div>
                <div className="ceo-inv-card ceo-inv-card--amber">
                  <div className="ceo-inv-num">{inv.summary.lowStock}</div>
                  <div className="ceo-inv-lbl">Low Stock (≤3)</div>
                </div>
                <div className="ceo-inv-card ceo-inv-card--red">
                  <div className="ceo-inv-num">{inv.summary.outOfStock}</div>
                  <div className="ceo-inv-lbl">Out of Stock</div>
                </div>
                <div className="ceo-inv-card ceo-inv-card--grey">
                  <div className="ceo-inv-num">{inv.summary.deadStock}</div>
                  <div className="ceo-inv-lbl">Dead Stock (60d)</div>
                </div>
                <div className="ceo-inv-card ceo-inv-card--gold">
                  <div className="ceo-inv-num">{fmt(inv.summary.totalStockValue)}</div>
                  <div className="ceo-inv-lbl">Stock Value (Retail)</div>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="ceo-inv-filters">
              {(["all", "low_stock", "out_of_stock", "dead"] as const).map(f => (
                <button
                  key={f}
                  className={`ceo-inv-filter-btn${inventoryFilter === f ? " ceo-inv-filter-btn--active" : ""}`}
                  onClick={() => setInventoryFilter(f)}
                >
                  {f === "all" ? "All Products" : f === "low_stock" ? "Low Stock" : f === "out_of_stock" ? "Out of Stock" : "Dead Stock"}
                  {f !== "all" && inv && (
                    <span className="ceo-inv-filter-count">
                      {f === "low_stock" ? inv.summary.lowStock : f === "out_of_stock" ? inv.summary.outOfStock : inv.summary.deadStock}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            {inventoryQ.isLoading ? (
              <div className="ceo-loading">Loading inventory…</div>
            ) : filteredProducts.length === 0 ? (
              <div className="ceo-empty">No products match this filter</div>
            ) : (
              <div className="ceo-inv-table-wrap">
                <table className="ceo-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th className="ceo-th-right">Stock</th>
                      <th className="ceo-th-right">Sold (60d)</th>
                      <th className="ceo-th-right">Days Supply</th>
                      <th className="ceo-th-right">Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} className={p.isDeadStock ? "ceo-row-dead" : ""}>
                        <td><StockDot status={p.status} /></td>
                        <td>
                          <div className="ceo-product-cell">
                            {p.image && <img src={p.image} alt="" className="ceo-product-thumb" />}
                            <span className="ceo-product-name">{p.name}</span>
                          </div>
                        </td>
                        <td className="ceo-td-mono">{p.sku || "—"}</td>
                        <td className="ceo-td-cap">{p.category}</td>
                        <td className={`ceo-td-right ${p.stock === 0 ? "ceo-td-red" : p.stock <= 3 ? "ceo-td-amber" : "ceo-td-green"}`}>
                          {p.stock}
                        </td>
                        <td className="ceo-td-right">{p.unitsSold60d}</td>
                        <td className="ceo-td-right">
                          {p.daysOfSupply !== null ? (
                            <span className={p.daysOfSupply < 14 ? "ceo-td-amber" : ""}>{p.daysOfSupply}d</span>
                          ) : "—"}
                        </td>
                        <td className="ceo-td-right">{fmt(p.stockValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════
              ZONE 4 — FULFILMENT PIPELINE
          ═══════════════════════════════════════════════════════ */}
          <section className="ceo-section">
            <SectionHeader
              title="Fulfilment Pipeline"
              subtitle="Order flow from payment to doorstep — SLAs, return rates, and shipping mix"
            />

            {/* Pipeline Kanban */}
            <div className="ceo-pipeline">
              {pipelineStages.map(stage => {
                const count = ful?.pipeline?.[stage.key as keyof typeof ful.pipeline] ?? 0;
                return (
                  <div key={stage.key} className="ceo-pipeline-stage">
                    <div className="ceo-pipeline-count" style={{ color: stage.color }}>{count}</div>
                    <div className="ceo-pipeline-label">{stage.label}</div>
                    <div className="ceo-pipeline-bar" style={{ background: stage.color, opacity: count > 0 ? 1 : 0.15 }} />
                  </div>
                );
              })}
            </div>

            {/* Fulfilment KPIs */}
            <div className="ceo-ful-kpis">
              <div className="ceo-ful-kpi">
                <div className="ceo-ful-kpi-val">
                  {ful?.avgDispatchHours !== null && ful?.avgDispatchHours !== undefined
                    ? `${ful.avgDispatchHours}h`
                    : "—"}
                </div>
                <div className="ceo-ful-kpi-lbl">Avg Dispatch Time</div>
                <div className="ceo-ful-kpi-target">Target: &lt;24h</div>
              </div>
              <div className="ceo-ful-kpi">
                <div className={`ceo-ful-kpi-val ${(ful?.returnRate ?? 0) > 5 ? "ceo-td-red" : ""}`}>
                  {ful?.returnRate ?? 0}%
                </div>
                <div className="ceo-ful-kpi-lbl">Return Rate</div>
                <div className="ceo-ful-kpi-target">Target: &lt;5%</div>
              </div>
              <div className="ceo-ful-kpi">
                <div className={`ceo-ful-kpi-val ${(ful?.paymentFailureRate ?? 0) > 5 ? "ceo-td-red" : ""}`}>
                  {ful?.paymentFailureRate ?? 0}%
                </div>
                <div className="ceo-ful-kpi-lbl">Payment Failure Rate</div>
                <div className="ceo-ful-kpi-target">Target: &lt;3%</div>
              </div>
              <div className="ceo-ful-kpi">
                <div className="ceo-ful-kpi-val">
                  {ful ? `${ful.expressVsStandard.express} / ${ful.expressVsStandard.standard}` : "—"}
                </div>
                <div className="ceo-ful-kpi-lbl">Express / Standard Orders</div>
              </div>
            </div>

            {/* Shipping Mix Bar */}
            {ful && (ful.expressVsStandard.express + ful.expressVsStandard.standard) > 0 && (
              <div className="ceo-shipping-mix">
                <div className="ceo-shipping-mix-label">Shipping Mix</div>
                <div className="ceo-shipping-mix-bar">
                  {(() => {
                    const total = ful.expressVsStandard.express + ful.expressVsStandard.standard;
                    const expressPct = Math.round((ful.expressVsStandard.express / total) * 100);
                    return (
                      <>
                        <div style={{ width: `${expressPct}%`, background: "#8b5cf6", height: "100%", borderRadius: "4px 0 0 4px", transition: "width 0.5s" }} />
                        <div style={{ width: `${100 - expressPct}%`, background: "#C9A96E", height: "100%", borderRadius: "0 4px 4px 0", transition: "width 0.5s" }} />
                      </>
                    );
                  })()}
                </div>
                <div className="ceo-shipping-mix-legend">
                  <span><span style={{ background: "#8b5cf6", display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 4 }} />Express ({ful.expressVsStandard.express})</span>
                  <span><span style={{ background: "#C9A96E", display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 4 }} />Standard ({ful.expressVsStandard.standard})</span>
                </div>
              </div>
            )}
          </section>

          {/* ── Analytics Link ── */}
          <section className="ceo-section ceo-analytics-link-section">
            <div className="ceo-analytics-link-card">
              <div>
                <div className="ceo-analytics-link-title">Traffic & Storefront Analytics</div>
                <div className="ceo-analytics-link-sub">
                  Sessions, pageviews, bounce rate, device split, and top pages — available in the Manus Analytics dashboard.
                </div>
              </div>
              <a
                href={`${import.meta.env.VITE_ANALYTICS_ENDPOINT}/websites/${import.meta.env.VITE_ANALYTICS_WEBSITE_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ceo-analytics-link-btn"
              >
                Open Analytics →
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

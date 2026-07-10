import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Search, ChevronRight, X, Check, ImageIcon, Edit2 } from "lucide-react";
import AdminCelebrityEditor from "./AdminCelebrityEditor";
import { AdminLayout } from "./AdminDashboard";

// ── Product Assignment Panel ─────────────────────────────────────────────────
function ProductAssignPanel({
  celebrity,
  onClose,
}: {
  celebrity: { id: number; name: string; imageUrl?: string | null };
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: allProducts } = trpc.admin.getAllProducts.useQuery({});
  const { data: assignedIds = [] } = trpc.celebrities.getAssignedProductIds.useQuery(
    { celebrityId: celebrity.id },
    { refetchOnWindowFocus: false }
  );

  const assignMutation = trpc.celebrities.assignProduct.useMutation({
    onSuccess: () => {
      utils.celebrities.getAssignedProductIds.invalidate({ celebrityId: celebrity.id });
      utils.celebrities.bySlug.invalidate();
    },
    onError: () => toast.error("Failed to assign product"),
  });

  const unassignMutation = trpc.celebrities.unassignProduct.useMutation({
    onSuccess: () => {
      utils.celebrities.getAssignedProductIds.invalidate({ celebrityId: celebrity.id });
      utils.celebrities.bySlug.invalidate();
    },
    onError: () => toast.error("Failed to unassign product"),
  });

  const products = Array.isArray(allProducts) ? allProducts : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const assignedSet = new Set(assignedIds);

  const toggle = (productId: number) => {
    if (assignedSet.has(productId)) {
      unassignMutation.mutate({ celebrityId: celebrity.id, productId });
    } else {
      assignMutation.mutate({ celebrityId: celebrity.id, productId });
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#1A1A1A", borderRadius: "12px", width: "720px", maxWidth: "95vw",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        border: "1px solid rgba(201,169,110,0.2)",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px", borderBottom: "1px solid rgba(201,169,110,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 400, color: "white", fontFamily: "var(--font-display)" }}>
              Assign Products
            </div>
            <div style={{ fontSize: "12px", color: "rgba(201,169,110,0.7)", marginTop: "4px", letterSpacing: "0.5px" }}>
              {celebrity.name} · {assignedIds.length} product{assignedIds.length !== 1 ? "s" : ""} assigned
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", padding: "4px",
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.3)",
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              style={{
                width: "100%", padding: "10px 12px 10px 36px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", color: "white", fontSize: "13px", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "40px 0", fontSize: "13px" }}>
              No products found
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
              {filtered.map((product) => {
                const isAssigned = assignedSet.has(product.id);
                const images: string[] = Array.isArray(product.images)
                  ? product.images
                  : typeof product.images === "string"
                  ? JSON.parse(product.images)
                  : [];
                const thumb = images[0];
                return (
                  <button
                    key={product.id}
                    onClick={() => toggle(product.id)}
                    style={{
                      background: isAssigned ? "rgba(201,169,110,0.12)" : "rgba(255,255,255,0.03)",
                      border: isAssigned ? "1.5px solid rgba(201,169,110,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px", padding: "12px", cursor: "pointer",
                      textAlign: "left", position: "relative", transition: "all 0.15s",
                    }}
                  >
                    {/* Checkmark badge */}
                    {isAssigned && (
                      <div style={{
                        position: "absolute", top: "8px", right: "8px",
                        background: "var(--gold)", borderRadius: "50%",
                        width: "20px", height: "20px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={11} color="#000" strokeWidth={3} />
                      </div>
                    )}
                    {/* Thumbnail */}
                    <div style={{
                      width: "100%", aspectRatio: "1", borderRadius: "6px",
                      overflow: "hidden", background: "rgba(255,255,255,0.05)",
                      marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name ?? ""}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <ImageIcon size={24} color="rgba(255,255,255,0.2)" />
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(201,169,110,0.7)", letterSpacing: "0.5px", marginBottom: "3px" }}>
                      {product.sku}
                    </div>
                    <div style={{ fontSize: "12px", color: "white", fontWeight: 500, lineHeight: 1.3 }}>
                      {product.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button onClick={onClose} style={{
            padding: "10px 28px", background: "var(--gold)", border: "none",
            borderRadius: "6px", color: "#000", fontSize: "12px", fontWeight: 600,
            letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer",
          }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCelebrities() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<{ id: number; name: string; imageUrl?: string | null } | null>(null);
  const [editingCeleb, setEditingCeleb] = useState<(typeof celebrities)[0] | null>(null);
  const [creating, setCreating] = useState(false);
  const utils = trpc.useUtils();

  const { data: celebrities = [], isLoading: celebLoading } = trpc.celebrities.adminList.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  useEffect(() => {
    if (!loading && !user) navigate("/admin");
  }, [loading, user, navigate]);

  return (
    <AdminLayout title="Celebrity Management">
      {selected && (
        <ProductAssignPanel celebrity={selected} onClose={() => setSelected(null)} />
      )}

      {creating && (
        <AdminCelebrityEditor
          celebrity={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            utils.celebrities.adminList.invalidate();
          }}
        />
      )}

      {editingCeleb && (
        <AdminCelebrityEditor
          celebrity={editingCeleb as Parameters<typeof AdminCelebrityEditor>[0]["celebrity"]}
          onClose={() => setEditingCeleb(null)}
          onSaved={() => {
            utils.celebrities.adminList.invalidate();
            utils.celebrities.bySlug.invalidate();
          }}
        />
      )}

      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Click on a celebrity to assign or remove products from their "Shop the Look" section on the public celebrity detail page.
        </p>
        <button
          onClick={() => setCreating(true)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", background: "var(--gold)", border: "none",
            borderRadius: "8px", cursor: "pointer", color: "#1A1A1A",
            fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px",
            whiteSpace: "nowrap",
          }}
        >
          + Add Celebrity
        </button>
      </div>

      {celebLoading ? (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading celebrities…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {celebrities.map((celeb) => (
            <div
              key={celeb.id}
              style={{
                background: "#1A1A1A", borderRadius: "12px",
                border: "1px solid rgba(201,169,110,0.15)",
                overflow: "hidden",
              }}
            >
              {/* Photo */}
              <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#111" }}>
                {celeb.imageUrl ? (
                  <img
                    src={celeb.imageUrl}
                    alt={celeb.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon size={32} color="rgba(255,255,255,0.15)" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: "15px", fontWeight: 500, color: "white", fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                  {celeb.name}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(201,169,110,0.7)", letterSpacing: "0.5px", marginBottom: "16px" }}>
                  {celeb.designation ?? "Celebrity"}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setSelected({ id: celeb.id, name: celeb.name, imageUrl: celeb.imageUrl })}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.25)",
                      borderRadius: "8px", cursor: "pointer", color: "var(--gold)",
                      fontSize: "12px", fontWeight: 500, letterSpacing: "0.5px",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>Assign Products</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setEditingCeleb(celeb)}
                    title="Full Edit"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "10px 12px",
                      background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.25)",
                      borderRadius: "8px", cursor: "pointer", color: "var(--gold)",
                      transition: "all 0.15s",
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

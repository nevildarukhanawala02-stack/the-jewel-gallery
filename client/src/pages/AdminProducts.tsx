import { AdminLayout } from "./AdminDashboard";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "../const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Search, Plus, Edit2, Eye, EyeOff } from "lucide-react";

const CATEGORY_TABS = [
  { label: "All", value: undefined },
  { label: "Rings", value: "rings" },
  { label: "Necklaces", value: "necklaces" },
  { label: "Earrings", value: "earrings" },
  { label: "Bracelets", value: "bracelets" },
];

export default function AdminProducts() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<number, { price: string; stock: string }>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", slug: "", category: "rings", collection: "", price: "", stock: "0",
    material: "", description: "", sku: "",
  });

  const { data: products, isLoading } = trpc.admin.getAllProducts.useQuery(
    { category: category as "rings" | "necklaces" | "earrings" | "bracelets" | undefined },
    { enabled: !!user }
  );

  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const createProductMutation = trpc.admin.createProduct.useMutation();
  const utils = trpc.useUtils();

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
        <p style={{ color: "#aaa", fontSize: "14px", margin: 0, textAlign: "center", maxWidth: "320px" }}>Your session has expired. Please sign in again.</p>
        <a href={getLoginUrl("/admin/products")} style={{ background: "var(--gold)", color: "#0F0F0F", padding: "12px 32px", borderRadius: "4px", textDecoration: "none", fontWeight: 600, fontSize: "13px", letterSpacing: "0.1em" }}>SIGN IN</a>
        <a href="/" style={{ color: "#aaa", fontSize: "13px", textDecoration: "none" }}>Go to Homepage</a>
      </div>
    );
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(p);

  const filteredProducts = (products ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });

  const handleSaveEdit = async (productId: number) => {
    const vals = editValues[productId];
    if (!vals) return;
    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        price: vals.price ? parseFloat(vals.price) : undefined,
        stock: vals.stock !== undefined ? parseInt(vals.stock) : undefined,
      });
      utils.admin.getAllProducts.invalidate();
      setEditingProduct(null);
      toast.success("Product updated");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleToggleActive = async (productId: number, currentActive: boolean) => {
    try {
      await updateProductMutation.mutateAsync({ id: productId, isActive: !currentActive });
      utils.admin.getAllProducts.invalidate();
      toast.success(!currentActive ? "Product activated" : "Product deactivated");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.slug || !newProduct.price) {
      toast.error("Name, slug, and price are required");
      return;
    }
    try {
      await createProductMutation.mutateAsync({
        name: newProduct.name,
        slug: newProduct.slug,
        category: newProduct.category as "rings" | "necklaces" | "earrings" | "bracelets",
        collection: newProduct.collection || undefined,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        material: newProduct.material || undefined,
        description: newProduct.description || undefined,
        sku: newProduct.sku || undefined,
      });
      utils.admin.getAllProducts.invalidate();
      setShowAddModal(false);
      setNewProduct({ name: "", slug: "", category: "rings", collection: "", price: "", stock: "0", material: "", description: "", sku: "" });
      toast.success("Product created successfully");
    } catch {
      toast.error("Failed to create product");
    }
  };

  return (
    <AdminLayout title="Products">
      {/* Controls */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              background: "#1A1A1A",
              border: "1px solid rgba(201,169,110,0.2)",
              color: "rgba(255,255,255,0.7)",
              fontSize: "12px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setCategory(tab.value)}
              style={{
                padding: "8px 14px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                background: category === tab.value ? "rgba(201,169,110,0.15)" : "transparent",
                border: `1px solid ${category === tab.value ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                color: category === tab.value ? "var(--gold)" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "var(--gold)",
            border: "none",
            color: "white",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          <Plus size={14} />
          Add Product
        </button>

        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Products Table */}
      <div style={{ background: "#1A1A1A", border: "1px solid rgba(201,169,110,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(201,169,110,0.1)" }}>
              {["Product", "SKU", "Category", "Price", "Stock", "Bestseller", "Status", "Actions"].map((h) => (
                <th key={h} style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                  <td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                  No products found
                </td>
              </tr>
            ) : filteredProducts.map((product) => {
              const isEditing = editingProduct === product.id;
              return (
                <tr key={product.id} style={{ borderBottom: "1px solid rgba(201,169,110,0.05)" }}>
                  {/* Product Name */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: "#0F0F0F",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                        fontSize: "16px",
                        flexShrink: 0,
                        overflow: "hidden",
                      }}>
                        {Array.isArray(product.images) && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : "◆"}
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "2px" }}>{product.name}</div>
                        {product.collection && (
                          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{product.collection}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SKU */}
                  <td style={{ padding: "14px 16px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                    {"—"}
                  </td>

                  {/* Category */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "3px 8px",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      background: "rgba(201,169,110,0.1)",
                      color: "var(--gold)",
                      border: "1px solid rgba(201,169,110,0.2)",
                    }}>
                      {product.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td style={{ padding: "14px 16px" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues[product.id]?.price ?? String(product.price)}
                        onChange={(e) => setEditValues((prev) => ({
                          ...prev,
                          [product.id]: { ...prev[product.id], price: e.target.value },
                        }))}
                        style={{
                          width: "90px",
                          padding: "6px 8px",
                          background: "#0F0F0F",
                          border: "1px solid rgba(201,169,110,0.4)",
                          color: "white",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-display)" }}>
                        {formatPrice(Number(product.price))}
                      </span>
                    )}
                  </td>

                  {/* Stock */}
                  <td style={{ padding: "14px 16px" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues[product.id]?.stock ?? String(product.stock)}
                        onChange={(e) => setEditValues((prev) => ({
                          ...prev,
                          [product.id]: { ...prev[product.id], stock: e.target.value },
                        }))}
                        style={{
                          width: "70px",
                          padding: "6px 8px",
                          background: "#0F0F0F",
                          border: "1px solid rgba(201,169,110,0.4)",
                          color: "white",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: "13px",
                        color: product.stock === 0 ? "#EF4444" : product.stock <= 5 ? "#F97316" : "rgba(255,255,255,0.7)",
                        fontWeight: product.stock <= 5 ? 700 : 400,
                      }}>
                        {product.stock}
                      </span>
                    )}
                  </td>

                  {/* Bestseller */}
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <button
                      onClick={async () => {
                        try {
                          await updateProductMutation.mutateAsync({ id: product.id, isBestseller: !product.isBestseller });
                          utils.admin.getAllProducts.invalidate();
                          toast.success(product.isBestseller ? "Removed from bestsellers" : "Added to bestsellers");
                        } catch {
                          toast.error("Failed to update");
                        }
                      }}
                      title={product.isBestseller ? "Remove from bestsellers" : "Mark as bestseller"}
                      style={{
                        padding: "4px 10px",
                        background: product.isBestseller ? "rgba(201,169,110,0.15)" : "transparent",
                        border: `1px solid ${product.isBestseller ? "rgba(201,169,110,0.5)" : "rgba(255,255,255,0.1)"}`,
                        color: product.isBestseller ? "var(--gold)" : "rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {product.isBestseller ? "★ Yes" : "☆ No"}
                    </button>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "3px 8px",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      background: product.isActive ? "#10B98120" : "#EF444420",
                      color: product.isActive ? "#10B981" : "#EF4444",
                      border: `1px solid ${product.isActive ? "#10B98140" : "#EF444440"}`,
                    }}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(product.id)}
                            style={{
                              padding: "6px 12px",
                              background: "var(--gold)",
                              border: "none",
                              color: "white",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            style={{
                              padding: "6px 12px",
                              background: "transparent",
                              border: "1px solid rgba(255,255,255,0.2)",
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "10px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingProduct(product.id);
                              setEditValues((prev) => ({
                                ...prev,
                                [product.id]: { price: String(product.price), stock: String(product.stock) },
                              }));
                            }}
                            title="Edit price & stock"
                            style={{
                              padding: "6px",
                              background: "transparent",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.5)",
                              cursor: "pointer",
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(product.id, product.isActive ?? true)}
                            title={product.isActive ? "Deactivate" : "Activate"}
                            style={{
                              padding: "6px",
                              background: "transparent",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: product.isActive ? "#10B981" : "rgba(255,255,255,0.3)",
                              cursor: "pointer",
                            }}
                          >
                            {product.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#1A1A1A",
            border: "1px solid rgba(201,169,110,0.2)",
            padding: "32px",
            width: "600px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, color: "white" }}>
                Add New Product
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "20px" }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { label: "Product Name *", key: "name", type: "text", placeholder: "e.g. Celestial Solitaire Ring" },
                { label: "Slug *", key: "slug", type: "text", placeholder: "e.g. celestial-solitaire-ring" },
                { label: "Price (₹) *", key: "price", type: "number", placeholder: "e.g. 4500" },
                { label: "Stock", key: "stock", type: "number", placeholder: "e.g. 10" },
                { label: "Collection", key: "collection", type: "text", placeholder: "e.g. Celestial Collection" },
                { label: "Material", key: "material", type: "text", placeholder: "e.g. 925 Sterling Silver" },
                { label: "SKU", key: "sku", type: "text", placeholder: "e.g. TJG-RNG-001" },
              ].map((field) => (
                <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={newProduct[field.key as keyof typeof newProduct]}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    style={{
                      padding: "10px 12px",
                      background: "#0F0F0F",
                      border: "1px solid rgba(201,169,110,0.2)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Category *
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
                  style={{
                    padding: "10px 12px",
                    background: "#0F0F0F",
                    border: "1px solid rgba(201,169,110,0.2)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "12px",
                    outline: "none",
                  }}
                >
                  <option value="rings">Rings</option>
                  <option value="necklaces">Necklaces</option>
                  <option value="earrings">Earrings</option>
                  <option value="bracelets">Bracelets</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Description
                </label>
                <textarea
                  placeholder="Product description..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    padding: "10px 12px",
                    background: "#0F0F0F",
                    border: "1px solid rgba(201,169,110,0.2)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "12px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={handleCreateProduct}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "var(--gold)",
                  border: "none",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Create Product
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

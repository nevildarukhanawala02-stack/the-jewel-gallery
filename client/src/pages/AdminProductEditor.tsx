import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type ImageType = "product" | "model" | "lifestyle";

interface ProductFull {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  category: "rings" | "necklaces" | "earrings" | "bracelets";
  collection: string | null;
  subcategory: string | null;
  description: string | null;
  shortDescription: string | null;
  price: string;
  comparePrice: string | null;
  stock: number;
  material: string | null;
  gemstone: string | null;
  weight: string | null;
  dimensions: string | null;
  images: string[] | null;
  imageTypes: ImageType[] | null;
  isFeatured: boolean | null;
  isNewArrival: boolean | null;
  isBestseller: boolean | null;
  isActive: boolean | null;
  part1Headline: string | null;
  part2WhatsInside: string | null;
  part3AsWorn: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface Props {
  product: ProductFull;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["rings", "necklaces", "earrings", "bracelets"] as const;
const SUBCATEGORIES: Record<string, string[]> = {
  rings: ["solitaire", "cocktail", "stackable", "engagement", "statement"],
  necklaces: ["pendant", "choker", "layered", "chain", "statement"],
  earrings: ["studs", "hoops", "drops", "chandeliers", "jhumkas"],
  bracelets: ["bangle", "cuff", "charm", "tennis", "stackable"],
};

export default function AdminProductEditor({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? "",
    category: product.category,
    collection: product.collection ?? "",
    subcategory: product.subcategory ?? "",
    description: product.description ?? "",
    shortDescription: product.shortDescription ?? "",
    price: product.price,
    comparePrice: product.comparePrice ?? "",
    stock: String(product.stock),
    material: product.material ?? "",
    gemstone: product.gemstone ?? "",
    weight: product.weight ?? "",
    dimensions: product.dimensions ?? "",
    isFeatured: product.isFeatured ?? false,
    isNewArrival: product.isNewArrival ?? false,
    isBestseller: product.isBestseller ?? false,
    isActive: product.isActive ?? true,
    part1Headline: product.part1Headline ?? "",
    part2WhatsInside: product.part2WhatsInside ?? "",
    part3AsWorn: product.part3AsWorn ?? "",
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
  });

  // Images state: array of { url, type }
  const [images, setImages] = useState<Array<{ url: string; type: ImageType }>>(
    (product.images ?? []).map((url, i) => ({
      url,
      type: (product.imageTypes?.[i] as ImageType) ?? "product",
    }))
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "photos" | "seo">("content");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProductMutation = trpc.admin.updateProductFull.useMutation();
  const uploadImageMutation = trpc.admin.uploadProductImage.useMutation();

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Photo upload ──────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(",")[1];
        const mimeType = file.type || "image/jpeg";
        const result = await uploadImageMutation.mutateAsync({
          productId: product.id,
          base64,
          mimeType,
          filename: file.name,
        });
        setImages((prev) => [...prev, { url: result.url, type: "product" }]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [product.id, uploadImageMutation]);

  // ── Drag-and-drop reorder ─────────────────────────────────────
  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIndex(i);
  };
  const handleDrop = (i: number) => {
    if (dragIndex === null || dragIndex === i) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setImages(next);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const deleteImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const setImageType = (i: number, type: ImageType) =>
    setImages((prev) => prev.map((img, idx) => idx === i ? { ...img, type } : img));

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        name: form.name,
        slug: form.slug,
        sku: form.sku || undefined,
        category: form.category,
        collection: form.collection || undefined,
        subcategory: form.subcategory || undefined,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        stock: parseInt(form.stock, 10),
        material: form.material || undefined,
        gemstone: form.gemstone || undefined,
        weight: form.weight || undefined,
        dimensions: form.dimensions || undefined,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        isBestseller: form.isBestseller,
        isActive: form.isActive,
        part1Headline: form.part1Headline || undefined,
        part2WhatsInside: form.part2WhatsInside || undefined,
        part3AsWorn: form.part3AsWorn || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        images: images.map((i) => i.url),
        imageTypes: images.map((i) => i.type),
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid var(--linen-dark)",
    borderRadius: 4,
    fontSize: 13,
    color: "var(--text-dark)",
    background: "#fff",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "var(--text-muted)",
    marginBottom: 5,
    textTransform: "uppercase",
  };
  const fieldStyle: React.CSSProperties = { marginBottom: 18 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 2000, display: "flex", alignItems: "stretch", justifyContent: "flex-end",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "min(720px, 100vw)", background: "#FAFAF8",
        display: "flex", flexDirection: "column", height: "100vh",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.12)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 28px", borderBottom: "1px solid var(--linen-dark)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#fff", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>
              Edit Product
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-dark)", fontFamily: "var(--font-serif)" }}>
              {product.name}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: "var(--text-muted)", lineHeight: 1, padding: "4px 8px",
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", borderBottom: "1px solid var(--linen-dark)",
          background: "#fff", flexShrink: 0,
        }}>
          {(["content", "photos", "seo"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "12px 24px", border: "none", background: "none",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              letterSpacing: "0.07em", textTransform: "uppercase",
              color: activeTab === tab ? "var(--gold)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: -1,
            }}>
              {tab === "content" ? "Content" : tab === "photos" ? "Photos" : "SEO"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* ── CONTENT TAB ── */}
          {activeTab === "content" && (
            <div>
              {/* Basic Info */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dark)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--linen-dark)" }}>
                  Basic Information
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Product Name *</label>
                    <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>URL Slug *</label>
                    <input style={inputStyle} value={form.slug} onChange={(e) => set("slug", e.target.value)} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>SKU</label>
                    <input style={inputStyle} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. TJG-001" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Collection</label>
                    <input style={inputStyle} value={form.collection} onChange={(e) => set("collection", e.target.value)} placeholder="e.g. After Dark" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Category *</label>
                    <select style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Subcategory</label>
                    <select style={inputStyle} value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
                      <option value="">— None —</option>
                      {(SUBCATEGORIES[form.category] ?? []).map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dark)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--linen-dark)" }}>
                  Description
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Short Description (shown in cards)</label>
                  <input style={inputStyle} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-line summary for product cards" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Full Description</label>
                  <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detailed product description shown on product page..." />
                </div>
              </div>

              {/* Rich Content */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dark)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--linen-dark)" }}>
                  Rich Content (Product Page Sections)
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Headline (Part 1)</label>
                  <input style={inputStyle} value={form.part1Headline} onChange={(e) => set("part1Headline", e.target.value)} placeholder="e.g. Where Darkness Meets Desire" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>What's Inside (Part 2)</label>
                  <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.part2WhatsInside} onChange={(e) => set("part2WhatsInside", e.target.value)} placeholder="Describe the craftsmanship, stones, and materials in detail..." />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>As Worn By (Part 3)</label>
                  <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.part3AsWorn} onChange={(e) => set("part3AsWorn", e.target.value)} placeholder="Celebrity styling notes and occasion suggestions..." />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dark)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--linen-dark)" }}>
                  Pricing & Inventory
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Price (₹) *</label>
                    <input style={inputStyle} type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Compare At Price (₹)</label>
                    <input style={inputStyle} type="number" min="0" value={form.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} placeholder="Original / MRP" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Stock *</label>
                    <input style={inputStyle} type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dark)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--linen-dark)" }}>
                  Materials & Specifications
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Material</label>
                    <input style={inputStyle} value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. 22K Gold Plated" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Gemstone</label>
                    <input style={inputStyle} value={form.gemstone} onChange={(e) => set("gemstone", e.target.value)} placeholder="e.g. Ruby, Emerald, Polki" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Weight</label>
                    <input style={inputStyle} value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 45g" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Dimensions</label>
                    <input style={inputStyle} value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="e.g. 8cm × 4cm" />
                  </div>
                </div>
              </div>

              {/* Badges & Visibility */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dark)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--linen-dark)" }}>
                  Badges & Visibility
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {(["isActive", "isFeatured", "isNewArrival", "isBestseller"] as const).map((key) => {
                    const labels: Record<string, string> = {
                      isActive: "Active (visible on store)",
                      isFeatured: "Featured",
                      isNewArrival: "New Arrival",
                      isBestseller: "Bestseller",
                    };
                    return (
                      <label key={key} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 14px", border: `1px solid ${form[key] ? "var(--gold)" : "var(--linen-dark)"}`,
                        borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 500,
                        color: form[key] ? "var(--gold)" : "var(--text-muted)",
                        background: form[key] ? "rgba(201,169,110,0.07)" : "#fff",
                        userSelect: "none",
                      }}>
                        <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} style={{ accentColor: "var(--gold)" }} />
                        {labels[key]}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── PHOTOS TAB ── */}
          {activeTab === "photos" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)" }}>Product Photos</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                    Drag to reorder. First image is the primary (shown in listings). Click the type badge to change classification.
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: "9px 18px", background: "var(--gold)", color: "#fff",
                    border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12,
                    fontWeight: 600, letterSpacing: "0.06em", opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? "Uploading…" : "+ Upload Photos"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              {images.length === 0 && (
                <div style={{
                  border: "2px dashed var(--linen-dark)", borderRadius: 8,
                  padding: "48px 24px", textAlign: "center", color: "var(--text-muted)",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
                  <div style={{ fontSize: 13 }}>No photos yet. Click "Upload Photos" to add images.</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                {images.map((img, i) => (
                  <div
                    key={img.url + i}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={handleDragEnd}
                    style={{
                      border: dragOverIndex === i ? "2px solid var(--gold)" : "1px solid var(--linen-dark)",
                      borderRadius: 6, overflow: "hidden", background: "#fff",
                      cursor: "grab", opacity: dragIndex === i ? 0.5 : 1,
                      transition: "border-color 0.15s, opacity 0.15s",
                      position: "relative",
                    }}
                  >
                    {/* Primary badge */}
                    {i === 0 && (
                      <div style={{
                        position: "absolute", top: 6, left: 6, background: "var(--gold)",
                        color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                        padding: "2px 7px", borderRadius: 3, textTransform: "uppercase", zIndex: 2,
                      }}>Primary</div>
                    )}
                    {/* Delete */}
                    <button
                      onClick={() => deleteImage(i)}
                      style={{
                        position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)",
                        color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24,
                        cursor: "pointer", fontSize: 13, lineHeight: "24px", textAlign: "center",
                        zIndex: 2, padding: 0,
                      }}
                    >✕</button>
                    <img
                      src={img.url}
                      alt={`Photo ${i + 1}`}
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                    />
                    {/* Type selector */}
                    <div style={{ padding: "6px 8px" }}>
                      <select
                        value={img.type}
                        onChange={(e) => setImageType(i, e.target.value as ImageType)}
                        style={{
                          width: "100%", fontSize: 11, padding: "4px 6px",
                          border: "1px solid var(--linen-dark)", borderRadius: 3,
                          color: "var(--text-dark)", background: "#fff", cursor: "pointer",
                        }}
                      >
                        <option value="product">Product</option>
                        <option value="model">Model</option>
                        <option value="lifestyle">Lifestyle</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SEO TAB ── */}
          {activeTab === "seo" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dark)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--linen-dark)" }}>
                  Search Engine Optimisation
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Meta Title</label>
                  <input style={inputStyle} value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder="Defaults to product name if empty" />
                  <div style={{ fontSize: 11, color: form.metaTitle.length > 60 ? "#e53e3e" : "var(--text-muted)", marginTop: 4 }}>
                    {form.metaTitle.length}/60 characters recommended
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Meta Description</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                    value={form.metaDescription}
                    onChange={(e) => set("metaDescription", e.target.value)}
                    placeholder="Brief description for search results (150–160 characters ideal)"
                  />
                  <div style={{ fontSize: 11, color: form.metaDescription.length > 160 ? "#e53e3e" : "var(--text-muted)", marginTop: 4 }}>
                    {form.metaDescription.length}/160 characters recommended
                  </div>
                </div>
                {/* Preview */}
                <div style={{ background: "#fff", border: "1px solid var(--linen-dark)", borderRadius: 6, padding: 16, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Search Preview</div>
                  <div style={{ fontSize: 16, color: "#1a0dab", marginBottom: 2 }}>
                    {form.metaTitle || form.name} — The Jewel Gallery
                  </div>
                  <div style={{ fontSize: 12, color: "#006621", marginBottom: 4 }}>
                    jewelshop-dwan7zv7.manus.space/product/{form.slug}
                  </div>
                  <div style={{ fontSize: 13, color: "#545454" }}>
                    {form.metaDescription || form.shortDescription || form.description?.slice(0, 160) || "No description set."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid var(--linen-dark)",
          background: "#fff", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0, gap: 12,
        }}>
          {error && (
            <div style={{ fontSize: 12, color: "#e53e3e", flex: 1 }}>⚠ {error}</div>
          )}
          {!error && <div style={{ flex: 1 }} />}
          <button onClick={onClose} style={{
            padding: "10px 20px", background: "transparent",
            border: "1px solid var(--linen-dark)", color: "var(--text-muted)",
            borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 28px", background: saving ? "var(--linen-dark)" : "var(--gold)",
              color: "#fff", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

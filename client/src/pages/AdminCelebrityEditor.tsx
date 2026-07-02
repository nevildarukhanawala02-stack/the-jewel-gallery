import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Upload, Trash2, ChevronUp, ChevronDown, ImageIcon, User } from "lucide-react";

interface GalleryImage {
  url: string;
  key?: string;
}

interface CelebrityData {
  id: number;
  name: string;
  slug: string;
  designation?: string | null;
  bio?: string | null;
  style?: string | null;
  occasion?: string | null;
  imageUrl?: string | null;
  galleryImages?: string | null;
  isActive?: boolean | null;
}

interface Props {
  celebrity: CelebrityData;
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminCelebrityEditor({ celebrity, onClose, onSaved }: Props) {
  const [name, setName] = useState(celebrity.name ?? "");
  const [slug, setSlug] = useState(celebrity.slug ?? "");
  const [designation, setDesignation] = useState(celebrity.designation ?? "");
  const [bio, setBio] = useState(celebrity.bio ?? "");
  const [style, setStyle] = useState(celebrity.style ?? "");
  const [occasion, setOccasion] = useState(celebrity.occasion ?? "");
  const [isActive, setIsActive] = useState(celebrity.isActive ?? true);
  const [profileImageUrl, setProfileImageUrl] = useState(celebrity.imageUrl ?? "");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => {
    try {
      const parsed = JSON.parse(celebrity.galleryImages ?? "[]");
      return Array.isArray(parsed) ? parsed.map((u: string) => ({ url: u })) : [];
    } catch {
      return [];
    }
  });

  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "photos">("details");
  const [saveError, setSaveError] = useState("");

  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const updateCelebrity = trpc.celebrities.updateCelebrity.useMutation();
  const uploadImage = trpc.celebrities.uploadCelebrityImage.useMutation();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(",")[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfile(true);
    try {
      const base64 = await toBase64(file);
      const result = await uploadImage.mutateAsync({ base64, mimeType: file.type, filename: file.name });
      setProfileImageUrl(result.url);
    } catch {
      setSaveError("Failed to upload profile photo.");
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 6 - galleryImages.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) return;
    setUploadingGallery(true);
    try {
      const uploaded: GalleryImage[] = [];
      for (const file of toUpload) {
        const base64 = await toBase64(file);
        const result = await uploadImage.mutateAsync({ base64, mimeType: file.type, filename: file.name });
        uploaded.push({ url: result.url, key: result.key });
      }
      setGalleryImages(prev => [...prev, ...uploaded]);
    } catch {
      setSaveError("Failed to upload one or more gallery images.");
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const moveGalleryImage = (index: number, direction: "up" | "down") => {
    const newArr = [...galleryImages];
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= newArr.length) return;
    [newArr[index], newArr[swapWith]] = [newArr[swapWith], newArr[index]];
    setGalleryImages(newArr);
  };

  const deleteGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await updateCelebrity.mutateAsync({
        id: celebrity.id,
        name: name || undefined,
        slug: slug || undefined,
        designation: designation || undefined,
        bio: bio || undefined,
        style: style || undefined,
        occasion: occasion || undefined,
        imageUrl: profileImageUrl || undefined,
        galleryImages: galleryImages.map(g => g.url),
        isActive,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "details", label: "Details" },
    { id: "photos", label: `Photos (${galleryImages.length + (profileImageUrl ? 1 : 0)})` },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1000, backdropFilter: "blur(2px)",
        }}
      />

      {/* Slide-over panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(680px, 100vw)",
        background: "#fff",
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-4px 0 40px rgba(0,0,0,0.15)",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px", borderBottom: "1px solid #e8e0d5",
          background: "#fff", position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8c7e", marginBottom: "4px" }}>
              Admin — Celebrity Editor
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 400, color: "#2c2c2c", margin: 0 }}>
              {celebrity.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "#6b5e52" }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8e0d5", background: "#faf8f5" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 24px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #C9A96E" : "2px solid transparent",
                color: activeTab === tab.id ? "#C9A96E" : "#6b5e52",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "28px", overflowY: "auto" }}>

          {/* ── DETAILS TAB ── */}
          {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Celebrity name" />
                </div>
                <div>
                  <label style={labelStyle}>URL Slug</label>
                  <input style={inputStyle} value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. priyanka-chopra" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Title / Designation</label>
                <input style={inputStyle} value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Actress & Style Icon" />
              </div>

              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  style={{ ...inputStyle, height: "120px", resize: "vertical" }}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Short biography or style description..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Style Tag</label>
                  <input style={inputStyle} value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g. Classic Elegance" />
                </div>
                <div>
                  <label style={labelStyle}>Occasion Tag</label>
                  <input style={inputStyle} value={occasion} onChange={e => setOccasion(e.target.value)} placeholder="e.g. Weddings & Galas" />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#faf8f5", borderRadius: "8px", border: "1px solid #e8e0d5" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#2c2c2c" }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#C9A96E" }}
                  />
                  <span style={{ fontWeight: 600 }}>Active</span>
                  <span style={{ color: "#9a8c7e", fontSize: "12px" }}>— show this celebrity on the public site</span>
                </label>
              </div>
            </div>
          )}

          {/* ── PHOTOS TAB ── */}
          {activeTab === "photos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

              {/* Profile Photo */}
              <div>
                <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8c7e", marginBottom: "12px", fontWeight: 600 }}>
                  Profile Photo
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                  {/* Preview */}
                  <div style={{
                    width: "120px", height: "150px", flexShrink: 0,
                    background: "#f5f0eb", border: "1px solid #e8e0d5", borderRadius: "4px",
                    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <User size={40} color="#c9b8a8" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", color: "#6b5e52", marginBottom: "12px", lineHeight: 1.6 }}>
                      This is the main portrait shown on the celebrity grid and profile hero. Use a high-quality portrait (min 600×750px).
                    </p>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleProfileUpload}
                    />
                    <button
                      onClick={() => profileInputRef.current?.click()}
                      disabled={uploadingProfile}
                      style={uploadBtnStyle}
                    >
                      <Upload size={14} />
                      {uploadingProfile ? "Uploading…" : profileImageUrl ? "Replace Photo" : "Upload Photo"}
                    </button>
                    {profileImageUrl && (
                      <button
                        onClick={() => setProfileImageUrl("")}
                        style={{ ...uploadBtnStyle, marginLeft: "8px", background: "#fff5f5", color: "#c0392b", borderColor: "#f5c6c6" }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e8e0d5" }} />

              {/* Gallery Images */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8c7e", fontWeight: 600 }}>
                      Gallery ({galleryImages.length}/6)
                    </div>
                    <p style={{ fontSize: "12px", color: "#9a8c7e", marginTop: "4px" }}>
                      2–6 images shown below the header on the celebrity profile page. First image appears largest.
                    </p>
                  </div>
                  {galleryImages.length < 6 && (
                    <>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleGalleryUpload}
                      />
                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={uploadingGallery}
                        style={uploadBtnStyle}
                      >
                        <Upload size={14} />
                        {uploadingGallery ? "Uploading…" : "Add Images"}
                      </button>
                    </>
                  )}
                </div>

                {galleryImages.length === 0 ? (
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    style={{
                      border: "2px dashed #d4c5b0", borderRadius: "8px",
                      padding: "40px 20px", textAlign: "center",
                      cursor: "pointer", color: "#9a8c7e",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <ImageIcon size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                    <p style={{ fontSize: "14px", marginBottom: "4px" }}>Click to add gallery images</p>
                    <p style={{ fontSize: "12px" }}>Up to 6 images • JPG, PNG, WEBP</p>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleGalleryUpload}
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {galleryImages.map((img, idx) => (
                      <div
                        key={img.url}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "10px 12px", background: "#faf8f5",
                          border: "1px solid #e8e0d5", borderRadius: "8px",
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{ width: "64px", height: "64px", flexShrink: 0, overflow: "hidden", borderRadius: "4px", background: "#f0ebe4" }}>
                          <img src={img.url} alt={`Gallery ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>

                        {/* Label */}
                        <div style={{ flex: 1, fontSize: "12px", color: "#6b5e52" }}>
                          {idx === 0 ? (
                            <span style={{ background: "#C9A96E", color: "#fff", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, letterSpacing: "1px" }}>
                              FEATURED
                            </span>
                          ) : (
                            <span style={{ color: "#9a8c7e" }}>Image {idx + 1}</span>
                          )}
                        </div>

                        {/* Controls */}
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => moveGalleryImage(idx, "up")}
                            disabled={idx === 0}
                            style={iconBtnStyle(idx === 0)}
                            title="Move up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveGalleryImage(idx, "down")}
                            disabled={idx === galleryImages.length - 1}
                            style={iconBtnStyle(idx === galleryImages.length - 1)}
                            title="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={() => deleteGalleryImage(idx)}
                            style={{ ...iconBtnStyle(false), color: "#c0392b", background: "#fff5f5", borderColor: "#f5c6c6" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid #e8e0d5",
          background: "#fff", position: "sticky", bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
        }}>
          {saveError && (
            <p style={{ fontSize: "12px", color: "#c0392b", flex: 1 }}>{saveError}</p>
          )}
          <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 600,
  letterSpacing: "1px", textTransform: "uppercase",
  color: "#6b5e52", marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #d4c5b0", borderRadius: "6px",
  fontSize: "14px", color: "#2c2c2c", background: "#fff",
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const uploadBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "8px 16px", border: "1px solid #d4c5b0",
  borderRadius: "6px", background: "#faf8f5",
  color: "#6b5e52", fontSize: "12px", fontWeight: 600,
  letterSpacing: "0.5px", cursor: "pointer",
  transition: "all 0.2s",
};

const iconBtnStyle = (disabled: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "28px", height: "28px", border: "1px solid #e8e0d5",
  borderRadius: "4px", background: "#fff", color: "#6b5e52",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.35 : 1,
  transition: "all 0.15s",
});

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 20px", border: "1px solid #d4c5b0",
  borderRadius: "6px", background: "#fff",
  color: "#6b5e52", fontSize: "13px", fontWeight: 600,
  cursor: "pointer",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "10px 28px", border: "none",
  borderRadius: "6px", background: "#C9A96E",
  color: "#fff", fontSize: "13px", fontWeight: 700,
  letterSpacing: "0.5px", cursor: "pointer",
};

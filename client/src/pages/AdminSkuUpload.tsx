import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link } from "wouter";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedRow {
  date?: string;
  sku: string;
  title: string;
  category: string;
  subCategory?: string;
  description?: string;
  imageUrls?: string[];
  price?: number;
}

interface PreviewRow extends ParsedRow {
  isDuplicate: boolean;
  isValid: boolean;
}

// ─── CSV / XLSX parser ────────────────────────────────────────────────────────

function parseGoogleDriveUrls(raw: string): string[] {
  if (!raw) return [];
  // Split on comma or newline
  return raw
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

function parseFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, {
          defval: "",
        });

        const rows: ParsedRow[] = json
          .map((row) => {
            // Normalise header keys (case-insensitive, trim)
            const get = (keys: string[]): string => {
              for (const k of keys) {
                const found = Object.keys(row).find(
                  (rk) => rk.trim().toLowerCase() === k.toLowerCase()
                );
                if (found && row[found]) return String(row[found]).trim();
              }
              return "";
            };

            const sku = get(["SKU", "sku"]);
            const title = get(["Title", "title", "TITLE"]);
            const category = get(["Category", "category", "CATEGORY"]);
            const subCategory = get([
              "Sub Category",
              "SubCategory",
              "sub_category",
              "subcategory",
            ]);
            const description = get(["Description", "description", "DESC"]);
            const imageRaw = get(["Image URLS", "Image URLs", "Images", "image_urls"]);
            const date = get(["Date", "date"]);
            const priceRaw = get(["Price", "price", "PRICE"]);
            const price = priceRaw
              ? Math.round(parseFloat(priceRaw.replace(/[₹,\s]/g, "")) || 0)
              : undefined;

            return {
              date: date || undefined,
              sku,
              title,
              category,
              subCategory: subCategory || undefined,
              description: description || undefined,
              imageUrls: parseGoogleDriveUrls(imageRaw),
              price: price && price > 0 ? price : undefined,
            };
          })
          .filter((r) => r.sku || r.title); // Drop completely empty rows

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Import Log Row ───────────────────────────────────────────────────────────

function ImportLogRow({ log }: { log: {
  id: number;
  filename: string;
  uploadedBy?: string | null;
  totalRows: number;
  newRows: number;
  duplicateRows: number;
  skippedRows: number;
  status: "success" | "partial" | "failed";
  createdAt: Date;
} }) {
  const statusColor =
    log.status === "success"
      ? "bg-emerald-100 text-emerald-700"
      : log.status === "partial"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <tr className="border-b border-[#E8E0D5] hover:bg-[#FAF6F0] transition-colors">
      <td className="py-3 px-4 text-sm text-[#5C4A3A]">
        {new Date(log.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="py-3 px-4 text-sm font-medium text-[#2C1810]">{log.filename}</td>
      <td className="py-3 px-4 text-sm text-[#5C4A3A]">{log.uploadedBy ?? "—"}</td>
      <td className="py-3 px-4 text-sm text-center text-[#5C4A3A]">{log.totalRows}</td>
      <td className="py-3 px-4 text-sm text-center font-semibold text-emerald-700">{log.newRows}</td>
      <td className="py-3 px-4 text-sm text-center text-amber-700">{log.duplicateRows}</td>
      <td className="py-3 px-4 text-sm text-center text-red-600">{log.skippedRows}</td>
      <td className="py-3 px-4">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColor}`}>
          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSkuUpload() {
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: number;
    skipped: number;
    importedSkus: string[];
    errors: string[];
  } | null>(null);

  const previewMutation = trpc.admin.previewSkuImport.useMutation();
  const importMutation = trpc.admin.importSkus.useMutation();
  const logsQuery = trpc.admin.getSkuImportLogs.useQuery({ limit: 20 });
  const utils = trpc.useUtils();

  // ── File processing ──────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setParseError(null);
    setPreviewRows(null);
    setParsedRows(null);
    setImportResult(null);
    setFileName(file.name);

    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        setParseError("No data rows found in the file. Please check the format.");
        return;
      }
      setParsedRows(rows);

      // Send to server for dedup preview
      const preview = await previewMutation.mutateAsync({ rows });
      setPreviewRows(preview);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse file.");
    }
  }, [previewMutation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // ── Import confirmation ───────────────────────────────────────────────────

  const handleImport = async () => {
    if (!parsedRows || !fileName) return;
    try {
      const result = await importMutation.mutateAsync({
        filename: fileName,
        rows: parsedRows,
      });
      setImportResult(result);
      // Refresh logs
      utils.admin.getSkuImportLogs.invalidate();
      // Clear preview so user knows it's done
      setPreviewRows(null);
      setParsedRows(null);
      setFileName(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Import failed.");
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows(null);
    setPreviewRows(null);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0]">
        <Loader2 className="animate-spin text-[#C9A96E]" size={32} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0]">
        <p className="text-[#5C4A3A]">Access denied. Admin only.</p>
      </div>
    );
  }

  // ── Derived stats ─────────────────────────────────────────────────────────

  const newCount = previewRows?.filter((r) => !r.isDuplicate && r.isValid).length ?? 0;
  const dupCount = previewRows?.filter((r) => r.isDuplicate).length ?? 0;
  const invalidCount = previewRows?.filter((r) => !r.isValid).length ?? 0;

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#E8E0D5] px-6 py-4 flex items-center gap-4">
        <Link href="/admin">
          <button className="flex items-center gap-1 text-sm text-[#5C4A3A] hover:text-[#C9A96E] transition-colors">
            <ChevronLeft size={16} />
            Dashboard
          </button>
        </Link>
        <div className="h-4 w-px bg-[#E8E0D5]" />
        <h1 className="font-cormorant text-2xl font-semibold text-[#2C1810]">
          SKU Bulk Upload
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Success result banner ── */}
        {importResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-4">
            <CheckCircle2 className="text-emerald-600 mt-0.5 shrink-0" size={22} />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800 text-lg">Import Complete</p>
              <p className="text-emerald-700 mt-1">
                <strong>{importResult.imported}</strong> new products added &nbsp;·&nbsp;
                <strong>{importResult.duplicates}</strong> duplicates skipped &nbsp;·&nbsp;
                <strong>{importResult.skipped}</strong> rows skipped (invalid)
              </p>
              {importResult.importedSkus.length > 0 && (
                <p className="text-emerald-600 text-sm mt-2">
                  Imported: {importResult.importedSkus.join(", ")}
                </p>
              )}
              {importResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm text-amber-700 cursor-pointer">
                    {importResult.errors.length} warning(s)
                  </summary>
                  <ul className="mt-1 text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
              <p className="text-sm text-emerald-600 mt-3">
                New products are set to <strong>inactive</strong> with price ₹0 — go to{" "}
                <Link href="/admin/products">
                  <span className="underline cursor-pointer">Admin Products</span>
                </Link>{" "}
                to set prices and activate them.
              </p>
            </div>
            <button onClick={handleReset} className="text-emerald-600 hover:text-emerald-800">
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* ── Upload zone ── */}
        {!previewRows && !importResult && (
          <Card className="border-[#E8E0D5] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-cormorant text-xl text-[#2C1810] flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-[#C9A96E]" />
                Upload SKU Spreadsheet
              </CardTitle>
              <p className="text-sm text-[#5C4A3A] mt-1">
                Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file with columns:
                Date, SKU, Title, Category, Sub Category, Description, Image URLS, Price.
                Duplicate SKUs are automatically detected and skipped. The Price column is optional — leave blank to set ₹0.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${isDragging
                    ? "border-[#C9A96E] bg-[#C9A96E]/5"
                    : "border-[#D4C5B0] hover:border-[#C9A96E] hover:bg-[#FAF6F0]"
                  }
                `}
              >
                <UploadCloud
                  size={40}
                  className={`mx-auto mb-4 ${isDragging ? "text-[#C9A96E]" : "text-[#B0A090]"}`}
                />
                <p className="font-cormorant text-xl text-[#2C1810] mb-1">
                  {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                </p>
                <p className="text-sm text-[#8C7B6B]">
                  or <span className="text-[#C9A96E] font-medium">browse to upload</span>
                </p>
                <p className="text-xs text-[#B0A090] mt-3">Supports .csv and .xlsx files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewMutation.isPending && (
                <div className="mt-4 flex items-center gap-2 text-[#C9A96E]">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Analysing file and checking for duplicates…</span>
                </div>
              )}

              {parseError && (
                <div className="mt-4 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-sm">{parseError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Preview table ── */}
        {previewRows && previewRows.length > 0 && (
          <Card className="border-[#E8E0D5] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="font-cormorant text-xl text-[#2C1810]">
                    Preview — {fileName}
                  </CardTitle>
                  <p className="text-sm text-[#5C4A3A] mt-1">
                    Review the rows below before confirming the import.
                  </p>
                </div>
                {/* Summary badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">{newCount} New</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    <AlertCircle size={14} className="text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">{dupCount} Duplicate{dupCount !== 1 ? "s" : ""}</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                      <XCircle size={14} className="text-red-600" />
                      <span className="text-sm font-semibold text-red-700">{invalidCount} Invalid</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F5EFE8] border-b border-[#E8E0D5]">
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A] w-28">SKU</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A]">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A] w-28">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A] w-36">Sub Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A] w-20">Images</th>
                      <th className="text-right py-3 px-4 font-semibold text-[#5C4A3A] w-24">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A] w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-[#E8E0D5] transition-colors ${
                          row.isDuplicate
                            ? "bg-amber-50/60"
                            : !row.isValid
                            ? "bg-red-50/60"
                            : "hover:bg-[#FAF6F0]"
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-[#2C1810]">
                          {row.sku || <span className="text-red-400 italic">missing</span>}
                        </td>
                        <td className="py-3 px-4 text-[#2C1810] max-w-xs">
                          <p className="truncate" title={row.title}>{row.title}</p>
                        </td>
                        <td className="py-3 px-4 text-[#5C4A3A] capitalize">{row.category}</td>
                        <td className="py-3 px-4 text-[#5C4A3A]">{row.subCategory || "—"}</td>
                        <td className="py-3 px-4 text-[#5C4A3A] text-center">
                          {row.imageUrls && row.imageUrls.length > 0
                            ? <span className="text-xs bg-[#E8E0D5] px-1.5 py-0.5 rounded">{row.imageUrls.length}</span>
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-right text-[#2C1810] font-medium">
                          {row.price && row.price > 0 ? `₹${row.price.toLocaleString("en-IN")}` : <span className="text-[#B0A090] text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          {row.isDuplicate ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              Duplicate
                            </Badge>
                          ) : !row.isValid ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              Invalid
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              New
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-4 p-4 border-t border-[#E8E0D5] bg-[#FAF6F0] flex-wrap">
                <p className="text-sm text-[#5C4A3A]">
                  {newCount === 0
                    ? "No new SKUs to import — all rows are duplicates or invalid."
                    : `${newCount} new product${newCount !== 1 ? "s" : ""} will be added. Products with a price will be set active; others will be inactive with price ₹0.`}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="border-[#D4C5B0] text-[#5C4A3A] hover:bg-[#F5EFE8]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={newCount === 0 || importMutation.isPending}
                    className="bg-[#C9A96E] hover:bg-[#B8935A] text-white"
                  >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-2" />
                        Importing…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} className="mr-2" />
                        Import {newCount} New SKU{newCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Import history ── */}
        <Card className="border-[#E8E0D5] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-cormorant text-xl text-[#2C1810] flex items-center gap-2">
              <Clock size={18} className="text-[#C9A96E]" />
              Import History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logsQuery.isLoading ? (
              <div className="flex items-center gap-2 p-6 text-[#C9A96E]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading history…</span>
              </div>
            ) : !logsQuery.data || logsQuery.data.length === 0 ? (
              <div className="p-8 text-center text-[#8C7B6B] text-sm">
                No imports yet. Upload your first SKU file above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F5EFE8] border-b border-[#E8E0D5]">
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A]">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A]">File</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A]">Uploaded By</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#5C4A3A]">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#5C4A3A]">New</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#5C4A3A]">Dupes</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#5C4A3A]">Skipped</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#5C4A3A]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsQuery.data.map((log) => (
                      <ImportLogRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/**
 * Injects Cloudinary delivery-time transformation params into an image URL.
 *
 * Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/<public_id>
 * or already have transformations:
 *   https://res.cloudinary.com/<cloud>/image/upload/c_fill,w_800/<public_id>
 *
 * We insert `f_auto,q_auto` (automatic best format + automatic quality) plus an
 * optional width cap right after the `/upload/` segment. This is a pure string
 * transform — no re-upload needed, and it's a no-op for any non-Cloudinary URL
 * (e.g. the Unsplash fallback image used when a product has no photos).
 *
 * @param url    Original image URL (may be undefined/null)
 * @param width  Optional max width in px. Cloudinary will downscale larger
 *               originals and never upscale (c_limit).
 */
export function optimizeImageUrl(
  url?: string | null,
  width?: number
): string | undefined {
  if (!url) return url ?? undefined;

  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || idx === -1) {
    // Not a Cloudinary-hosted image (e.g. fallback placeholder) — return as-is.
    return url;
  }

  const before = url.slice(0, idx + marker.length);
  let rest = url.slice(idx + marker.length);

  // If a transformation segment is already present (e.g. "c_fill,w_400/"),
  // strip it so we don't stack duplicate/conflicting params on top of it.
  const alreadyTransformed = /^[a-z]_[^/]+\//i.test(rest);
  if (alreadyTransformed) {
    rest = rest.slice(rest.indexOf("/") + 1);
  }

  const params = ["f_auto", "q_auto"];
  if (width) params.push(`w_${width}`, "c_limit");

  return `${before}${params.join(",")}/${rest}`;
}

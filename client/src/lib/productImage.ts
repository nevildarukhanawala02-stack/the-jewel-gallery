/**
 * Returns the best image URL to show on a product card (category grid, bestsellers, etc.).
 * Rules:
 *  - If imageTypes classification is available, return the first image classified as 'product'
 *  - Fall back to images[0] if no classification or no 'product' type found
 *  - Returns undefined if no images at all
 */
export function getCardImage(
  images?: string[] | null,
  imageTypes?: Array<'product' | 'model' | 'lifestyle'> | null
): string | undefined {
  if (!Array.isArray(images) || images.length === 0) return undefined;

  // If we have classification data, find the first 'product' image
  if (Array.isArray(imageTypes) && imageTypes.length > 0) {
    const productIdx = imageTypes.findIndex((t) => t === 'product');
    if (productIdx !== -1 && images[productIdx]) {
      return images[productIdx];
    }
  }

  // Fallback: use first image
  return images[0];
}

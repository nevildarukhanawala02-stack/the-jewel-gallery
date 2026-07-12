import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { optimizeImageUrl } from "@/lib/cloudinaryImage";

interface ProductCardProps {
  id: number;
  slug: string;
  name: string;
  collection?: string;
  price: number;
  comparePrice?: number;
  image?: string;
  badge?: string;
  material?: string;
}

export default function ProductCard({
  id,
  slug,
  name,
  collection,
  price,
  comparePrice,
  image,
  badge,
  material,
}: ProductCardProps) {
  const [, navigate] = useLocation();
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ id, slug, name, collection, price, image });
    toast.success(`${name} added to your bag`, {
      description: "Continue exploring or proceed to checkout.",
      duration: 3000,
    });
  };

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);

  const formattedCompare = comparePrice
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(comparePrice)
    : null;

  return (
    <div className="product-card" onClick={() => navigate(`/product/${slug}`)}>
      <div className="product-card-img">
        {image ? (
          <img src={optimizeImageUrl(image, 600)} alt={name} loading="lazy" />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, var(--linen) 0%, var(--ivory-deep) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--gold)",
            fontSize: "32px",
          }}>
            ◆
          </div>
        )}
        {badge && <span className="product-card-badge">{badge}</span>}
      </div>
      <div className="product-card-info">
        {collection && <div className="product-card-collection">{collection}</div>}
        <div className="product-card-name">{name}</div>
        {material && (
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px", letterSpacing: "0.5px" }}>
            {material}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div className="product-card-price">{formattedPrice}</div>
          {formattedCompare && (
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "line-through" }}>
              {formattedCompare}
            </div>
          )}
        </div>
        <button className="product-card-btn" onClick={handleAddToCart}>
          Add to Bag
        </button>
      </div>
    </div>
  );
}

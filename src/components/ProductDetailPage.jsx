import React, { useRef, useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, ChevronLeft, ChevronRight, Image as ImageIcon, Zap } from "lucide-react";
import { useCart } from "../context/CartContext";
import { flyToCart } from "../utils/flyToCart";

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

// Map tên màu phổ biến tiếng Việt → hex để hiển thị swatch
const COLOR_MAP = {
  đen: "#1a1a1a", den: "#1a1a1a", black: "#1a1a1a",
  trắng: "#f5f5f5", trang: "#f5f5f5", white: "#f5f5f5",
  xám: "#6b7280", xam: "#6b7280", gray: "#6b7280", grey: "#6b7280",
  đỏ: "#ef4444", do: "#ef4444", red: "#ef4444",
  xanh: "#3b82f6", blue: "#3b82f6",
  "xanh lá": "#22c55e", "xanh la": "#22c55e", green: "#22c55e",
  "xanh navy": "#1e3a5f", navy: "#1e3a5f",
  vàng: "#eab308", vang: "#eab308", yellow: "#eab308",
  nâu: "#92400e", nau: "#92400e", brown: "#92400e",
  "kem": "#fef3c7", beige: "#f5f0dc",
  hồng: "#ec4899", hong: "#ec4899", pink: "#ec4899",
  tím: "#8b5cf6", tim: "#8b5cf6", purple: "#8b5cf6",
  cam: "#f97316", orange: "#f97316",
  "mặc định": "#64748b", "mac dinh": "#64748b", default: "#64748b",
};

function colorNameToHex(name) {
  if (!name) return "#64748b";
  const key = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  // Thử khớp trực tiếp với key đã normalize
  const directMatch = Object.entries(COLOR_MAP).find(([k]) =>
    k.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === key
  );
  if (directMatch) return directMatch[1];
  // Thử khớp tên gốc
  const raw = name.toLowerCase().trim();
  if (COLOR_MAP[raw]) return COLOR_MAP[raw];
  // Fallback: nếu là mã hex hợp lệ thì dùng luôn
  if (/^#[0-9a-f]{3,6}$/i.test(name)) return name;
  return "#64748b";
}

export const ProductDetailPage = ({ product, onGoBack, onOpenCheckout }) => {
  const { addToCart } = useCart();
  const variants = product?.variants || [];
  const galleryRef = useRef(null);
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [selectedSize, setSelectedSize] = useState(variants[0]?.size || "");
  const [selectedColor, setSelectedColor] = useState(variants[0]?.color || "");
  const [activeImage, setActiveImage] = useState(0);

  const availableSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));

  // Màu có sẵn theo size đang chọn
  const availableColors = Array.from(
    new Set(variants.filter(v => v.size === selectedSize).map(v => v.color).filter(Boolean))
  );
  const galleryImages = Array.from(new Set(
    [product?.imgUrl, ...(product?.images || []), ...variants.map(v => v.imgUrl)]
      .filter(src => src && typeof src === "string" && !src.startsWith("blob:"))
  ));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product]);

  if (!product) return null;

  const variantMeta = selectedVariant ? {
    price: selectedVariant.price ?? product.price,
    productName: product.name,
    size: selectedVariant.size,
    color: selectedVariant.color,
    imgUrl: galleryImages[0] || product.imgUrl || "",
  } : null;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    const sourceImage = galleryRef.current?.querySelectorAll("img")[activeImage]
      || galleryRef.current?.querySelector("img");
    flyToCart(sourceImage, galleryImages[activeImage] || product.imgUrl);
    try {
      await addToCart(selectedVariant.id, 1, variantMeta);
    } catch {
      alert("Không thể thêm vào giỏ hàng!");
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    onOpenCheckout(selectedVariant, variantMeta);
  };

  const currentStock = selectedVariant?.stock ?? 10;
  const scrollToImage = (index) => {
    const track = galleryRef.current;
    if (!track) return;
    const nextIndex = (index + galleryImages.length) % galleryImages.length;
    track.scrollTo({ left: nextIndex * track.clientWidth, behavior: "smooth" });
    setActiveImage(nextIndex);
  };

  const handleGalleryScroll = (event) => {
    const track = event.currentTarget;
    setActiveImage(Math.round(track.scrollLeft / track.clientWidth));
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    // Màu đầu tiên có sẵn theo size mới
    const colorsForSize = Array.from(
      new Set(variants.filter(v => v.size === size).map(v => v.color).filter(Boolean))
    );
    const newColor = colorsForSize.includes(selectedColor) ? selectedColor : (colorsForSize[0] || "");
    setSelectedColor(newColor);
    const match = variants.find(v => v.size === size && v.color === newColor) || variants.find(v => v.size === size);
    if (match) setSelectedVariant(match);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const match = variants.find(v => v.size === selectedSize && v.color === color);
    if (match) setSelectedVariant(match);
  };

  return (
    <div className="product-detail-page min-h-screen bg-[var(--bg-primary)] py-8 animate-fade-in">
      <div className="product-detail-shell container mx-auto px-4 space-y-12">
        
        <div className="product-detail-toolbar flex items-center justify-between border-b border-[var(--border-light)] pb-4">
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-extrabold text-sm bg-slate-900 border border-slate-800 px-4 py-2 rounded-full transition-all shadow-md group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>&larr; Quay Lại Danh Sách Sản Phẩm</span>
          </button>

        </div>

        <div className="product-detail-layout grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="product-detail-gallery lg:col-span-6 space-y-4">
            <div className="product-image-frame">
              <div className="product-image-track" ref={galleryRef} onScroll={handleGalleryScroll}>
                {galleryImages.length > 0 ? galleryImages.map((image, index) => (
                  <img key={image} src={image} alt={`${product.name} - ảnh ${index + 1}`} />
                )) : (
                  <div className="flex min-w-full min-h-[360px] flex-col items-center justify-center gap-2 text-slate-500">
                    <ImageIcon size={32} aria-hidden="true" />
                    <span className="text-sm">Chưa có ảnh sản phẩm</span>
                  </div>
                )}
              </div>
              {galleryImages.length > 1 && (
                <>
                  <button className="product-image-arrow product-image-arrow--previous" onClick={() => scrollToImage(activeImage - 1)} aria-label="Ảnh trước">
                    <ChevronLeft size={20} />
                  </button>
                  <button className="product-image-arrow product-image-arrow--next" onClick={() => scrollToImage(activeImage + 1)} aria-label="Ảnh tiếp theo">
                    <ChevronRight size={20} />
                  </button>
                  <span className="product-image-count">{activeImage + 1} / {galleryImages.length}</span>
                </>
              )}
            </div>
          </div>

          <div className="product-detail-purchase lg:col-span-6 space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <h1 className="product-detail-title text-2xl md:text-3xl font-black leading-tight">
                {product.name.replace(/\s+HUGAN\b/gi, "")}
              </h1>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              {availableSizes.length > 0 && (
                <div className="product-size-control">
                  <label className="product-size-label">Kích cỡ</label>
                  <div className="flex flex-wrap gap-2.5">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`product-size-button px-5 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${
                          selectedSize === size
                            ? "is-selected"
                              : ""
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="product-color-control">
                  <label className="product-color-label">
                    Màu sắc
                    {selectedColor && (
                      <span className="product-color-selected-name">{selectedColor}</span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`product-color-button ${selectedColor === color ? "is-selected" : ""}`}
                        title={color}
                        aria-label={`Màu ${color}`}
                        aria-pressed={selectedColor === color}
                      >
                        <span
                          className="product-color-swatch"
                          style={{ background: colorNameToHex(color) }}
                        />
                        <span className="product-color-name">{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông tin variant đang chọn */}
              {selectedVariant && (
                <div className="product-variant-info">
                  <span className="product-detail-price">{formatCurrency(selectedVariant.price ?? product.price)}</span>
                </div>
              )}
            </div>

            <div className="product-actions space-y-3 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={currentStock <= 0 || !selectedVariant}
                  className="product-action-button product-action-button--buy"
                >
                  <Zap size={18} />
                  <span>Đặt hàng</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0 || !selectedVariant}
                  className="product-action-button product-action-button--cart"
                >
                  <ShoppingBag size={18} />
                  <span>Thêm vào giỏ hàng</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

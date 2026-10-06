import React, { useRef, useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, ChevronLeft, ChevronRight, Image as ImageIcon, Zap, Printer, X } from "lucide-react";
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
  const [isPrintOrderOpen, setIsPrintOrderOpen] = useState(false);
  const [printSelections, setPrintSelections] = useState({});
  const availableSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
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

  const selectedPrintItems = variants
    .map((variant) => ({
      ...variant,
      quantity: Number(printSelections[variant.id]?.quantity || 0),
      printType: printSelections[variant.id]?.printType || "DECAL",
      note: printSelections[variant.id]?.note || "",
    }))
    .filter((variant) => variant.quantity > 0);
  const printOrderTotal = selectedPrintItems.reduce((total, item) => {
    const garmentPrice = item.price ?? product.price;
    const printPrice = item.printType === "PU" ? 100000 : 50000;
    return total + (garmentPrice + printPrice) * item.quantity;
  }, 0);

  const updatePrintSelection = (variant, changes) => {
    const current = printSelections[variant.id] || { quantity: 0, printType: "DECAL", note: "" };
    const maxStock = Math.max(0, Number(variant.stock ?? 10));
    const quantity = changes.quantity === undefined
      ? current.quantity
      : Math.min(maxStock, Math.max(0, Math.floor(Number(changes.quantity) || 0)));
    setPrintSelections((selections) => ({
      ...selections,
      [variant.id]: { ...current, ...changes, quantity },
    }));
  };

  const handlePrintCheckout = () => {
    if (!selectedPrintItems.length) return;
    onOpenCheckout(selectedPrintItems.map((variant) => {
      const price = variant.price ?? product.price;
      const printPrice = variant.printType === "PU" ? 100000 : 50000;
      return {
        id: `direct-print-${variant.id}`,
        variantId: variant.id,
        quantity: variant.quantity,
        price,
        printingPrice: printPrice,
        printType: variant.printType,
        note: variant.note.trim(),
        subtotal: (price + printPrice) * variant.quantity,
        productName: product.name,
        size: variant.size,
        color: variant.color,
        imgUrl: variant.imgUrl || galleryImages[0] || product.imgUrl || "",
        stock: variant.stock ?? 10,
      };
    }));
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
                          selectedSize === size ? "is-selected" : ""
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

              {selectedVariant && (
                <div className="product-variant-info">
                  <span className="product-detail-price">{formatCurrency(selectedVariant.price ?? product.price)}</span>
                </div>
              )}
            </div>

            <div className="product-actions space-y-3 pt-4 border-t border-slate-200">
              <div className="product-action-grid">
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
                <button
                  onClick={() => setIsPrintOrderOpen(true)}
                  disabled={!variants.length}
                  className="product-action-button product-action-button--print"
                >
                  <Printer size={18} />
                  <span>Đặt in riêng</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {isPrintOrderOpen && (
        <div
          className="print-order-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-order-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsPrintOrderOpen(false);
          }}
        >
          <section className="print-order-panel">
            <header className="print-order-header">
              <div>
                <span className="print-order-eyebrow">Tùy chỉnh sản phẩm</span>
                <h2 id="print-order-title">Đặt in riêng</h2>
                <p>Chọn một hoặc nhiều size/màu, số lượng và kiểu in cho từng loại.</p>
              </div>
              <button
                type="button"
                className="print-order-close"
                onClick={() => setIsPrintOrderOpen(false)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </header>

            <div className="print-order-list">
              {variants.map((variant) => {
                const selection = printSelections[variant.id] || { quantity: 0, printType: "DECAL", note: "" };
                const quantity = Number(selection.quantity || 0);
                const stock = Math.max(0, Number(variant.stock ?? 10));
                const printPrice = selection.printType === "PU" ? 100000 : 50000;
                return (
                  <article className={`print-order-variant${quantity ? " is-selected" : ""}`} key={variant.id}>
                    <div className="print-order-variant-heading">
                      <span
                        className="product-color-swatch"
                        style={{ background: colorNameToHex(variant.color) }}
                        aria-hidden="true"
                      />
                      <div className="print-order-variant-title">
                        <strong>Size {variant.size || "—"} · {variant.color || "Chưa chọn màu"}</strong>
                        <span>{formatCurrency(variant.price ?? product.price)} / áo · Còn {stock}</span>
                      </div>
                      <label className="print-order-quantity">
                        <span>SL</span>
                        <input
                          type="number"
                          min="0"
                          max={stock}
                          step="1"
                          value={quantity}
                          onChange={(event) => updatePrintSelection(variant, { quantity: event.target.value })}
                          aria-label={`Số lượng size ${variant.size}, màu ${variant.color}`}
                        />
                      </label>
                    </div>
                    {quantity > 0 && (
                      <div className="print-order-options">
                        <label className="print-order-field">
                          <span>Loại in</span>
                          <select
                            value={selection.printType || "DECAL"}
                            onChange={(event) => updatePrintSelection(variant, { printType: event.target.value })}
                          >
                            <option value="DECAL">In Decal — 50.000đ / sản phẩm</option>
                            <option value="PU">In PU — 100.000đ / sản phẩm</option>
                          </select>
                        </label>
                        <label className="print-order-field">
                          <span>Ghi chú cho loại này</span>
                          <textarea
                            value={selection.note || ""}
                            maxLength={2000}
                            rows="2"
                            placeholder="Nội dung in, vị trí in hoặc yêu cầu khác..."
                            onChange={(event) => updatePrintSelection(variant, { note: event.target.value })}
                          />
                        </label>
                        <p className="print-order-line-total">
                          Thành tiền dòng này: {formatCurrency(((variant.price ?? product.price) + printPrice) * quantity)}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <footer className="print-order-footer">
              <div>
                <span>Tổng thanh toán</span>
                <strong>{formatCurrency(printOrderTotal)}</strong>
                <small>Đã gồm giá áo và phí in cho từng sản phẩm.</small>
              </div>
              <button
                type="button"
                className="print-order-confirm"
                onClick={handlePrintCheckout}
                disabled={!selectedPrintItems.length}
              >
                Tiếp tục đặt in
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

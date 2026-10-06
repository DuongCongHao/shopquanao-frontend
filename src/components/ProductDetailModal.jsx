import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Check, Image as ImageIcon, Shield, Truck, RefreshCw, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";

export const ProductDetailModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const variants = product?.variants || [];
  
  // Default variant selection logic
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [selectedSize, setSelectedSize] = useState(variants[0]?.size || "");
  const [selectedColor, setSelectedColor] = useState(variants[0]?.color || "");
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Extract unique sizes and colors
  const availableSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
  const availableColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));

  // Update selected variant when size or color changes
  useEffect(() => {
    if (!variants.length) return;
    const match = variants.find(v => 
      (selectedSize ? v.size === selectedSize : true) &&
      (selectedColor ? v.color === selectedColor : true)
    );
    if (match) {
      setSelectedVariant(match);
    } else {
      // Fallback match size
      const sizeMatch = variants.find(v => v.size === selectedSize);
      if (sizeMatch) {
        setSelectedVariant(sizeMatch);
        setSelectedColor(sizeMatch.color);
      }
    }
  }, [selectedSize, selectedColor, variants]);

  if (!product) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    try {
      await addToCart(selectedVariant.id, quantity, {
        price: selectedVariant.price ?? product.price,
        productName: product.name,
        size: selectedVariant.size,
        color: selectedVariant.color,
        imgUrl: selectedVariant.imgUrl || product.imgUrl || product.images?.[0] || "",
      });
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
    } catch (e) {
      alert("Không thể thêm vào giỏ hàng!");
    }
  };

  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.stock ?? 10;
  const currentImg = selectedVariant?.imgUrl || product.imgUrl || product.images?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-3xl overflow-hidden shadow-2xl animate-scale-up my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* Left Column: Image Preview */}
          <div className="md:col-span-6 bg-slate-950 p-6 flex flex-col items-center justify-center relative min-h-[350px]">
            {currentImg ? (
              <img 
                src={currentImg} 
                alt={product.name}
                className="w-full max-h-[450px] object-cover object-center rounded-2xl shadow-xl"
              />
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-slate-500">
                <ImageIcon size={32} aria-hidden="true" />
                <span className="text-sm">Chưa có ảnh sản phẩm</span>
              </div>
            )}
            {/* Category Pill */}
            <span className="absolute top-6 left-6 badge-category">
              {product.categoryNames?.join(", ") || product.categoryName || "Thời Trang"}
            </span>
          </div>

          {/* Right Column: Details & Controls */}
          <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white leading-snug">
                {product.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Mã SKU: <span className="text-amber-400 font-semibold">{selectedVariant?.sku || `SKU-${product.id}`}</span>
              </p>

              {/* Price Display */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-amber-400">
                  {formatCurrency(currentPrice)}
                </span>
                {currentStock <= 0 && (
                  <span className="badge-stock out-of-stock">
                    Hết hàng
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm mt-4 leading-relaxed font-normal">
                {product.description || "Sản phẩm thời trang thiết kế độc quyền từ MetroFootBall Store. Vải mềm mại, co giãn tốt và chuẩn form dáng."}
              </p>
            </div>

            {/* Variant Selectors */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              {/* Size Selector */}
              {availableSizes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Kích Thước (Size)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all ${
                          selectedSize === size
                            ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                            : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {availableColors.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Màu Sắc (Color)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                          selectedColor === color
                            ? "bg-slate-700 text-amber-400 border-amber-400 shadow-md"
                            : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {selectedColor === color && <Check size={14} />}
                        <span>{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Số Lượng
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3.5 py-2 text-slate-300 hover:text-white font-bold text-base hover:bg-slate-800"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-white font-bold text-sm min-w-[40px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="px-3.5 py-2 text-slate-300 hover:text-white font-bold text-base hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    (Tổng: <strong className="text-amber-400">{formatCurrency(currentPrice * quantity)}</strong>)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="w-full btn-primary py-3.5 text-base font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={20} />
                <span>{currentStock > 0 ? "Thêm Vào Giỏ Hàng" : "Hết Hàng Rỗi"}</span>
              </button>

              {/* Feedback Toast Banner */}
              {addedToast && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 animate-fade-in">
                  <Check size={16} />
                  <span>Đã thêm sản phẩm vào giỏ hàng thành công!</span>
                </div>
              )}

              {/* Policy Badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Truck size={14} className="text-amber-400" />
                  <span>Giao hàng toàn quốc</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-amber-400" />
                  <span>Đổi trả trong 30 ngày</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

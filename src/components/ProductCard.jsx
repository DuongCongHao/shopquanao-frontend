import React, { useRef } from "react";
import { Image as ImageIcon, ShoppingCart, Layers } from "lucide-react";
import { useCart } from "../context/CartContext";
import { flyToCart } from "../utils/flyToCart";

export const ProductCard = ({ product, onSelectProduct, rank }) => {
  const { addToCart } = useCart();
  const imageRef = useRef(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    const defaultVariant = product.variants?.[0];
    if (defaultVariant) {
      flyToCart(imageRef.current, product.imgUrl);
      const variantMeta = {
        price: defaultVariant.price ?? product.price,
        productName: product.name,
        size: defaultVariant.size,
        color: defaultVariant.color,
        imgUrl: product.imgUrl || "",
      };
      addToCart(defaultVariant.id, 1, variantMeta);
    } else {
      onSelectProduct(product);
    }
  };

  const variantCount = product.variants?.length || 0;

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="catalog-product-card group relative flex flex-col cursor-pointer"
      style={{ minWidth: 0 }}
    >
      {/* Compact Product Image */}
      <div className="catalog-product-image relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        {product.imgUrl || product.images?.[0] ? (
          <img
            ref={imageRef}
            src={product.imgUrl || product.images[0]}
            alt={product.name}
            loading="lazy"
            className="catalog-product-card__image w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <ImageIcon size={28} aria-hidden="true" />
            <span className="text-xs">Chưa có ảnh sản phẩm</span>
          </div>
        )}
        {/* Category Badge */}
        <span className="catalog-product-category absolute top-1.5 left-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
          {product.categoryName || "Thời Trang"}
        </span>
        {rank && <span className="catalog-rank">#{String(rank).padStart(2, "0")}</span>}
        {/* Variant Badge */}
        {variantCount > 0 && (
          <span className="catalog-product-variant-count absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <Layers size={9} />
            <span>{variantCount}</span>
          </span>
        )}
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
          <span className="catalog-product-view-label text-[10px] font-extrabold px-3 py-1 rounded-full tracking-wider">
            XEM CHI TIẾT
          </span>
        </div>
      </div>

      {/* Product Info Body */}
      <div className="catalog-product-info p-2.5 flex flex-col gap-1.5">
        <h3 className="catalog-product-name font-bold text-[12px] leading-tight line-clamp-1 transition-colors">
          {product.name.replace(/\s+HUGAN\b/gi, "")}
        </h3>
        <div className="flex items-center justify-between gap-1">
          <span className="catalog-product-price font-black text-[13px] tracking-tight">
            {formatCurrency(product.price)}
          </span>
        </div>
        {/* Prominent Cart Button */}
        <button
          onClick={handleQuickAdd}
          className="catalog-add-button w-full mt-0.5 flex items-center justify-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-lg transition-all active:scale-95"
        >
          <ShoppingCart size={13} strokeWidth={2.5} />
          <span>Thêm Giỏ Hàng</span>
        </button>
      </div>
    </div>
  );
};

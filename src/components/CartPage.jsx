import React from "react";
import { ArrowLeft, Trash2, ArrowRight, Minus, Plus, PackageSearch, Image as ImageIcon } from "lucide-react";
import { useCart } from "../context/CartContext";

const colorSwatches = {
  den: "#202020",
  trang: "#f7f5ee",
  xam: "#8b9298",
  do: "#d34c46",
  xanh: "#4677c8",
  "xanh la": "#4b9a69",
  vang: "#dfb83e",
  nau: "#8e654c",
  hong: "#d77d9c",
  tim: "#8b70bd",
  black: "#202020",
  white: "#f7f5ee",
  gray: "#8b9298",
  grey: "#8b9298",
  red: "#d34c46",
  blue: "#4677c8",
  green: "#4b9a69",
  yellow: "#dfb83e",
};

function getColorSwatch(color) {
  if (!color) return "#77766f";
  if (/^#[\da-f]{3,8}$/i.test(color)) return color;
  const normalized = color.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return colorSwatches[normalized] || "#77766f";
}

export const CartPage = ({ onGoBack, onGoHome, onGoOrder }) => {
  const { cart, loading, updateQuantity, removeFromCart } = useCart();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="cart-page animate-fade-in">
      <div className="cart-shell">
        <div className="cart-page-heading">
          <button
            onClick={onGoBack}
            className="cart-back-button"
            aria-label="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="cart-title-group">
            <span className="cart-kicker">MetroFootBall Store / ĐƠN HÀNG</span>
            <h1>Giỏ hàng</h1>
          </div>
          <span className="cart-item-count">{cart.totalItems} món</span>
        </div>

        {cart.items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-mark"><PackageSearch size={30} /></div>
            <span className="cart-kicker">CHƯA CÓ SẢN PHẨM</span>
            <h2>Giỏ hàng đang trống</h2>
            <p>Chọn một món bạn thích, chúng mình sẽ giữ lại tại đây.</p>
            <button onClick={onGoHome} className="cart-order-button cart-empty-button">
              <span>Tiếp tục mua sắm</span>
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-list" aria-label="Sản phẩm trong giỏ hàng">
              <div className="cart-list-heading">
                <span>Mỗi món được đặt hàng riêng</span>
              </div>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <article key={item.id} className="cart-item">
                    <div className="cart-image-frame">
                      {item.imgUrl ? (
                        <img src={item.imgUrl} alt={item.productName} className="cart-item-image" />
                      ) : (
                        <div className="cart-image-placeholder" aria-label="Chưa có ảnh sản phẩm">
                          <ImageIcon size={23} />
                        </div>
                      )}
                    </div>

                    <div className="cart-item-content">
                      <div className="cart-item-heading">
                        <h2>{item.productName.replace(/\s+HUGAN\b/gi, "")}</h2>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="cart-remove-button"
                          title="Bỏ sản phẩm khỏi giỏ"
                          aria-label={`Bỏ ${item.productName} khỏi giỏ`}
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="cart-item-unit-price">
                        Đơn giá <strong>{formatCurrency(item.price)}</strong>
                      </p>
                      <div className="cart-item-variants">
                        {item.size && <span className="cart-variant-pill">Size {item.size}</span>}
                        <span className="cart-variant-pill cart-color-pill">
                          <i style={{ "--cart-swatch": getColorSwatch(item.color) }} aria-hidden="true" />
                          {item.color || "Chưa chọn màu"}
                        </span>
                      </div>

                    </div>

                    <div className="cart-item-checkout">
                      <div className="cart-item-controls">
                        <div className="cart-quantity" aria-label={`Số lượng ${item.productName}`}>
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            aria-label={`Giảm số lượng ${item.productName}`}
                            disabled={loading || item.quantity <= 1}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Tăng số lượng ${item.productName}`}
                            disabled={loading}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <strong className="cart-item-total">
                        {formatCurrency(item.subtotal || item.price * item.quantity)}
                      </strong>
                      <button
                        type="button"
                        className="cart-item-checkout-button"
                        onClick={() => onGoOrder(item.variantId)}
                        disabled={loading}
                      >
                        <span>Đặt món này</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <button onClick={onGoHome} className="cart-continue-link">
                <ArrowLeft size={15} /> Tiếp tục mua sắm
              </button>
            </section>

          </div>
        )}
      </div>
    </div>
  );
};

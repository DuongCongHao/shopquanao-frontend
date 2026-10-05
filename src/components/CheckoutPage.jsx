import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, CheckCircle2, Mail, MapPin, Phone,
  ShoppingBag, User, AlertCircle, Edit2, Check, Minus, Plus, Image as ImageIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../api/api";
import "../checkout.css";

const COUNTDOWN = 10;
const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const CheckoutItemImage = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  return (
    <div className="checkout-order-item-image">
      {src && !hasError ? (
        <img src={src} alt={alt} onError={() => setHasError(true)} />
      ) : (
        <ImageIcon size={20} aria-label="Sản phẩm chưa có ảnh" />
      )}
    </div>
  );
};

/* ─── Confirm Popup ────────────────────────────────────────────────────────── */
const ConfirmPopup = ({ formData, cart, onEdit, onConfirm }) => {
  const [seconds, setSeconds] = useState(COUNTDOWN);
  const decidedRef = useRef(false);

  useEffect(() => {
    const timerId = setInterval(() => {
      setSeconds((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (seconds !== 0 || decidedRef.current) return;
    decidedRef.current = true;
    onConfirm();
  }, [seconds, onConfirm]);

  const finish = (action) => {
    if (decidedRef.current) return;
    decidedRef.current = true;
    action();
  };

  const progress = ((COUNTDOWN - seconds) / COUNTDOWN) * 100;

  return (
    <div className="co-popup-backdrop" role="dialog" aria-modal="true" aria-labelledby="co-confirm-title">
      <div className="co-popup animate-scale-up">
        <div className="co-popup-header">
          <div className="co-popup-title-wrap">
            <AlertCircle size={20} className="co-popup-alert-icon" />
            <h2 id="co-confirm-title" className="co-popup-title">Xác nhận đặt hàng</h2>
          </div>

          <div className="co-countdown-wrap" title={`Tự động đặt hàng sau ${seconds}s`}>
            <svg width="56" height="56" viewBox="0 0 56 56" className="co-countdown-svg" aria-hidden="true">
              <circle cx="28" cy="28" r={RING_RADIUS} className="co-countdown-track" />
              <circle
                cx="28"
                cy="28"
                r={RING_RADIUS}
                className="co-countdown-ring"
                style={{
                  strokeDasharray: RING_CIRCUMFERENCE,
                  strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress / 100),
                }}
              />
            </svg>
            <span className="co-countdown-number">{seconds}</span>
          </div>
        </div>

        <p className="co-popup-subtitle">
          Kiểm tra lại thông tin trước khi đặt. Đơn sẽ tự động xác nhận sau{" "}
          <strong>{seconds}s</strong>.
        </p>

        <div className="co-popup-body">
          <section className="co-popup-section">
            <h3 className="co-popup-section-title">Thông tin người mua</h3>
            <dl className="co-popup-customer">
              <div><dt>Họ tên</dt><dd>{formData.fullName}</dd></div>
              <div><dt>Địa chỉ</dt><dd>{formData.address}</dd></div>
              <div><dt>Số điện thoại</dt><dd>{formData.phone}</dd></div>
              <div><dt>Email</dt><dd>{formData.email}</dd></div>
            </dl>
          </section>

          <section className="co-popup-section">
            <h3 className="co-popup-section-title">Đơn hàng ({cart.totalItems} món)</h3>
            <div className="co-popup-items">
              {cart.items.map((item) => (
                <article key={item.id || item.variantId} className="co-popup-item">
                  <CheckoutItemImage
                    src={item.imgUrl}
                    alt={item.productName || item.name}
                  />
                  <div className="co-popup-item-info">
                    <p className="co-popup-item-name">
                      {(item.productName || item.name || "").replace(/\s+HUGAN\b/gi, "")}
                    </p>
                    <p className="co-popup-item-meta">
                      Size {item.size} · {item.color} · SL {item.quantity}
                    </p>
                  </div>
                  <strong className="co-popup-item-price">
                    {formatCurrency(item.subtotal || item.price * item.quantity)}
                  </strong>
                </article>
              ))}
            </div>
            <div className="co-popup-total">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(cart.totalPrice)}</strong>
            </div>
          </section>
        </div>

        <div className="co-popup-actions">
          <button type="button" className="co-popup-edit-btn" onClick={() => finish(onEdit)}>
            <Edit2 size={16} />
            <span>Chỉnh sửa</span>
          </button>
          <button type="button" className="co-popup-confirm-btn" onClick={() => finish(onConfirm)}>
            <Check size={16} />
            <span>Xác nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Checkout Page ────────────────────────────────────────────────────────── */
export const CheckoutPage = ({ onGoBack, checkoutVariantId, directCheckoutItem = null }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const [directQuantity, setDirectQuantity] = useState(
    directCheckoutItem?.quantity || 1
  );
  const checkoutItem = directCheckoutItem
    ? {
        ...directCheckoutItem,
        quantity: directQuantity,
        subtotal: directCheckoutItem.price * directQuantity,
      }
    : cart.items.find(
    (item) => String(item.variantId) === String(checkoutVariantId)
  ) || (checkoutVariantId == null && cart.items.length === 1 ? cart.items[0] : null);
  const checkoutCart = checkoutItem
    ? {
        items: [checkoutItem],
        totalItems: checkoutItem.quantity,
        totalPrice: checkoutItem.subtotal || checkoutItem.price * checkoutItem.quantity,
      }
    : { items: [], totalItems: 0, totalPrice: 0 };
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    address: "",
    phone: "",
    email: user?.email || "",
  });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const placingRef = useRef(false);

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ tên.";
    if (!formData.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ.";
    if (!formData.phone.trim()) nextErrors.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^[0-9]{9,11}$/.test(formData.phone.replace(/\s/g, ""))) {
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    }
    if (!formData.email.trim()) nextErrors.email = "Vui lòng nhập email.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nextErrors.email = "Email không hợp lệ.";
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };

  // Step 1: validate and show confirm popup
  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !checkoutCart.items.length) return;
    setShowConfirm(true);
  };

  const placeOrder = useCallback(async () => {
    if (placingRef.current) return;
    placingRef.current = true;
    setShowConfirm(false);
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const createdOrder = await orderApi.create({
        customerName: formData.fullName,
        customerAddress: formData.address,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        items: checkoutCart.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });
      setOrder(createdOrder);
      if (!directCheckoutItem) await removeFromCart(checkoutItem.id);
    } catch (error) {
      placingRef.current = false;
      setSubmitError(error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, checkoutCart.items, checkoutItem, directCheckoutItem, removeFromCart]);

  const renderOrderItems = (items, editable = false) => (
    <div className="checkout-order-items">
      {items.map((item) => (
        <article key={item.id} className="checkout-order-item">
          <CheckoutItemImage src={item.imgUrl} alt={item.productName} />
          <div className="checkout-order-item-info">
            <h3>{item.productName.replace(/\s+HUGAN\b/gi, "")}</h3>
            <p>Size {item.size} · {item.color}</p>
            {editable ? (
              <div className="checkout-qty-control">
                <button
                  type="button"
                  className="checkout-qty-btn"
                  onClick={() => {
                    const quantity = Math.max(1, item.quantity - 1);
                    if (directCheckoutItem) setDirectQuantity(quantity);
                    else updateQuantity(item.id, quantity);
                  }}
                  disabled={item.quantity <= 1}
                  aria-label="Giảm số lượng"
                >
                  <Minus size={12} />
                </button>
                <span className="checkout-qty-value">{item.quantity}</span>
                <button
                  type="button"
                  className="checkout-qty-btn"
                  onClick={() => {
                    const quantity = item.quantity + 1;
                    if (directCheckoutItem) setDirectQuantity(quantity);
                    else updateQuantity(item.id, quantity);
                  }}
                  disabled={
                    directCheckoutItem &&
                    Number.isFinite(Number(directCheckoutItem.stock)) &&
                    item.quantity >= Number(directCheckoutItem.stock)
                  }
                  aria-label="Tăng số lượng"
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <p className="checkout-qty-static">SL: {item.quantity}</p>
            )}
          </div>
          <strong>{formatCurrency(item.subtotal || item.price * item.quantity)}</strong>
        </article>
      ))}
    </div>
  );

  /* ── Success screen ── */
  if (order) {
    return (
      <main className="checkout-page checkout-success-page">
        <section className="checkout-success">
          <div className="checkout-success-icon"><CheckCircle2 size={32} /></div>
          <header className="checkout-success-heading">
            <h1>Đặt hàng thành công</h1>
            <p>Thông tin người nhận và đơn hàng của bạn</p>
          </header>

          <section className="checkout-confirmation-section">
            <h2>Người nhận</h2>
            <dl className="checkout-customer-details">
              <div><dt>Họ tên</dt><dd>{order.customerName}</dd></div>
              <div><dt>Địa chỉ</dt><dd>{order.customerAddress}</dd></div>
              <div><dt>Số điện thoại</dt><dd>{order.customerPhone}</dd></div>
              <div><dt>Email</dt><dd>{order.customerEmail}</dd></div>
            </dl>
          </section>

          <section className="checkout-confirmation-section">
            <h2>Đơn hàng riêng ({order.totalItems} món)</h2>
            {renderOrderItems(order.items)}
            <div className="checkout-order-total">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(order.totalPrice)}</strong>
            </div>
          </section>

          <button type="button" onClick={onGoBack} className="checkout-submit">
            Quay lại giỏ hàng
          </button>
        </section>
      </main>
    );
  }

  const fields = [
    { name: "fullName", label: "Họ tên", type: "text", icon: User, placeholder: "Nguyễn Văn An", autoComplete: "name" },
    { name: "address", label: "Địa chỉ", type: "text", icon: MapPin, placeholder: "Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành", autoComplete: "street-address" },
    { name: "phone", label: "Số điện thoại", type: "tel", icon: Phone, placeholder: "0901234567", autoComplete: "tel" },
    { name: "email", label: "Email", type: "email", icon: Mail, placeholder: "email@example.com", autoComplete: "email" },
  ];

  return (
    <>
      <main className="checkout-page animate-fade-in">
        <div className="checkout-shell">
          <header className="checkout-header">
            <button type="button" onClick={onGoBack} className="checkout-back">
              <ArrowLeft size={17} />
              <span>Giỏ hàng</span>
            </button>
            <h1>Đặt hàng</h1>
          </header>

          <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
            <section className="checkout-fields checkout-panel">
              <h2>Thông tin người nhận</h2>
              <div className="checkout-field-grid">
                {fields.map(({ name, label, type, icon: Icon, placeholder, autoComplete }) => (
                  <div className="checkout-field" key={name}>
                    <label htmlFor={name}>
                      <Icon size={15} />
                      <span>{label}</span>
                    </label>
                    <input
                      id={name}
                      name={name}
                      type={type}
                      placeholder={placeholder}
                      autoComplete={autoComplete}
                      value={formData[name]}
                      onChange={handleChange}
                      className={errors[name] ? "checkout-input checkout-input--error" : "checkout-input"}
                      aria-invalid={Boolean(errors[name])}
                    />
                    {errors[name] && (
                      <p className="checkout-error" role="alert">{errors[name]}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="checkout-order-panel checkout-panel">
              <h2><ShoppingBag size={18} />Đơn hàng riêng ({checkoutCart.totalItems} món)</h2>
              {checkoutCart.items.length
                ? renderOrderItems(checkoutCart.items, true)
                : <p className="checkout-empty-order">Không tìm thấy món đã chọn. Hãy quay lại giỏ hàng.</p>}
              <div className="checkout-order-total">
                <span>Tổng thanh toán</span>
                <strong>{formatCurrency(checkoutCart.totalPrice)}</strong>
              </div>
              {submitError && (
                <p className="checkout-error" role="alert">{submitError}</p>
              )}
              <button
                type="submit"
                className="checkout-submit"
                disabled={!checkoutCart.items.length || isSubmitting}
              >
                {isSubmitting ? "Đang gửi đơn..." : "Đặt hàng"}
              </button>
            </section>
          </form>
        </div>
      </main>

      {/* Confirm popup with countdown */}
      {showConfirm && (
        <ConfirmPopup
          formData={formData}
          cart={checkoutCart}
          onEdit={() => setShowConfirm(false)}
          onConfirm={placeOrder}
        />
      )}
    </>
  );
};
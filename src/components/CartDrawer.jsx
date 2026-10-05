import React from "react";
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus, Image as ImageIcon } from "lucide-react";
import { useCart } from "../context/CartContext";

export const CartDrawer = ({ onOpenCheckout }) => {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart } = useCart();

  if (!isCartOpen) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--bg-secondary)] border-l border-[var(--border-light)] shadow-2xl flex flex-col justify-between animate-fade-in">
          
          {/* Cart Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Giỏ Hàng Của Bạn</h2>
                <p className="text-xs text-slate-400">{cart.totalItems} sản phẩm đã chọn</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 text-slate-500 mx-auto flex items-center justify-center">
                  <ShoppingBag size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-300">Giỏ hàng đang trống</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Hãy dạo quanh cửa hàng và lựa chọn các sản phẩm thời trang yêu thích của bạn!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="btn-secondary text-xs px-6 py-2.5 mt-2"
                >
                  Tiếp Tục Mua Sắm
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center relative group"
                >
                  {item.imgUrl ? (
                    <img
                      src={item.imgUrl}
                      alt={item.productName}
                      className="w-20 h-24 object-cover object-center rounded-md bg-slate-950"
                    />
                  ) : (
                    <div className="w-20 h-24 flex items-center justify-center rounded-md bg-slate-950 text-slate-500" aria-label="Chưa có ảnh sản phẩm">
                      <ImageIcon size={22} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-white text-sm truncate">
                      {item.productName}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Size: <strong className="text-amber-400">{item.size}</strong></span>
                      <span>•</span>
                      <span>Màu: <strong className="text-amber-400">{item.color}</strong></span>
                    </div>

                    <p className="text-xs font-extrabold text-amber-400">
                      {formatCurrency(item.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-slate-400 hover:text-white"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-slate-400 hover:text-white"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Xóa khỏi giỏ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer Summary */}
          {cart.items.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tạm tính ({cart.totalItems} SP):</span>
                  <span className="text-slate-200 font-semibold">{formatCurrency(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-amber-400 text-xl">{formatCurrency(cart.totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onOpenCheckout();
                  }}
                  className="w-full btn-primary py-3.5 text-sm font-extrabold justify-center"
                >
                  <span>Thanh Toán Ngay</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={clearCart}
                  className="w-full text-xs text-slate-400 hover:text-rose-400 py-1 transition-colors text-center"
                >
                  Xóa tất cả sản phẩm
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

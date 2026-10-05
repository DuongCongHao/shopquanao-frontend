import React, { useState } from "react";
import { X, CheckCircle2, CreditCard, Truck, ShieldCheck, MapPin, Phone, User, Mail } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export const CheckoutModal = ({ onClose }) => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: "",
    email: user?.email || "",
    address: "",
    note: "",
    paymentMethod: "COD"
  });

  const [isSuccess, setIsSuccess] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }

    setIsSuccess(true);
    clearCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-3xl overflow-hidden shadow-2xl animate-scale-up my-8 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <div className="text-center py-10 space-y-6 animate-scale-up">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Đặt Hàng Thành Công!</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Cảm ơn bạn đã tin tưởng mua sắm tại <strong className="text-amber-400">MetroFootBall Store</strong>. Chúng tôi sẽ liên hệ sớm nhất để xác nhận đơn hàng.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1">
              <p className="text-slate-400">Khách hàng: <strong className="text-white">{formData.fullName}</strong></p>
              <p className="text-slate-400">Số điện thoại: <strong className="text-white">{formData.phone}</strong></p>
              <p className="text-slate-400">Địa chỉ: <strong className="text-white">{formData.address}</strong></p>
              <p className="text-slate-400">Thanh toán: <strong className="text-amber-400">{formData.paymentMethod}</strong></p>
            </div>
            <button
              onClick={onClose}
              className="btn-primary px-8 py-3 text-sm font-bold"
            >
              Hoàn Tất & Quay Về Cửa Hàng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Thanh Toán Đơn Hàng</h2>
                <p className="text-xs text-slate-400">Tổng tiền: <strong className="text-amber-400">{formatCurrency(cart.totalPrice)}</strong></p>
              </div>
            </div>

            {/* Customer Shipping Form */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Thông Tin Nhận Hàng</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Họ và tên người nhận *"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl py-3 pl-10 pr-4 focus:border-amber-400"
                  />
                </div>

                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Số điện thoại *"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl py-3 pl-10 pr-4 focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Địa chỉ giao hàng chi tiết (Số nhà, Tên đường, Xã/Phường, Quận/Huyện) *"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl py-3 pl-10 pr-4 focus:border-amber-400"
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Phương Thức Thanh Toán</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "COD", label: "Thanh toán COD", desc: "Nhận hàng kiểm tra thanh toán" },
                  { id: "BANK", label: "Chuyển khoản QR", desc: "Quét mã VietQR tiện lợi" },
                  { id: "MOMO", label: "Ví MoMo", desc: "Thanh toán siêu tốc" }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: pm.id })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      formData.paymentMethod === pm.id
                        ? "bg-amber-500/20 border-amber-400 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <p className="font-bold text-amber-400">{pm.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{pm.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Tổng thanh toán</span>
                <span className="text-xl font-extrabold text-amber-400">{formatCurrency(cart.totalPrice)}</span>
              </div>
              
              <button
                type="submit"
                className="btn-primary px-8 py-3 text-sm font-extrabold"
              >
                Xác Nhận Đặt Hàng
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { X, Lock, Mail, User, Phone, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthModal = ({ onClose }) => {
  const { login, register, loading, error } = useAuth();
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: ""
  });

  const [localError, setLocalError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setRegSuccess(false);

    try {
      if (isRegisterTab) {
        if (!formData.fullName || !formData.email || !formData.password) {
          setLocalError("Vui lòng điền thông tin bắt buộc!");
          return;
        }
        await register(formData);
        setRegSuccess(true);
        setTimeout(() => {
          setIsRegisterTab(false);
          setRegSuccess(false);
        }, 1500);
      } else {
        if (!formData.email || !formData.password) {
          setLocalError("Vui lòng nhập Email và Mật khẩu!");
          return;
        }
        await login({ email: formData.email, password: formData.password });
        onClose();
      }
    } catch (err) {
      setLocalError(err.message || "Thao tác thất bại");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-3xl overflow-hidden shadow-2xl animate-scale-up p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X size={20} />
        </button>

        {/* Auth Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 mx-auto flex items-center justify-center text-black font-extrabold text-2xl shadow-[0_0_20px_rgba(234,179,8,0.5)]">
            H
          </div>
          <h2 className="text-2xl font-black text-white">HUGAN Store</h2>
          <p className="text-xs text-slate-400">Đăng nhập tài khoản để trải nghiệm dịch vụ tốt nhất</p>
        </div>

        {/* Tab Selector Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegisterTab(false); setLocalError(""); }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
              !isRegisterTab ? "bg-amber-500 text-black shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterTab(true); setLocalError(""); }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
              isRegisterTab ? "bg-amber-500 text-black shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Tạo Tài Khoản Mới
          </button>
        </div>

        {/* Error Alert Box */}
        {(localError || error) && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Success Registration Notice */}
        {regSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Đăng ký thành công! Đang chuyển sang trang Đăng nhập...</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterTab && (
            <>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Họ và tên đầy đủ *"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl py-3 pl-10 pr-4 focus:border-amber-400"
                />
              </div>

              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl py-3 pl-10 pr-4 focus:border-amber-400"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="email"
              placeholder="Địa chỉ Email *"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl py-3 pl-10 pr-4 focus:border-amber-400"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="password"
              placeholder="Mật khẩu *"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl py-3 pl-10 pr-4 focus:border-amber-400"
            />
          </div>

          {/* Quick Demo Info Box */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-amber-400 flex items-center gap-1">
              <Sparkles size={12} />
              <span>Tài khoản Demo thử nghiệm nhanh:</span>
            </p>
            <p>Admin: <strong className="text-white">admin@hugan.vn</strong> | Pass: <strong className="text-white">admin123</strong></p>
            <p>Khách hàng: <strong className="text-white">user@hugan.vn</strong> | Pass: <strong className="text-white">123456</strong></p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-sm font-extrabold justify-center"
          >
            {loading ? "Đang xử lý..." : isRegisterTab ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

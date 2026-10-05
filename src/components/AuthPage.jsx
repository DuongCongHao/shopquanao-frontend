import React, { useState } from "react";
import { ArrowLeft, Lock, Mail, User, Phone, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthPage = ({ onGoHome, onSuccess }) => {
  const { login, register, logout, loading, error } = useAuth();
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [loginMode, setLoginMode] = useState("user");
  
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
        const loggedInUser = await login({ email: formData.email, password: formData.password });
        if (loginMode === "seller" && loggedInUser.role !== "ADMIN") {
          logout();
          setLocalError("Tài khoản này chưa được cấp quyền người bán.");
          return;
        }
        if (onSuccess) onSuccess({ isSeller: loginMode === "seller" });
        else onGoHome();
      }
    } catch (err) {
      setLocalError(err.message || "Thao tác thất bại");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-topbar">
        <button
          onClick={onGoHome}
          className="auth-back"
        >
          <ArrowLeft size={18} />
          <span>Trang chủ</span>
        </button>
        <button className="auth-brand" onClick={onGoHome} aria-label="Trang chủ">
          <img src="/logo.svg" alt="Logo cửa hàng" />
        </button>
      </div>

      <main className="auth-main">
        <section className="auth-panel">
          <div className="auth-form lg:col-span-7 p-6 md:p-10 flex flex-col justify-center">
            
            {/* Header Title */}
            <div className="auth-heading text-center md:text-left space-y-1 mb-6">
              <h3 className="text-2xl font-black text-white">
                {isRegisterTab ? "Tạo tài khoản mới" : loginMode === "seller" ? "Đăng nhập người bán" : "Đăng nhập"}
              </h3>
              <p className="text-xs text-slate-400">
                {isRegisterTab ? "Nhập thông tin cá nhân để đăng ký tài khoản" : "Vui lòng nhập Email & Mật khẩu để đăng nhập"}
              </p>
            </div>

            {!isRegisterTab && (
              <div className="auth-role-switch" role="group" aria-label="Chọn loại tài khoản">
                <button
                  type="button"
                  aria-pressed={loginMode === "user"}
                  className={loginMode === "user" ? "is-active" : ""}
                  onClick={() => { setLoginMode("user"); setLocalError(""); }}
                >
                  Người dùng
                </button>
                <button
                  type="button"
                  aria-pressed={loginMode === "seller"}
                  className={loginMode === "seller" ? "is-active" : ""}
                  onClick={() => { setLoginMode("seller"); setLocalError(""); }}
                >
                  Người bán
                </button>
              </div>
            )}

            {/* Error Message */}
            {(localError || error) && (
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl mb-4 flex items-center gap-2 animate-fade-in">
                <ShieldAlert size={16} />
                <span>{localError || error}</span>
              </div>
            )}

            {/* Registration Success Message */}
            {regSuccess && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl mb-4 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} />
                <span>Đăng ký thành công! Đang chuyển sang màn hình Đăng nhập...</span>
              </div>
            )}

            {/* Main Form */}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-sm font-extrabold justify-center"
              >
                <span>{loading ? "Đang xử lý..." : isRegisterTab ? "Đăng ký tài khoản" : loginMode === "seller" ? "Vào trang quản lý" : "Vào cửa hàng"}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            {(isRegisterTab || loginMode !== "seller") && (
              <p className="auth-switch">
                {isRegisterTab ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterTab(!isRegisterTab);
                    if (!isRegisterTab) setLoginMode("user");
                    setLocalError("");
                    setRegSuccess(false);
                  }}
                >
                  {isRegisterTab ? "Đăng nhập" : "Đăng ký"}
                </button>
              </p>
            )}

          </div>

        </section>
      </main>
    </div>
  );
};

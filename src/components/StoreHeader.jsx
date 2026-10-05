import React, { useEffect, useRef, useState } from "react";
import { ClipboardList, ChevronDown, KeyRound, LogOut, Package, Search, Shield, ShoppingBag, Tags, User, X } from "lucide-react";
import storeLogo from "../../image/logo.jpg";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export const StoreHeader = ({ onGoHome, onShowBestSellers, onLogout, onSellerSectionChange, isSellerDashboard = false, searchQuery, onSearchChange, onOpenAuth, onOpenAdmin, onOpenCart }) => {
  const { user, logout, isAdmin } = useAuth();
  const { cart, setIsCartOpen } = useCart();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    setAccountMenuOpen(false);
    onLogout?.();
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button className="site-brand" onClick={onGoHome} aria-label="Trang chủ">
          <img src={storeLogo} alt="Logo cửa hàng" />
        </button>

        {isAdmin ? (
          <nav className="site-nav seller-site-nav" aria-label="Điều hướng người bán">
            <button onClick={() => onSellerSectionChange?.("products")}>
              <Package size={16} />
              <span>Sản phẩm</span>
            </button>
            <button onClick={() => onSellerSectionChange?.("orders")}>
              <ClipboardList size={16} />
              <span>Đơn hàng</span>
            </button>
            <button onClick={() => onSellerSectionChange?.("categories")}>
              <Tags size={16} />
              <span>Danh mục</span>
            </button>
          </nav>
        ) : (
          <nav className="site-nav" aria-label="Điều hướng chính">
            <button onClick={onGoHome}>Trang chủ</button>
            <button onClick={onShowBestSellers}>Top 10 bán chạy</button>
          </nav>
        )}

        <label className="site-search">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Tìm kiếm sản phẩm"
            type="search"
            placeholder="Tìm kiếm sản phẩm"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="site-search__clear"
              onClick={() => onSearchChange("")}
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X size={16} />
            </button>
          )}
        </label>

        <div className="site-actions">
          {isAdmin && !isSellerDashboard && (
            <button className="site-action site-action--icon" onClick={onOpenAdmin} title="Quản lý" aria-label="Quản lý">
              <Shield size={17} />
            </button>
          )}
          {!isSellerDashboard && (
            <button
              id="site-cart-target"
              className="site-action site-cart"
              onClick={onOpenCart || setIsCartOpen}
              title="Giỏ hàng"
              aria-label={`Giỏ hàng${cart.totalItems > 0 ? `, ${cart.totalItems} sản phẩm` : ""}`}
            >
              <ShoppingBag size={19} />
              <span>Giỏ hàng</span>
              {cart.totalItems > 0 && <span className="site-cart__count">{cart.totalItems}</span>}
            </button>
          )}
          {user ? (
            <div className="site-account" ref={accountRef}>
              <button
                className="site-account-trigger"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
              >
                <span>{user.email}</span>
                <ChevronDown size={15} />
              </button>
              {accountMenuOpen && (
                <div className="site-account-menu" role="menu">
                  <button
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setPasswordDialogOpen(true);
                    }}
                  >
                    <KeyRound size={16} />
                    <span>Đổi mật khẩu</span>
                  </button>
                  <button role="menuitem" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="site-action site-login" onClick={onOpenAuth} title="Đăng nhập">
              <User size={17} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
      {passwordDialogOpen && <ChangePasswordDialog onClose={() => setPasswordDialogOpen(false)} />}
    </header>
  );
};
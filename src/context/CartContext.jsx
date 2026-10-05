import React, { createContext, useState, useEffect, useContext } from "react";
import { cartApi } from "../api/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

// ─── Guest cart helpers (localStorage) ────────────────────────────────────────
const GUEST_CART_KEY = "hugan_guest_cart";

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { cartId: null, userId: null, totalItems: 0, totalPrice: 0, items: [] };
    const cart = JSON.parse(raw);
    const items = Array.isArray(cart.items) ? cart.items : [];
    return { ...cart, items, totalItems: items.length };
  } catch {
    return { cartId: null, userId: null, totalItems: 0, totalPrice: 0, items: [] };
  }
}

function saveGuestCart(cart) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
}

function recalcGuest(items) {
  const totalItems = items.length;
  const totalPrice = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  return { totalItems, totalPrice };
}

function mergeVariantMeta(item, variantMeta) {
  if (!variantMeta) return item;
  return {
    ...item,
    productName: item.productName || variantMeta.productName || "Sản phẩm",
    size: item.size || variantMeta.size || "",
    color: item.color || variantMeta.color || "",
    imgUrl: item.imgUrl || variantMeta.imgUrl || "",
    price: item.price ?? variantMeta.price ?? 0,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({
    cartId: null,
    userId: null,
    totalItems: 0,
    totalPrice: 0,
    items: [],
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync cart when user changes or loads
  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user?.id) {
      // Guest: load from localStorage
      setCart(loadGuestCart());
      return;
    }
    setLoading(true);
    try {
      const res = await cartApi.getCart(user.id);
      setCart(res || { items: [], totalItems: 0, totalPrice: 0 });
    } catch (e) {
      console.error("Lỗi khi tải giỏ hàng:", e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (variantId, quantity = 1, variantMeta = null) => {
    if (!user?.id) {
      // Guest: update localStorage cart
      setCart((prev) => {
        const existing = prev.items.find((i) => i.variantId === variantId);
        let items;
        if (existing) {
          items = prev.items.map((i) =>
            i.variantId === variantId
              ? (() => {
                  const item = mergeVariantMeta(i, variantMeta);
                  return { ...item, quantity: item.quantity + quantity, subtotal: item.price * (item.quantity + quantity) };
                })()
              : i
          );
        } else {
          const newItem = {
            id: `guest-${variantId}-${Date.now()}`,
            variantId,
            quantity,
            price: variantMeta?.price || 0,
            subtotal: (variantMeta?.price || 0) * quantity,
            productName: variantMeta?.productName || "Sản phẩm",
            size: variantMeta?.size || "",
            color: variantMeta?.color || "",
            imgUrl: variantMeta?.imgUrl || "",
          };
          items = [...prev.items, newItem];
        }
        const recalc = recalcGuest(items);
        const updated = { ...prev, items, ...recalc };
        saveGuestCart(updated);
        return updated;
      });
      setIsCartOpen(true);
      return;
    }

    setLoading(true);
    try {
      const updatedCart = await cartApi.addItem(user.id, { variantId, quantity });
      const items = (updatedCart.items || []).map((item) =>
        item.variantId === variantId ? mergeVariantMeta(item, variantMeta) : item
      );
      setCart({ ...updatedCart, items });
      setIsCartOpen(true);
      return updatedCart;
    } catch (e) {
      console.error("Lỗi thêm giỏ hàng:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!user?.id) {
      // Guest
      setCart((prev) => {
        const items = quantity <= 0
          ? prev.items.filter((i) => i.id !== itemId)
          : prev.items.map((i) =>
              i.id === itemId ? { ...i, quantity, subtotal: i.price * quantity } : i
            );
        const recalc = recalcGuest(items);
        const updated = { ...prev, items, ...recalc };
        saveGuestCart(updated);
        return updated;
      });
      return;
    }

    setLoading(true);
    try {
      const updatedCart = await cartApi.updateItemQuantity(user.id, itemId, quantity);
      setCart((currentCart) => ({
        ...updatedCart,
        items: (updatedCart.items || []).map((item) => {
          const previousItem = currentCart.items.find(
            (currentItem) => currentItem.id === item.id
          );
          if (!previousItem) return item;
          return {
            ...mergeVariantMeta(item, previousItem),
            imgUrl: previousItem.imgUrl || item.imgUrl || "",
          };
        }),
      }));
    } catch (e) {
      console.error("Lỗi cập nhật giỏ hàng:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user?.id) {
      setCart((prev) => {
        const items = prev.items.filter((i) => i.id !== itemId);
        const recalc = recalcGuest(items);
        const updated = { ...prev, items, ...recalc };
        saveGuestCart(updated);
        return updated;
      });
      return;
    }

    setLoading(true);
    try {
      const updatedCart = await cartApi.removeItem(user.id, itemId);
      setCart(updatedCart);
    } catch (e) {
      console.error("Lỗi xóa sản phẩm khỏi giỏ hàng:", e);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user?.id) {
      const empty = { cartId: null, userId: null, totalItems: 0, totalPrice: 0, items: [] };
      saveGuestCart(empty);
      setCart(empty);
      return;
    }

    setLoading(true);
    try {
      await cartApi.clearCart(user.id);
      setCart({ cartId: null, userId: null, totalItems: 0, totalPrice: 0, items: [] });
    } catch (e) {
      console.error("Lỗi xóa toàn bộ giỏ hàng:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

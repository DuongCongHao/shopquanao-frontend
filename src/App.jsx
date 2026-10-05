import React, { useState, useEffect, useRef } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { StoreHeader } from "./components/StoreHeader";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { SellerDashboard } from "./components/SellerDashboard";
import { AuthPage } from "./components/AuthPage";
import { AdminModal } from "./components/AdminModal";
import { Footer } from "./components/Footer";
import { productApi, categoryApi } from "./api/api";
import { useAuth } from "./context/AuthContext";
import { SlidersHorizontal, PackageSearch, RefreshCw } from "lucide-react";
import "./App.css";

const getProductIdFromPath = () => {
  const match = window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
};

const isSellerPath = () => window.location.pathname.replace(/\/+$/, "") === "/seller";

const getInitialView = (isAdmin) => {
  if (isSellerPath() && isAdmin) return "seller";
  return getProductIdFromPath() ? "product-detail" : "home";
};

// Inner app uses context - needs to be inside providers
function InnerApp() {
  const { isAdmin, sessionNotice } = useAuth();
  // view: "home" | "auth" | "product-detail" | "cart" | "order"
  const [currentView, setCurrentView] = useState(() => getInitialView(isAdmin));
  const [prevView, setPrevView] = useState("home");

  const [products, setProducts] = useState([]);
  const [popularity, setPopularity] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productReloadError, setProductReloadError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceSort, setPriceSort] = useState("default");
  const [isBestSellersView, setIsBestSellersView] = useState(false);
  const [sellerSection, setSellerSection] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutVariantId, setCheckoutVariantId] = useState(null);
  const [directCheckoutItem, setDirectCheckoutItem] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    window.matchMedia("(max-width: 680px)").matches
  );
  const pageSize = isMobileLayout ? 40 : 20;
  const [displayCount, setDisplayCount] = useState(pageSize);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 680px)");
    const updateLayout = (event) => setIsMobileLayout(event.matches);
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return undefined;

    const updateStickyOffset = () => {
      document.documentElement.style.setProperty(
        "--catalog-sticky-offset",
        `${header.getBoundingClientRect().height}px`
      );
    };
    const observer = new ResizeObserver(updateStickyOffset);
    observer.observe(header);
    updateStickyOffset();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--catalog-sticky-offset");
    };
  }, []);

  useEffect(() => {
    const syncProductRoute = () => {
      if (isSellerPath()) {
        if (isAdmin) {
          setCurrentView("seller");
        } else {
          window.history.replaceState({}, "", "/");
          setCurrentView("home");
        }
        return;
      }
      const productId = getProductIdFromPath();
      const product = products.find((item) => String(item.id) === productId);
      if (product) {
        setSelectedProduct(product);
        setCurrentView("product-detail");
      } else if (!productId) {
        setSelectedProduct(null);
        setCurrentView("home");
      }
    };

    window.addEventListener("popstate", syncProductRoute);
    return () => window.removeEventListener("popstate", syncProductRoute);
  }, [isAdmin, products]);

  useEffect(() => {
    if (isSellerPath() && !isAdmin) {
      window.history.replaceState({}, "", "/");
      setCurrentView("home");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!sessionNotice) return;
    window.history.replaceState({}, "", "/");
    setSelectedProduct(null);
    setCurrentView("home");
  }, [sessionNotice]);

  const refreshPopularity = async () => {
    try {
      const data = await productApi.getPopularity();
      setPopularity(Object.fromEntries(
        (data || []).map((item) => [Number(item.productId), item])
      ));
    } catch (error) {
      console.error("Không thể tải thứ hạng sản phẩm:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, popularityRes] = await Promise.allSettled([
        productApi.getAll(),
        categoryApi.getAll(),
        productApi.getPopularity(),
      ]);
      if (prodRes.status === "fulfilled") {
        const loadedProducts = prodRes.value || [];
        setProducts(loadedProducts);

        const productId = getProductIdFromPath();
        if (productId) {
          const product = loadedProducts.find((item) => String(item.id) === productId);
          if (product) {
            setSelectedProduct(product);
            setCurrentView("product-detail");
          } else {
            setCurrentView("home");
            window.history.replaceState({}, "", "/");
          }
        }
      }
      if (catRes.status === "fulfilled") {
        const loadedCategories = catRes.value || [];
        setCategories(loadedCategories);
        setSelectedCategory((current) =>
          current !== null &&
          !loadedCategories.some((category) => Number(category.id) === Number(current))
            ? null
            : current
        );
      }
      if (popularityRes.status === "fulfilled") {
        setPopularity(Object.fromEntries(
          (popularityRes.value || []).map((item) => [Number(item.productId), item])
        ));
      }
    } catch (e) {
      console.error("Lỗi:", e);
    } finally {
      setLoading(false);
    }
  };

  const reloadProducts = async () => {
    setLoading(true);
    setProductReloadError("");
    try {
      const loadedProducts = await productApi.getAll();
      setProducts(loadedProducts || []);
      setSelectedCategory(null);
      setSearchQuery("");
      setPriceSort("default");
      setIsBestSellersView(false);
      setDisplayCount(pageSize);
    } catch (error) {
      console.error("Không thể tải lại danh sách sản phẩm:", error);
      setProductReloadError(error.message || "Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadData();
    });
    return () => { active = false; };
  }, []);

  const navigate = (view) => {
    if (currentView === "product-detail" && view !== "product-detail") {
      window.history.replaceState({}, "", "/");
    }
    if (view === "seller") {
      if (window.location.pathname !== "/seller") {
        window.history.pushState({}, "", "/seller");
      }
    } else if (currentView === "seller" && view !== "seller") {
      window.history.replaceState({}, "", "/");
    }
    setPrevView(currentView);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    window.history.pushState(
      { productId: product.id },
      "",
      `/products/${encodeURIComponent(product.id)}`
    );
    navigate("product-detail");
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === null || Number(p.categoryId) === Number(selectedCategory);
    const matchQ = !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  }).sort((a, b) => {
    if (isBestSellersView) {
      const scoreFor = (product) => {
        const stats = popularity[Number(product.id)] || {};
        const orderQuantity = Number(stats.orderQuantity ?? product.soldCount ?? product.salesCount ?? product.totalSold ?? product.sold ?? product.purchaseCount ?? 0);
        const cartQuantity = Number(stats.cartQuantity ?? 0);
        return { score: orderQuantity + cartQuantity, orderQuantity, cartQuantity };
      };
      const firstRank = Number(popularity[Number(a.id)]?.rank ?? 0);
      const secondRank = Number(popularity[Number(b.id)]?.rank ?? 0);
      if (firstRank && secondRank) return firstRank - secondRank;
      if (firstRank) return -1;
      if (secondRank) return 1;
      const first = scoreFor(a);
      const second = scoreFor(b);
      return second.score - first.score
        || second.orderQuantity - first.orderQuantity
        || second.cartQuantity - first.cartQuantity
        || String(a.name).localeCompare(String(b.name), "vi");
    }
    if (priceSort === "asc") return a.price - b.price;
    if (priceSort === "desc") return b.price - a.price;
    return 0;
  });

  // Reset displayCount when filters change
  useEffect(() => {
    setDisplayCount(pageSize);
  }, [selectedCategory, searchQuery, priceSort, isBestSellersView, pageSize]);

  // IntersectionObserver: load more when sentinel comes into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => prev + pageSize);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentView, filteredProducts.length, pageSize]);

  const allProducts = isBestSellersView ? filteredProducts.slice(0, 10) : filteredProducts;
  const visibleProducts = allProducts.slice(0, displayCount);
  const hasMore = visibleProducts.length < allProducts.length;

  const sharedHeader = (
    <StoreHeader
      onGoHome={() => {
        setSelectedCategory(null);
        setIsBestSellersView(false);
        navigate("home");
      }}
      onShowBestSellers={() => {
        setSelectedCategory(null);
        setSearchQuery("");
        setIsBestSellersView(true);
        refreshPopularity();
        navigate("home");
      }}
      onLogout={() => {
        setSelectedCategory(null);
        setSearchQuery("");
        setIsBestSellersView(false);
        if (isSellerPath()) {
          window.history.replaceState({}, "", "/");
        }
        navigate("home");
      }}
      isSellerDashboard={currentView === "seller"}
      onSellerSectionChange={(section) => {
        setSellerSection(section);
        navigate("seller");
      }}
      searchQuery={searchQuery}
      onSearchChange={(q) => { setSearchQuery(q); setIsBestSellersView(false); navigate("home"); }}
      onOpenAuth={() => navigate("auth")}
      onOpenCart={() => navigate("cart")}
      onOpenAdmin={() => setIsAdminOpen(true)}
    />
  );

  // AUTH PAGE
  if (currentView === "auth") {
    return (
      <AuthPage
        onGoHome={() => navigate("home")}
        onSuccess={({ isSeller }) => {
          if (isSeller) {
            setSellerSection("products");
            navigate("seller");
          } else {
            navigate("home");
          }
        }}
      />
    );
  }

  if (currentView === "seller") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        {sharedHeader}
        <main className="flex-1">
          <SellerDashboard section={sellerSection} onRefreshProducts={loadData} />
        </main>
      </div>
    );
  }

  // CART PAGE
  if (currentView === "cart") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        {sharedHeader}
        <main className="flex-1">
          <CartPage
            onGoBack={() => navigate(prevView === "cart" ? "home" : prevView)}
            onGoHome={() => navigate("home")}
            onGoOrder={(variantId) => {
              setDirectCheckoutItem(null);
              setCheckoutVariantId(variantId);
              navigate("order");
            }}
          />
        </main>
        <Footer />
        {isAdminOpen && <AdminModal onClose={() => setIsAdminOpen(false)} onRefreshData={loadData} />}
      </div>
    );
  }

  // ORDER PAGE
  if (currentView === "order") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        {sharedHeader}
        <main className="flex-1">
          <CheckoutPage
            onGoBack={() => {
              if (directCheckoutItem) {
                setDirectCheckoutItem(null);
                window.history.replaceState(
                  { productId: selectedProduct.id },
                  "",
                  `/products/${encodeURIComponent(selectedProduct.id)}`
                );
                navigate("product-detail");
              } else {
                navigate("cart");
              }
            }}
            checkoutVariantId={checkoutVariantId}
            directCheckoutItem={directCheckoutItem}
          />
        </main>
        <Footer />
        {isAdminOpen && <AdminModal onClose={() => setIsAdminOpen(false)} onRefreshData={loadData} />}
      </div>
    );
  }

  // PRODUCT DETAIL PAGE
  if (currentView === "product-detail" && selectedProduct) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        {sharedHeader}
        <main className="flex-1">
          <ProductDetailPage
            product={selectedProduct}
            onGoBack={() => navigate("home")}
            onOpenCheckout={(variant, variantMeta) => {
              const price = variantMeta.price ?? selectedProduct.price;
              setDirectCheckoutItem({
                id: `direct-${variant.id}`,
                variantId: variant.id,
                quantity: 1,
                price,
                subtotal: price,
                productName: variantMeta.productName,
                size: variantMeta.size,
                color: variantMeta.color,
                imgUrl: variantMeta.imgUrl,
              });
              setCheckoutVariantId(null);
              navigate("order");
            }}
          />
        </main>
        <Footer />
        {isAdminOpen && <AdminModal onClose={() => setIsAdminOpen(false)} onRefreshData={loadData} />}
      </div>
    );
  }

  // HOME PAGE (default)
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      {sharedHeader}

      <main className="flex-1">
        <section id="catalog-section" className="catalog-section py-10 container mx-auto px-4">

          <div className="catalog-heading flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-light)]">
            <h2 className="catalog-title">
              {isBestSellersView
                ? "Top 10 bán chạy"
                : selectedCategory
                  ? categories.find(c => Number(c.id) === Number(selectedCategory))?.name || "Sản phẩm"
                  : "Sản phẩm"}
            </h2>

            <div className="catalog-controls">
              <label className="catalog-category-control">
                <span>Danh mục</span>
                <select
                  aria-label="Lọc sản phẩm theo danh mục"
                  value={selectedCategory ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedCategory(value ? Number(value) : null);
                    setIsBestSellersView(false);
                  }}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="catalog-sort-control">
                <SlidersHorizontal size={15} />
                <select
                  aria-label="Sắp xếp sản phẩm theo giá"
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value)}
                >
                  <option value="default">Mặc định</option>
                  <option value="asc">Giá tăng dần</option>
                  <option value="desc">Giá giảm dần</option>
                </select>
              </label>

            </div>
          </div>

          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 10 }).map((_, n) => (
                <div key={n} className="catalog-skeleton">
                  <div className="catalog-skeleton-image" />
                  <div className="catalog-skeleton-info">
                    <div />
                    <div />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="catalog-empty-state">
              <PackageSearch size={48} aria-hidden="true" />
              <h3>Không Tìm Thấy Sản Phẩm</h3>
              <button onClick={reloadProducts} className="catalog-reload-button" disabled={loading}>
                <RefreshCw size={16} className={loading ? "catalog-reload-button__spinning" : ""} />
                <span>{loading ? "Đang tải danh sách..." : "Tải lại danh sách sản phẩm"}</span>
              </button>
              {productReloadError && <p className="catalog-reload-error" role="alert">{productReloadError}</p>}
            </div>
          ) : (
            <>
              <div className="product-grid animate-fade-in">
                {visibleProducts.map((prod, index) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    rank={isBestSellersView ? index + 1 : null}
                    onSelectProduct={handleSelectProduct}
                  />
                ))}
              </div>
              {/* Sentinel element for infinite scroll */}
              {hasMore && (
                <div ref={sentinelRef} className="product-load-sentinel">
                  <div className="product-load-spinner" />
                  <span>Đang tải thêm sản phẩm...</span>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />

      {isAdminOpen && (
        <AdminModal onClose={() => setIsAdminOpen(false)} onRefreshData={loadData} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <InnerApp />
      </CartProvider>
    </AuthProvider>
  );
}

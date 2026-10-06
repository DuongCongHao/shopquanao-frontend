import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit, Shield, Package, FolderPlus, Users, Save, Loader2 } from "lucide-react";
import { productApi, categoryApi, userApi } from "../api/api";
import { CategoryPicker } from "./CategoryPicker";
import { resolveCategoryNames } from "../utils/categorySelection";

// Spinner component
const Spinner = ({ size = 16 }) => (
  <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
);
import "../admin-modal.css";

export const AdminModal = ({ onClose, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState("products"); // "products", "categories", "users"

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Per-action loading
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Product Form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 350000,
    imgUrl: "",
    isPublished: true,
    categoryText: "",
    variants: [
      { size: "M", color: "Đen", price: 350000, stock: 20, sku: "SKU-M-BLK", imgUrl: "" },
      { size: "L", color: "Trắng", price: 350000, stock: 15, sku: "SKU-L-WHT", imgUrl: "" }
    ]
  });

  // Category Form state
  const [newCatName, setNewCatName] = useState("");

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, userRes] = await Promise.allSettled([
        productApi.getAll(),
        categoryApi.getAll(),
        userApi.getAll()
      ]);

      if (prodRes.status === "fulfilled") setProducts(prodRes.value || []);
      if (catRes.status === "fulfilled") setCategories(catRes.value || []);
      if (userRes.status === "fulfilled") setUsers(userRes.value || []);
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu admin:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadAllData();
    });
    return () => { active = false; };
  }, []);

  // --- Category Handlers ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCategory(true);
    try {
      await categoryApi.create({ name: newCatName });
      setNewCatName("");
      loadAllData();
      onRefreshData();
    } catch (e) {
      alert("Lỗi khi tạo danh mục: " + e.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    setDeletingCategoryId(id);
    try {
      await categoryApi.delete(id);
      loadAllData();
      onRefreshData();
    } catch (e) {
      alert("Lỗi khi xóa danh mục: " + e.message);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  // --- Product Handlers ---
  const handleOpenNewProduct = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      description: "",
      price: 390000,
      imgUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
      isPublished: true,
      categoryText: categories[0]?.name || "",
      variants: [
        { size: "M", color: "Đen", price: 390000, stock: 20, sku: `SKU-${Date.now()}-M`, imgUrl: "" },
        { size: "L", color: "Trắng", price: 390000, stock: 15, sku: `SKU-${Date.now()}-L`, imgUrl: "" }
      ]
    });
    setShowProductForm(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name || "",
      description: prod.description || "",
      price: prod.price || 0,
      imgUrl: prod.imgUrl || "",
      isPublished: prod.isPublished ?? true,
      categoryText: prod.categoryNames?.length
        ? prod.categoryNames.join(", ")
        : prod.categoryName || categories[0]?.name || "",
      variants: prod.variants?.length ? prod.variants : [
        { size: "M", color: "Đen", price: prod.price || 0, stock: 10, sku: `SKU-${prod.id}-M`, imgUrl: "" }
      ]
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.categoryText.trim()) {
      alert("Vui lòng điền tên, giá và ít nhất một danh mục!");
      return;
    }

    setSavingProduct(true);
    try {
      const selectedCategories = await resolveCategoryNames(
        productForm.categoryText,
        categories,
        categoryApi.create
      );
      const payload = {
        ...productForm,
        categoryIds: selectedCategories.map((category) => category.id),
        categoryId: selectedCategories[0].id,
        categoryNames: selectedCategories.map((category) => category.name),
      };
      delete payload.categoryText;
      if (editingProductId) {
        await productApi.update(editingProductId, payload);
      } else {
        await productApi.create(payload);
      }
      setShowProductForm(false);
      loadAllData();
      onRefreshData();
    } catch (err) {
      alert("Lỗi khi lưu sản phẩm: " + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi hệ thống?")) return;
    setDeletingProductId(id);
    try {
      await productApi.delete(id);
      loadAllData();
      onRefreshData();
    } catch (e) {
      alert("Lỗi khi xóa sản phẩm: " + e.message);
    } finally {
      setDeletingProductId(null);
    }
  };

  // Dynamic Variant Form Handlers
  const handleAddVariant = () => {
    setProductForm({
      ...productForm,
      variants: [
        ...productForm.variants,
        { size: "XL", color: "Xám", price: productForm.price, stock: 10, sku: `SKU-${Date.now()}`, imgUrl: "" }
      ]
    });
  };

  const handleRemoveVariant = (index) => {
    const updated = [...productForm.variants];
    updated.splice(index, 1);
    setProductForm({ ...productForm, variants: updated });
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...productForm.variants];
    updated[index][field] = value;
    setProductForm({ ...productForm, variants: updated });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="admin-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="admin-modal relative w-full max-w-5xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-3xl overflow-hidden shadow-2xl animate-scale-up my-6 p-6 md:p-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-modal-header flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Quản Lý Hệ Thống Admin Store</h2>
              <p className="text-xs text-slate-400">Quản lý Sản phẩm, Danh mục & Người dùng</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-modal-tabs flex gap-2 my-4 border-b border-slate-800 pb-3">
          <button
            onClick={() => { setActiveTab("products"); setShowProductForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              activeTab === "products"
                ? "bg-amber-500 text-black border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Package size={16} />
            <span>Sản Phẩm ({products.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("categories"); setShowProductForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              activeTab === "categories"
                ? "bg-amber-500 text-black border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <FolderPlus size={16} />
            <span>Danh Mục ({categories.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("users"); setShowProductForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              activeTab === "users"
                ? "bg-amber-500 text-black border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Users size={16} />
            <span>Người Dùng ({users.length})</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="admin-modal-content flex-1 overflow-y-auto pr-2 space-y-6">
          {loading && <p className="admin-loading-state">Đang tải dữ liệu quản lý...</p>}
          
          {/* --- TAB 1: PRODUCTS --- */}
          {activeTab === "products" && (
            <div>
              {!showProductForm ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300">Danh Sách Sản Phẩm Trong Cửa Hàng</h3>
                    <button
                      onClick={handleOpenNewProduct}
                      className="btn-primary text-xs py-2 px-4"
                    >
                      <Plus size={16} />
                      <span>Thêm Sản Phẩm Mới</span>
                    </button>
                  </div>

                  <div className="admin-table-wrap bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-amber-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3">Danh mục</th>
                          <th className="p-3">Giá bán</th>
                          <th className="p-3">Biến thể</th>
                          <th className="p-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3 flex items-center gap-3">
                              <img 
                                src={p.imgUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"} 
                                alt={p.name}
                                className="w-10 h-12 object-cover rounded-lg bg-slate-900"
                              />
                              <div>
                                <p className="font-bold text-white text-sm line-clamp-1">{p.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">ID: {p.id}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="badge-category text-[10px]">{p.categoryNames?.join(", ") || p.categoryName || "Thời Trang"}</span>
                            </td>
                            <td className="p-3 font-bold text-amber-400">{formatCurrency(p.price)}</td>
                            <td className="p-3">
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                                {p.variants?.length || 0} variants
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black rounded-lg transition-all"
                                title="Sửa"
                                disabled={deletingProductId === p.id}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                title="Xóa"
                                disabled={deletingProductId === p.id}
                              >
                                {deletingProductId === p.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* PRODUCT EDIT / CREATE FORM */
                <form onSubmit={handleSaveProduct} className="space-y-6 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-extrabold text-amber-400">
                      {editingProductId ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Tên Sản Phẩm *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl py-2.5 px-3 focus:border-amber-400"
                        placeholder="VD: Áo Sơ Mi Silk HUGAN"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <CategoryPicker
                        categories={categories}
                        value={productForm.categoryText}
                        variant="admin"
                        onChange={(categoryText) => setProductForm((current) => ({ ...current, categoryText }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Giá Tiền (VND) *</label>
                      <input
                        type="number"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl py-2.5 px-3 focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Link Ảnh Sản Phẩm (URL)</label>
                      <input
                        type="url"
                        value={productForm.imgUrl}
                        onChange={(e) => setProductForm({ ...productForm, imgUrl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl py-2.5 px-3 focus:border-amber-400"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Mô Tả Sản Phẩm</label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl py-2.5 px-3 focus:border-amber-400"
                      placeholder="Mô tả chi tiết kiểu dáng, chất liệu..."
                    />
                  </div>

                  {/* Dynamic Variant Builder */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Danh Sách Biến Thể (Variants: Size, Color, Stock, SKU)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} />
                        <span>Thêm Biến Thể</span>
                      </button>
                    </div>

                    {productForm.variants.map((v, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Size (M, L...)"
                            value={v.size}
                            onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Màu sắc (Đen, Trắng...)"
                            value={v.color}
                            onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Giá"
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, "price", Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Tồn kho"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(idx, "stock", Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Mã SKU"
                            value={v.sku}
                            onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white font-mono"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          {productForm.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="btn-secondary text-xs px-5 py-2.5"
                      disabled={savingProduct}
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="btn-primary text-xs px-6 py-2.5"
                      disabled={savingProduct}
                    >
                      {savingProduct ? <Spinner size={16} /> : <Save size={16} />}
                      <span>{savingProduct ? "Đang lưu..." : "Lưu Sản Phẩm"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* --- TAB 2: CATEGORIES --- */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <form onSubmit={handleCreateCategory} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex gap-3">
                <input
                  type="text"
                  placeholder="Nhập tên danh mục mới (VD: Áo Blazer, Quần Short...)"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-4 py-2.5 focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="btn-primary text-xs py-2.5 px-6"
                  disabled={creatingCategory}
                >
                  {creatingCategory ? <Spinner size={16} /> : <Plus size={16} />}
                  <span>{creatingCategory ? "Đang tạo..." : "Tạo Danh Mục"}</span>
                </button>
              </form>

              <div className="admin-table-wrap bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-amber-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Tên Danh Mục</th>
                      <th className="p-3">Mô tả</th>
                      <th className="p-3 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-mono text-slate-500">#{c.id}</td>
                        <td className="p-3 font-bold text-white">{c.name}</td>
                        <td className="p-3 text-slate-400">{c.description || "Danh mục sản phẩm HUGAN"}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                            disabled={deletingCategoryId === c.id}
                          >
                            {deletingCategoryId === c.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 3: USERS --- */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300">Danh Sách Người Dùng Đã Đăng Ký (Role: ADMIN Endpoint)</h3>
              <div className="admin-table-wrap bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-amber-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Số điện thoại</th>
                      <th className="p-3">Quyền hạn (Role)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-mono text-slate-500">#{u.id}</td>
                        <td className="p-3 font-bold text-white">{u.fullName}</td>
                        <td className="p-3 text-slate-300">{u.email}</td>
                        <td className="p-3 font-mono text-slate-400">{u.phone || "---"}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === "ADMIN" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-slate-800 text-slate-400"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

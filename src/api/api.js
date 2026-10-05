const API_BASE_URL = "https://shopquanao-9ml9.onrender.com";

async function apiRequest(endpoint, options = {}, tokenOverride) {
  const token = tokenOverride ?? localStorage.getItem("hugan_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    let errorMsg = `Lỗi HTTP ${res.status}`;
    try {
      const errText = await res.text();
      errorMsg = errText || errorMsg;
    } catch (_) {}
    const error = new Error(errorMsg);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return true;
  return await res.json();
}

export const authApi = {
  login: async (credentials) =>
    apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  heartbeat: async (token) =>
    apiRequest("/api/v1/auth/heartbeat", { method: "POST" }, token),

  logout: async (token) =>
    apiRequest("/api/v1/auth/logout", { method: "POST" }, token),

  register: async (userData) =>
    apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  changePassword: async ({ currentPassword, newPassword }) =>
    apiRequest("/api/v1/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const categoryApi = {
  getAll: async () => apiRequest("/api/v1/categories"),

  create: async (categoryData) =>
    apiRequest("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    }),

  update: async (id, categoryData) =>
    apiRequest(`/api/v1/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    }),

  delete: async (id) =>
    apiRequest(`/api/v1/categories/${id}`, { method: "DELETE" }),
};

// Deployed backend trả images là mảng object {id, imageData, contentType, ...}
// Hàm này chuẩn hóa về mảng string (base64 hoặc URL) để frontend dùng thống nhất
function extractImageSrc(img) {
  if (!img) return null;
  if (typeof img === "string") {
    // Bỏ blob URL vì không dùng được ngoài tab gốc
    if (img.startsWith("blob:")) return null;
    return img;
  }
  // Object dạng {imageData, contentType} hoặc {imageData} (base64)
  if (img.imageData) return img.imageData;
  // Object dạng {url} hoặc {secureUrl}
  if (img.url) return img.url;
  if (img.secureUrl) return img.secureUrl;
  return null;
}

function normalizeProduct(p) {
  if (!p) return p;
  // Chuẩn hóa mảng images
  const images = (p.images || []).map(extractImageSrc).filter(Boolean);
  // imgUrl: ưu tiên images[0], rồi imgUrl gốc (bỏ blob)
  let imgUrl = images[0] || null;
  if (!imgUrl && p.imgUrl && !p.imgUrl.startsWith("blob:")) imgUrl = p.imgUrl;
  return { ...p, images, imgUrl: imgUrl || "" };
}

export const productApi = {
  getAll: async () => {
    const data = await apiRequest("/api/v1/products");
    return Array.isArray(data) ? data.map(normalizeProduct) : data;
  },

  getPopularity: async () => apiRequest("/api/v1/products/popularity", { cache: "no-store" }),

  getById: async (id) => {
    const data = await apiRequest(`/api/v1/products/${id}`);
    return normalizeProduct(data);
  },

  create: async (productData) =>
    apiRequest("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(productData),
    }),

  update: async (id, productData) =>
    apiRequest(`/api/v1/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    }),

  delete: async (id) =>
    apiRequest(`/api/v1/products/${id}`, { method: "DELETE" }),
};

function normalizeCartItem(item) {
  if (!item) return item;
  const imgUrl = extractImageSrc(item.imgUrl) || extractImageSrc(item.imageUrl) || "";
  return { ...item, imgUrl };
}

function normalizeCart(cart) {
  if (!cart) return cart;
  const items = (cart.items || []).map(normalizeCartItem);
  return { ...cart, items, totalItems: items.length };
}

export const cartApi = {
  getCart: async (userId) => {
    const data = await apiRequest(`/api/v1/carts?userId=${userId}`);
    return normalizeCart(data);
  },

  addItem: async (userId, itemRequest) => {
    const data = await apiRequest(`/api/v1/carts?userId=${userId}`, {
      method: "POST",
      body: JSON.stringify(itemRequest),
    });
    return normalizeCart(data);
  },

  updateItemQuantity: async (userId, itemId, quantity) => {
    const data = await apiRequest(`/api/v1/carts/items/${itemId}?userId=${userId}&quantity=${quantity}`, {
      method: "PUT",
    });
    return normalizeCart(data);
  },

  removeItem: async (userId, itemId) => {
    const data = await apiRequest(`/api/v1/carts/items/${itemId}?userId=${userId}`, {
      method: "DELETE",
    });
    return normalizeCart(data);
  },

  clearCart: async (userId) =>
    apiRequest(`/api/v1/carts?userId=${userId}`, { method: "DELETE" }),
};

export const userApi = {
  getAll: async () => apiRequest("/api/v1/users"),
};

export const uploadApi = {
  // Upload thẳng lên Cloudinary từ frontend (unsigned preset)
  // Không cần qua backend — an toàn vì chỉ dùng cloud_name + upload_preset
  uploadImage: async (file) => {
    const CLOUD_NAME = "kwcsfztz";
    const UPLOAD_PRESET = "hugan_unsigned"; // tạo preset này trên Cloudinary Dashboard

    if (!file.type.startsWith("image/")) throw new Error("Chỉ chấp nhận file hình ảnh.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Mỗi ảnh cần nhỏ hơn 12 MB.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "hugan_uploads");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Upload thất bại (${res.status})`);
    }

    const data = await res.json();
    return data.secure_url;
  },
};

function normalizeOrder(order) {
  if (!order) return order;
  const items = (order.items || []).map(normalizeCartItem);
  return { ...order, items };
}

export const orderApi = {
  create: async (orderRequest) => {
    const data = await apiRequest("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(orderRequest),
    });
    return normalizeOrder(data);
  },

  getAll: async () => {
    const data = await apiRequest("/api/v1/orders");
    return Array.isArray(data) ? data.map(normalizeOrder) : data;
  },

  update: async (id, changes) =>
    apiRequest(`/api/v1/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    }),

  delete: async (id) =>
    apiRequest(`/api/v1/orders/${id}`, { method: "DELETE" }),
};

import React, { useEffect, useRef, useState } from "react";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  ImagePlus,
  Loader2,
  PackagePlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  categoryApi,
  orderApi,
  productApi,
  uploadApi,
} from "../api/api";

import "../seller.css";

const ORDER_STATUSES = [
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPED", label: "Đang giao" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const formatOrderDate = (epoch, dateTime) => {
  const parsedEpoch = Number(epoch);
  const date = Number.isFinite(parsedEpoch) && parsedEpoch > 0
    ? new Date(parsedEpoch)
    : dateTime
      ? new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(dateTime) ? dateTime : `${dateTime}Z`)
      : null;

  if (!date || Number.isNaN(date.getTime())) return "Không rõ thời gian";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
};

const getOrderAutoDeleteAt = (order) => {
  const deadline = Number(order.autoDeleteAt);
  if (Number.isFinite(deadline) && deadline > 0) return deadline;

  const fallbackTimestamp = [
    Number(order.statusChangedAtEpoch),
    Number(order.updatedAtEpoch),
    Number(order.createdAtEpoch),
  ].find((timestamp) => Number.isFinite(timestamp) && timestamp > 0);

  if (fallbackTimestamp) {
    return fallbackTimestamp + 7 * 24 * 60 * 60 * 1000;
  }

  const fallbackDate = order.updatedAt || order.createdAt;
  if (!fallbackDate) return null;
  const date = new Date(
    /[zZ]|[+-]\d{2}:\d{2}$/.test(fallbackDate)
      ? fallbackDate
      : `${fallbackDate}Z`
  );
  return Number.isNaN(date.getTime())
    ? null
    : date.getTime() + 7 * 24 * 60 * 60 * 1000;
};

const xmlEscape = (value) => {
  const validXmlCharacters = Array.from(String(value ?? ""))
    .filter((character) => {
      const codePoint = character.codePointAt(0);

      return (
        codePoint === 9 ||
        codePoint === 10 ||
        codePoint === 13 ||
        (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)
      );
    })
    .join("");

  return validXmlCharacters
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const orderToExcelRow = (order) => {
  const statusLabel =
    ORDER_STATUSES.find(
      (status) => status.value === order.status
    )?.label || order.status;

  const items = (order.items || [])
    .map(
      (item) =>
        `${item.productName || "Sản phẩm"} · ${
          item.size || ""
        } · ${item.color || ""} × ${
          item.quantity || 0
        } (${formatCurrency(item.subtotal)})`
    )
    .join("\n");

  return [
    order.id,
    order.customerName,
    order.customerPhone,
    order.customerEmail,
    order.customerAddress,
    statusLabel,
    formatOrderDate(order.createdAtEpoch, order.createdAt),
    order.totalItems ??
      (order.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    Number(order.totalPrice || 0),
    items,
  ];
};

const createExcelWorkbook = (orders) => {
  const columns = [
    "Mã đơn hàng",
    "Tên khách hàng",
    "Số điện thoại",
    "Email",
    "Địa chỉ",
    "Trạng thái",
    "Ngày đặt",
    "Số lượng sản phẩm",
    "Tổng tiền (VND)",
    "Chi tiết sản phẩm",
  ];

  const rows = [columns, ...orders.map(orderToExcelRow)];

  const worksheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const isNumeric =
            rowIndex > 0 &&
            (columnIndex === 0 ||
              columnIndex === 7 ||
              columnIndex === 8);

          const type =
            isNumeric && Number.isFinite(Number(value))
              ? "Number"
              : "String";

          const cellValue =
            type === "Number" ? Number(value) : value;

          const style =
            rowIndex === 0 ? ' ss:StyleID="Header"' : "";

          return `<Cell${style}><Data ss:Type="${type}">${xmlEscape(
            cellValue
          )}</Data></Cell>`;
        })
        .join("");

      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#194A82" ss:Pattern="Solid"/></Style></Styles>
  <Worksheet ss:Name="Đơn hàng"><Table>${worksheetRows}</Table></Worksheet>
</Workbook>`;
};

const getExportDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
};

// Tối đa 20 ảnh cho một sản phẩm
const MAX_PRODUCT_IMAGES = 20;

const ITEMS_PER_PAGE = 30;
const PAGES_PER_CHUNK = 100;

const getUniqueSizes = (product) =>
  [
    ...new Set(
      (product.variants || [])
        .map((variant) => variant.size)
        .filter(Boolean)
    ),
  ];

const loadSellerData = () =>
  Promise.allSettled([
    productApi.getAll(),
    categoryApi.getAll(),
    orderApi.getAll(),
  ]);

// ─── Spinner ────────────────────────────────────────────────────────────────

const Spinner = ({ size = 16 }) => (
  <Loader2
    size={size}
    style={{
      animation: "spin 0.8s linear infinite",
      display: "inline-block",
    }}
  />
);

const OrderDeletionCountdown = ({ autoDeleteAt }) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const remainingSeconds = Math.max(0, Math.ceil((autoDeleteAt - now) / 1000));
  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const countdown = [
    days ? `${days} ngày` : null,
    days || hours ? `${hours} giờ` : null,
    days || hours || minutes ? `${minutes} phút` : null,
    `${seconds} giây`,
  ].filter(Boolean).join(" ");

  return (
    <p className="seller-order-auto-delete" aria-live="off">
      {remainingSeconds > 0
        ? `Tự động xóa sau ${countdown}`
        : "Đã đến hạn xóa, đang đồng bộ..."}
    </p>
  );
};

// ─── Pagination Component ──────────────────────────────────────────────────

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [showPagePicker, setShowPagePicker] =
    useState(false);

  const [pickerChunk, setPickerChunk] =
    useState(0);

  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPagePicker) return;

    const handler = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target)
      ) {
        setShowPagePicker(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );
  }, [showPagePicker]);

  const openPicker = () => {
    setPickerChunk(
      Math.floor(
        (currentPage - 1) / PAGES_PER_CHUNK
      )
    );

    setShowPagePicker(true);
  };

  const chunkStart =
    pickerChunk * PAGES_PER_CHUNK + 1;

  const chunkEnd = Math.min(
    chunkStart + PAGES_PER_CHUNK - 1,
    totalPages
  );

  const chunkPages = Array.from(
    {
      length: chunkEnd - chunkStart + 1,
    },
    (_, i) => chunkStart + i
  );

  const totalChunks = Math.ceil(
    totalPages / PAGES_PER_CHUNK
  );

  return (
    <div className="seller-pagination">
      <button
        className="seller-page-btn"
        onClick={() =>
          onPageChange(currentPage - 1)
        }
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        className="seller-page-indicator"
        onClick={openPicker}
        aria-label="Chọn trang"
      >
        {currentPage}/{totalPages}
      </button>

      <button
        className="seller-page-btn"
        onClick={() =>
          onPageChange(currentPage + 1)
        }
        disabled={
          currentPage === totalPages
        }
        aria-label="Trang sau"
      >
        <ChevronRight size={16} />
      </button>

      {showPagePicker && (
        <div className="seller-page-picker-backdrop">
          <div
            className="seller-page-picker"
            ref={pickerRef}
          >
            <div className="seller-page-picker-header">
              <span>
                Chọn trang ({totalPages} trang)
              </span>

              <button
                onClick={() =>
                  setShowPagePicker(false)
                }
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            {totalChunks > 1 && (
              <div className="seller-page-picker-chunks">
                <button
                  disabled={pickerChunk === 0}
                  onClick={() =>
                    setPickerChunk(
                      (c) => c - 1
                    )
                  }
                >
                  <ChevronLeft size={14} />
                  Trang{" "}
                  {Math.max(
                    1,
                    chunkStart -
                      PAGES_PER_CHUNK
                  )}
                  –{chunkStart - 1}
                </button>

                <span>
                  Trang {chunkStart}–
                  {chunkEnd}
                </span>

                <button
                  disabled={
                    pickerChunk >=
                    totalChunks - 1
                  }
                  onClick={() =>
                    setPickerChunk(
                      (c) => c + 1
                    )
                  }
                >
                  Trang {chunkEnd + 1}–
                  {Math.min(
                    totalPages,
                    chunkEnd +
                      PAGES_PER_CHUNK
                  )}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            <div className="seller-page-picker-grid">
              {chunkPages.map((pg) => (
                <button
                  key={pg}
                  className={
                    pg === currentPage
                      ? "is-current"
                      : ""
                  }
                  onClick={() => {
                    onPageChange(pg);
                    setShowPagePicker(false);
                  }}
                >
                  {pg}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

export const SellerDashboard = ({
  section,
  onRefreshProducts,
}) => {
  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [feedback, setFeedback] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    productFormOpen,
    setProductFormOpen,
  ] = useState(false);

  const [
    categoryInputMode,
    setCategoryInputMode,
  ] = useState("manual");

  const [
    categoryCreateOpen,
    setCategoryCreateOpen,
  ] = useState(false);

  const [
    newCategoryName,
    setNewCategoryName,
  ] = useState("");

  const [
    editingProduct,
    setEditingProduct,
  ] = useState(null);

  const [sizeText, setSizeText] =
    useState("");

  const [colorMap, setColorMap] =
    useState({});

  const [
    isProcessingImages,
    setIsProcessingImages,
  ] = useState(false);

  const [productForm, setProductForm] =
    useState({
      name: "",
      images: [],
      price: "",
      categoryName: "",
    });

  const [
    editingOrder,
    setEditingOrder,
  ] = useState(null);

  const [orderForm, setOrderForm] =
    useState({});

  const [
    editingCategoryId,
    setEditingCategoryId,
  ] = useState(null);

  const [
    categoryNameDraft,
    setCategoryNameDraft,
  ] = useState("");

  const [
    activeOrderStatus,
    setActiveOrderStatus,
  ] = useState("PENDING");

  const [
    isExportMenuOpen,
    setIsExportMenuOpen,
  ] = useState(false);

  // Pagination state
  const [productPage, setProductPage] =
    useState(1);

  const [orderPage, setOrderPage] =
    useState(1);

  // ─── Per-action loading states ──────────────────────────────────────────

  const [
    savingProduct,
    setSavingProduct,
  ] = useState(false);

  const [
    deletingProductId,
    setDeletingProductId,
  ] = useState(null);

  const [
    savingOrder,
    setSavingOrder,
  ] = useState(false);

  const [
    savingCategoryId,
    setSavingCategoryId,
  ] = useState(null);

  const [
    savingNewCategory,
    setSavingNewCategory,
  ] = useState(false);

  const [
    deletingCategoryId,
    setDeletingCategoryId,
  ] = useState(null);

  const [
    deletingOrderId,
    setDeletingOrderId,
  ] = useState(null);

  const [
    changingStatusId,
    setChangingStatusId,
  ] = useState(null);

  const refreshDashboard = async () => {
    setRefreshing(true);
    const [
      productResult,
      categoryResult,
      orderResult,
    ] = await loadSellerData();
    const failures = [];

    if (
      productResult.status === "fulfilled"
    ) {
      setProducts(
        productResult.value || []
      );
    } else {
      failures.push("sản phẩm");
    }

    if (
      categoryResult.status ===
      "fulfilled"
    ) {
      setCategories(
        categoryResult.value || []
      );
    } else {
      failures.push("danh mục");
    }

    if (
      orderResult.status === "fulfilled"
    ) {
      setOrders(orderResult.value || []);
    } else {
      failures.push("đơn hàng");
    }

    setLoading(false);
    setRefreshing(false);
    setError(
      failures.length
        ? `Không thể tải lại ${failures.join(", ")}. Vui lòng thử lại.`
        : ""
    );
    return failures.length === 0;
  };

  const handleRefresh = async () => {
    setFeedback("");
    const refreshed = await refreshDashboard();
    onRefreshProducts?.();
    if (refreshed) {
      setFeedback("Đã tải lại sản phẩm, danh mục và đơn hàng.");
    }
  };

  useEffect(() => {
    let active = true;

    loadSellerData().then(
      ([
        productResult,
        categoryResult,
        orderResult,
      ]) => {
        if (!active) return;

        if (
          productResult.status ===
          "fulfilled"
        ) {
          setProducts(
            productResult.value || []
          );
        }

        if (
          categoryResult.status ===
          "fulfilled"
        ) {
          setCategories(
            categoryResult.value || []
          );
        }

        if (
          orderResult.status ===
          "fulfilled"
        ) {
          setOrders(
            orderResult.value || []
          );
        } else {
          setError(
            "Không thể tải danh sách đơn hàng. Hãy kiểm tra quyền người bán."
          );
        }

        setLoading(false);
      }
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setOrderPage(1);
  }, [activeOrderStatus]);

  const hasTerminalOrders = orders.some(
    (order) => order.status === "COMPLETED" || order.status === "CANCELLED"
  );

  useEffect(() => {
    if (!hasTerminalOrders) return undefined;

    const refreshOrders = async () => {
      try {
        const latestOrders = await orderApi.getAll();
        setOrders(latestOrders || []);
      } catch (refreshError) {
        console.error("Không thể đồng bộ đơn đã hoàn thành/đã hủy:", refreshError);
        setError("Không thể đồng bộ danh sách đơn hàng. Hãy thử tải lại dữ liệu.");
      }
    };

    const intervalId = window.setInterval(refreshOrders, 60_000);
    return () => window.clearInterval(intervalId);
  }, [hasTerminalOrders]);

  const openNewProductForm = () => {
    setEditingProduct(null);

    setProductForm({
      name: "",
      images: [],
      price: "",
      categoryName: "",
    });

    setCategoryInputMode(
      categories.length
        ? "existing"
        : "manual"
    );

    setSizeText("S, M, L");
    setColorMap({});
    setProductFormOpen(true);
    setFeedback("");
    setError("");
  };

  const openEditProductForm = (
    product
  ) => {
    setEditingProduct(product);

    setProductForm({
      name: product.name || "",
      images: product.images?.length
        ? [...product.images]
        : product.imgUrl
          ? [product.imgUrl]
          : [],
      price: product.price || "",
      categoryName:
        product.categoryName || "",
    });

    setCategoryInputMode(
      categories.some(
        (category) =>
          category.name ===
          product.categoryName
      )
        ? "existing"
        : "manual"
    );

    setSizeText(
      getUniqueSizes(product).join(", ")
    );

    const map = {};

    (product.variants || []).forEach(
      (variant) => {
        if (
          variant.size &&
          variant.color
        ) {
          map[variant.size] =
            variant.color;
        }
      }
    );

    setColorMap(map);
    setProductFormOpen(true);
    setFeedback("");
    setError("");
  };

  // ─── Upload nhiều ảnh ───────────────────────────────────────────────────

  const uploadProductImages = async (
    files
  ) => {
    const selectedFiles = Array.from(
      files || []
    ).filter(
      (file) => file instanceof File
    );

    if (!selectedFiles.length) return;

    if (isProcessingImages) return;

    const remainingSlots =
      MAX_PRODUCT_IMAGES -
      productForm.images.length;

    if (remainingSlots <= 0) {
      setError(
        `Một sản phẩm chỉ được tối đa ${MAX_PRODUCT_IMAGES} ảnh.`
      );
      return;
    }

    if (
      selectedFiles.length >
      remainingSlots
    ) {
      setError(
        `Bạn đang chọn ${selectedFiles.length} ảnh nhưng chỉ còn ${remainingSlots} vị trí. Một sản phẩm tối đa ${MAX_PRODUCT_IMAGES} ảnh.`
      );
      return;
    }

    const invalidFile =
      selectedFiles.find(
        (file) =>
          !file.type.startsWith(
            "image/"
          )
      );

    if (invalidFile) {
      setError(
        `"${invalidFile.name}" không phải là tệp hình ảnh.`
      );
      return;
    }

    const oversized =
      selectedFiles.find(
        (file) =>
          file.size >
          12 * 1024 * 1024
      );

    if (oversized) {
      setError(
        `"${oversized.name}" lớn hơn 12 MB. Mỗi ảnh cần nhỏ hơn 12 MB.`
      );
      return;
    }

    setIsProcessingImages(true);
    setError("");

    try {
      const urls = await Promise.all(
        selectedFiles.map((file) =>
          uploadApi.uploadImage(file)
        )
      );

      setProductForm((current) => ({
        ...current,
        images: [
          ...current.images,
          ...urls,
        ],
      }));
    } catch (imageError) {
      setError(
        imageError.message ||
          "Không thể upload ảnh. Vui lòng thử lại."
      );
    } finally {
      setIsProcessingImages(false);
    }
  };

  // Chọn nhiều ảnh bằng nút
  const addProductImages = async (
    event
  ) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    await uploadProductImages(
      selectedFiles
    );
  };

  // Kéo thả nhiều ảnh
  const handleImageDrop = async (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (isProcessingImages) return;

    const droppedFiles = Array.from(
      event.dataTransfer?.files || []
    );

    await uploadProductImages(
      droppedFiles
    );
  };

  const handleImageDragOver = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect =
        "copy";
    }
  };

  // Ctrl+C ảnh trong Windows -> Ctrl+V vào trang
  useEffect(() => {
    if (!productFormOpen) {
      return undefined;
    }

    const handlePaste = (event) => {
      if (isProcessingImages) return;

      const clipboardItems =
        Array.from(
          event.clipboardData?.items ||
            []
        );

      const imageFiles =
        clipboardItems
          .filter(
            (item) =>
              item.kind === "file" &&
              item.type.startsWith(
                "image/"
              )
          )
          .map((item) =>
            item.getAsFile()
          )
          .filter(Boolean);

      if (!imageFiles.length) {
        return;
      }

      event.preventDefault();

      uploadProductImages(
        imageFiles
      );
    };

    window.addEventListener(
      "paste",
      handlePaste
    );

    return () => {
      window.removeEventListener(
        "paste",
        handlePaste
      );
    };
  }, [
    productFormOpen,
    productForm.images.length,
    isProcessingImages,
  ]);

  const removeProductImage = (
    imageIndex
  ) => {
    setProductForm((current) => ({
      ...current,
      images: current.images.filter(
        (_, index) =>
          index !== imageIndex
      ),
    }));
  };

  const saveProduct = async (
    event
  ) => {
    event.preventDefault();

    const sizes = [
      ...new Set(
        sizeText
          .split(",")
          .map((size) =>
            size.trim()
          )
          .filter(Boolean)
      ),
    ];

    const price = Number(
      productForm.price
    );

    if (
      !productForm.name.trim() ||
      !productForm.images.length ||
      !price ||
      !sizes.length ||
      !productForm.categoryName.trim()
    ) {
      setError(
        "Vui lòng nhập tên, chọn ít nhất một ảnh, giá, danh mục và kích cỡ."
      );
      return;
    }

    setSavingProduct(true);

    try {
      let category =
        categories.find(
          (item) =>
            item.name
              .trim()
              .toLocaleLowerCase(
                "vi"
              ) ===
            productForm.categoryName
              .trim()
              .toLocaleLowerCase(
                "vi"
              )
        );

      if (!category) {
        category =
          await categoryApi.create({
            name: productForm.categoryName.trim(),
          });
      }

      if (!category?.id) {
        throw new Error(
          "Không thể tạo danh mục mới."
        );
      }

      const variants = sizes.map(
        (size, index) => {
          const previous =
            editingProduct?.variants?.find(
              (variant) =>
                variant.size === size
            );

          return {
            size,
            color:
              colorMap[
                size
              ]?.trim() ||
              previous?.color ||
              "Mặc định",
            price,
            stock:
              previous?.stock ?? 100,
            sku:
              previous?.sku ||
              `SKU-${Date.now()}-${index}`,
            imgUrl:
              previous?.imgUrl || "",
          };
        }
      );

      const payload = {
        name: productForm.name.trim(),
        price,
        categoryId: Number(
          category.id
        ),
        categoryName: category.name,
        images: productForm.images,
        imgUrl:
          productForm.images[0] || "",
        isPublished: true,
        variants,
      };

      if (editingProduct) {
        await productApi.update(
          editingProduct.id,
          payload
        );
      } else {
        await productApi.create(
          payload
        );
      }

      await refreshDashboard();

      onRefreshProducts?.();

      setProductFormOpen(false);

      setFeedback(
        editingProduct
          ? "Đã cập nhật sản phẩm."
          : "Đã thêm sản phẩm vào cửa hàng."
      );

      setError("");
    } catch (saveError) {
      setError(
        saveError.message ||
          "Không thể lưu sản phẩm."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (
    product
  ) => {
    setDeletingProductId(
      product.id
    );

    try {
      await productApi.delete(
        product.id
      );

      await refreshDashboard();

      onRefreshProducts?.();

      setFeedback(
        "Đã xóa sản phẩm."
      );
    } catch (deleteError) {
      setError(
        deleteError.message ||
          "Không thể xóa sản phẩm."
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  const saveCategory = async (
    event,
    category
  ) => {
    event.preventDefault();

    const name =
      categoryNameDraft.trim();

    if (!name) {
      setError(
        "Tên danh mục không được để trống."
      );
      return;
    }

    setSavingCategoryId(
      category.id
    );

    setError("");

    try {
      await categoryApi.update(
        category.id,
        { name }
      );

      setEditingCategoryId(null);
      setCategoryNameDraft("");

      await refreshDashboard();

      onRefreshProducts?.();

      setFeedback(
        "Đã cập nhật danh mục."
      );
    } catch (saveError) {
      setError(
        saveError.message ||
          "Không thể cập nhật danh mục."
      );
    } finally {
      setSavingCategoryId(null);
    }
  };

  const createCategory = async (
    event
  ) => {
    event.preventDefault();

    const name =
      newCategoryName.trim();

    if (!name) {
      setError(
        "Tên danh mục không được để trống."
      );
      return;
    }

    if (
      categories.some(
        (category) =>
          category.name
            .trim()
            .toLocaleLowerCase(
              "vi"
            ) ===
          name.toLocaleLowerCase(
            "vi"
          )
      )
    ) {
      setError(
        "Danh mục này đã tồn tại."
      );
      return;
    }

    setSavingNewCategory(true);
    setError("");

    try {
      await categoryApi.create({
        name,
      });

      setNewCategoryName("");
      setCategoryCreateOpen(false);

      await refreshDashboard();

      onRefreshProducts?.();

      setFeedback(
        "Đã thêm danh mục."
      );
    } catch (saveError) {
      setError(
        saveError.message ||
          "Không thể thêm danh mục."
      );
    } finally {
      setSavingNewCategory(false);
    }
  };

  const deleteCategory = async (
    category
  ) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa danh mục "${category.name}"? Nếu danh mục đang được sản phẩm sử dụng, hệ thống có thể từ chối thao tác này.`
      )
    ) {
      return;
    }

    setDeletingCategoryId(
      category.id
    );

    setError("");

    try {
      await categoryApi.delete(
        category.id
      );

      await refreshDashboard();

      onRefreshProducts?.();

      setFeedback(
        "Đã xóa danh mục."
      );
    } catch (deleteError) {
      setError(
        deleteError.message ||
          "Không thể xóa danh mục."
      );
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const openEditOrder = (order) => {
    setEditingOrder(order);

    setOrderForm({
      customerName:
        order.customerName || "",
      customerAddress:
        order.customerAddress || "",
      customerPhone:
        order.customerPhone || "",
      customerEmail:
        order.customerEmail || "",
    });
  };

  const saveOrder = async (
    event
  ) => {
    event.preventDefault();

    setSavingOrder(true);

    try {
      await orderApi.update(
        editingOrder.id,
        orderForm
      );

      setEditingOrder(null);

      await refreshDashboard();

      setFeedback(
        "Đã cập nhật đơn hàng."
      );
    } catch (saveError) {
      setError(
        saveError.message ||
          "Không thể cập nhật đơn hàng."
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const deleteOrder = async (
    order
  ) => {
    setDeletingOrderId(order.id);

    try {
      await orderApi.delete(
        order.id
      );

      await refreshDashboard();

      setFeedback(
        "Đã xóa đơn hàng."
      );
    } catch (deleteError) {
      setError(
        deleteError.message ||
          "Không thể xóa đơn hàng."
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  const changeOrderStatus = async (
    order,
    status
  ) => {
    setChangingStatusId(
      order.id + "-" + status
    );

    try {
      await orderApi.update(
        order.id,
        { status }
      );

      await refreshDashboard();

      setFeedback(
        status === "CANCELLED"
          ? "Đã hủy đơn hàng."
          : "Đã chuyển trạng thái đơn hàng."
      );
    } catch (statusError) {
      setError(
        statusError.message ||
          "Không thể chuyển trạng thái đơn hàng."
      );
    } finally {
      setChangingStatusId(null);
    }
  };

  const filteredOrders =
    orders.filter(
      (order) =>
        order.status ===
        activeOrderStatus
    );

  const productTotalPages =
    Math.max(
      1,
      Math.ceil(
        products.length /
          ITEMS_PER_PAGE
      )
    );

  const pagedProducts =
    products.slice(
      (productPage - 1) *
        ITEMS_PER_PAGE,
      productPage *
        ITEMS_PER_PAGE
    );

  const orderTotalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOrders.length /
          ITEMS_PER_PAGE
      )
    );

  const pagedOrders =
    filteredOrders.slice(
      (orderPage - 1) *
        ITEMS_PER_PAGE,
      orderPage *
        ITEMS_PER_PAGE
    );

  const exportOrders = (mode) => {
    const exportRows =
      mode === "page"
        ? pagedOrders
        : mode === "section"
          ? filteredOrders
          : orders;

    if (!exportRows.length) return;

    const statusSlug = {
      PENDING: "choxacnhan",
      CONFIRMED: "daxacnhan",
      SHIPPED: "danggiao",
      COMPLETED: "dahoanthanh",
      CANCELLED: "dahuy",
    }[activeOrderStatus];

    const filePrefix =
      mode === "all"
        ? "tatca"
        : `${statusSlug}${
            mode === "page"
              ? String(
                  orderPage
                ).padStart(2, "0")
              : ""
          }`;

    const fileName =
      `${filePrefix}_${getExportDate()}.xls`;

    const workbook =
      createExcelWorkbook(
        exportRows
      );

    const blob = new Blob(
      ["\uFEFF", workbook],
      {
        type: "application/vnd.ms-excel;charset=utf-8",
      }
    );

    const downloadUrl =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();
    link.remove();

    window.setTimeout(
      () =>
        URL.revokeObjectURL(
          downloadUrl
        ),
      1000
    );

    setIsExportMenuOpen(false);
  };

  return (
    <section className="seller-dashboard">
      <div className="seller-dashboard-heading">
        <h1>
          {section === "orders"
            ? "Đơn hàng đã đặt"
            : section ===
                "categories"
              ? "Quản lý danh mục"
              : "Quản lý sản phẩm"}
        </h1>

        <div className="seller-heading-actions">
          <button
            type="button"
            className="seller-refresh-button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label="Tải lại sản phẩm, danh mục và đơn hàng"
            title="Tải lại sản phẩm, danh mục và đơn hàng"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "is-spinning" : ""}
            />
            <span>{refreshing ? "Đang tải..." : "Tải lại dữ liệu"}</span>
          </button>

        {section === "products" &&
          !productFormOpen && (
            <button
              className="seller-primary-button"
              onClick={
                openNewProductForm
              }
            >
              <PackagePlus
                size={17}
              />
              <span>
                Thêm sản phẩm
              </span>
            </button>
          )}

        {section ===
          "categories" && (
          <button
            type="button"
            className="seller-primary-button"
            onClick={() => {
              setCategoryCreateOpen(
                (open) => !open
              );

              setNewCategoryName(
                ""
              );

              setError("");
            }}
          >
            <Plus size={17} />
            <span>
              Thêm danh mục
            </span>
          </button>
        )}

        {section === "orders" && (
          <div className="seller-export">
            <button
              type="button"
              className="seller-export-trigger"
              aria-expanded={
                isExportMenuOpen
              }
              aria-haspopup="menu"
              onClick={() =>
                setIsExportMenuOpen(
                  (open) => !open
                )
              }
            >
              <Download size={16} />
              <span>
                Tải file Excel
              </span>
            </button>

            {isExportMenuOpen && (
              <div
                className="seller-export-menu"
                role="menu"
                aria-label="Tùy chọn tải Excel"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    exportOrders(
                      "page"
                    )
                  }
                  disabled={
                    !pagedOrders.length
                  }
                >
                  Tải 1 trang (
                  {orderPage})
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    exportOrders(
                      "section"
                    )
                  }
                  disabled={
                    !filteredOrders.length
                  }
                >
                  Tải 1 phần (tất
                  cả trang)
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    exportOrders(
                      "all"
                    )
                  }
                  disabled={
                    !orders.length
                  }
                >
                  Tải tất cả
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {feedback && (
        <p
          className="seller-feedback"
          role="status"
        >
          <Check size={16} />
          {feedback}
        </p>
      )}

      {error && (
        <p
          className="seller-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {section === "categories" &&
        categoryCreateOpen && (
          <form
            className="seller-category-create"
            onSubmit={
              createCategory
            }
          >
            <label>
              <span>
                Tên danh mục mới
              </span>

              <input
                autoFocus
                required
                maxLength={100}
                value={
                  newCategoryName
                }
                onChange={(
                  event
                ) =>
                  setNewCategoryName(
                    event.target
                      .value
                  )
                }
                placeholder="Ví dụ: Áo bóng đá"
              />
            </label>

            <div className="seller-category-actions">
              <button
                type="button"
                className="seller-secondary-button"
                onClick={() =>
                  setCategoryCreateOpen(
                    false
                  )
                }
                disabled={
                  savingNewCategory
                }
              >
                Hủy
              </button>

              <button
                type="submit"
                className="seller-primary-button"
                disabled={
                  savingNewCategory
                }
              >
                {savingNewCategory ? (
                  <Spinner
                    size={15}
                  />
                ) : (
                  <Save size={15} />
                )}

                <span>
                  Lưu danh mục
                </span>
              </button>
            </div>
          </form>
        )}

      {section === "products" &&
        (productFormOpen ? (
          <form
            className="seller-form"
            onSubmit={saveProduct}
          >
            <div className="seller-form-heading">
              <h2>
                {editingProduct
                  ? "Sửa sản phẩm"
                  : "Thêm sản phẩm"}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setProductFormOpen(
                    false
                  )
                }
                aria-label="Đóng biểu mẫu"
              >
                <X size={19} />
              </button>
            </div>

            <label>
              <span>
                Tên sản phẩm
              </span>

              <input
                required
                value={
                  productForm.name
                }
                onChange={(
                  event
                ) =>
                  setProductForm({
                    ...productForm,
                    name: event
                      .target.value,
                  })
                }
              />
            </label>

            {/* ─── Upload ảnh mới ─── */}

            <label className="seller-image-upload-label">
              <span>
                Ảnh sản phẩm (
                {
                  productForm
                    .images.length
                }
                /
                {
                  MAX_PRODUCT_IMAGES
                }
                )
              </span>

              <div
                className={`seller-image-drop-zone ${
                  isProcessingImages
                    ? "is-processing"
                    : ""
                }`}
                onDrop={
                  handleImageDrop
                }
                onDragOver={
                  handleImageDragOver
                }
              >
                <div className="seller-image-drop-icon">
                  {isProcessingImages ? (
                    <Spinner
                      size={26}
                    />
                  ) : (
                    <ImagePlus
                      size={26}
                    />
                  )}
                </div>

                <strong>
                  {isProcessingImages
                    ? "Đang tải ảnh lên..."
                    : "Kéo và thả nhiều ảnh vào đây"}
                </strong>

                <p>
                  Hoặc chọn nhiều
                  ảnh trong thư mục
                  Windows, nhấn{" "}
                  <kbd>Ctrl</kbd> +{" "}
                  <kbd>C</kbd>, quay
                  lại đây rồi nhấn{" "}
                  <kbd>Ctrl</kbd> +{" "}
                  <kbd>V</kbd>
                </p>

                <span className="seller-image-drop-or">
                  hoặc
                </span>

                <div className="seller-image-select-button">
                  <ImagePlus
                    size={16}
                  />

                  <span>
                    Chọn nhiều ảnh
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={
                      isProcessingImages ||
                      productForm
                        .images
                        .length >=
                        MAX_PRODUCT_IMAGES
                    }
                    onChange={
                      addProductImages
                    }
                  />
                </div>

                <small>
                  Tối đa{" "}
                  {
                    MAX_PRODUCT_IMAGES
                  }{" "}
                  ảnh · Mỗi ảnh dưới
                  12 MB · Ảnh đầu
                  tiên là ảnh bìa
                </small>
              </div>
            </label>

            {productForm.images
              .length > 0 && (
              <div className="seller-image-grid">
                {productForm.images.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      className="seller-image-preview-wrap"
                      key={`${index}-${image.slice(
                        -24
                      )}`}
                    >
                      <img
                        className="seller-image-preview"
                        src={image}
                        alt={`Ảnh sản phẩm ${
                          index + 1
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeProductImage(
                            index
                          )
                        }
                        aria-label={`Xóa ảnh ${
                          index + 1
                        }`}
                        title="Xóa ảnh"
                      >
                        <X
                          size={15}
                        />
                      </button>

                      {index === 0 && (
                        <span>
                          Ảnh bìa
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            <div className="seller-form-row">
              <label>
                <span>
                  Giá bán (VND)
                </span>

                <input
                  type="number"
                  min="1"
                  required
                  value={
                    productForm.price
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm({
                      ...productForm,
                      price:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Danh mục
                </span>

                {categories.length >
                  0 && (
                  <select
                    value={
                      categoryInputMode ===
                      "manual"
                        ? "__manual__"
                        : productForm.categoryName
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value;

                      if (
                        value ===
                        "__manual__"
                      ) {
                        setCategoryInputMode(
                          "manual"
                        );

                        setProductForm(
                          (
                            current
                          ) => ({
                            ...current,
                            categoryName:
                              "",
                          })
                        );
                      } else {
                        setCategoryInputMode(
                          "existing"
                        );

                        setProductForm(
                          (
                            current
                          ) => ({
                            ...current,
                            categoryName:
                              value,
                          })
                        );
                      }
                    }}
                  >
                    <option value="">
                      Chọn danh mục có
                      sẵn
                    </option>

                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.name
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}

                    <option value="__manual__">
                      Nhập tay danh mục
                      mới
                    </option>
                  </select>
                )}

                {(categoryInputMode ===
                  "manual" ||
                  categories.length ===
                    0) && (
                  <input
                    required
                    value={
                      productForm.categoryName
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm({
                        ...productForm,
                        categoryName:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Nhập tên danh mục"
                  />
                )}
              </label>
            </div>

            <label>
              <span>
                Kích cỡ (phân cách
                bằng dấu phẩy)
              </span>

              <input
                required
                value={sizeText}
                onChange={(
                  event
                ) =>
                  setSizeText(
                    event.target.value
                  )
                }
                placeholder="S, M, L, XL"
              />
            </label>

            {sizeText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean).length >
              0 && (
              <div className="seller-color-grid">
                <span className="seller-color-grid-label">
                  Màu sắc theo size
                </span>

                {sizeText
                  .split(",")
                  .map((s) =>
                    s.trim()
                  )
                  .filter(Boolean)
                  .map((size) => (
                    <div
                      key={size}
                      className="seller-color-row"
                    >
                      <span className="seller-color-size-tag">
                        {size}
                      </span>

                      <input
                        type="text"
                        placeholder="VD: Đen, Trắng, Xám..."
                        value={
                          colorMap[
                            size
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          setColorMap(
                            (
                              previous
                            ) => ({
                              ...previous,
                              [size]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </div>
                  ))}
              </div>
            )}

            <div className="seller-form-actions">
              <button
                type="button"
                className="seller-secondary-button"
                onClick={() =>
                  setProductFormOpen(
                    false
                  )
                }
                disabled={
                  savingProduct
                }
              >
                Hủy
              </button>

              <button
                type="submit"
                className="seller-primary-button"
                disabled={
                  savingProduct
                }
              >
                {savingProduct ? (
                  <Spinner
                    size={16}
                  />
                ) : (
                  <Save size={16} />
                )}

                <span>
                  {savingProduct
                    ? "Đang lưu..."
                    : "Lưu sản phẩm"}
                </span>
              </button>
            </div>
          </form>
        ) : loading ? (
          <p className="seller-empty">
            Đang tải sản phẩm...
          </p>
        ) : products.length === 0 ? (
          <p className="seller-empty">
            Chưa có sản phẩm.
          </p>
        ) : (
          <>
            <div className="seller-product-list">
              {pagedProducts.map(
                (product) => (
                  <article
                    className="seller-product-row"
                    key={product.id}
                  >
                    <img
                      src={
                        product.imgUrl
                      }
                      alt={
                        product.name
                      }
                    />

                    <div className="seller-product-details">
                      <h2>
                        {product.name.replace(
                          /\s+HUGAN\b/gi,
                          ""
                        )}
                      </h2>

                      <p>
                        {getUniqueSizes(
                          product
                        ).join(" · ") ||
                          "Chưa có size"}
                      </p>

                      <strong>
                        {formatCurrency(
                          product.price
                        )}
                      </strong>
                    </div>

                    <div className="seller-row-actions">
                      <button
                        onClick={() =>
                          openEditProductForm(
                            product
                          )
                        }
                        aria-label={`Sửa ${product.name}`}
                        title="Sửa"
                        disabled={
                          deletingProductId ===
                          product.id
                        }
                      >
                        <Edit3
                          size={17}
                        />
                      </button>

                      <button
                        onClick={() =>
                          deleteProduct(
                            product
                          )
                        }
                        aria-label={`Xóa ${product.name}`}
                        title="Xóa"
                        disabled={
                          deletingProductId ===
                          product.id
                        }
                      >
                        {deletingProductId ===
                        product.id ? (
                          <Spinner
                            size={17}
                          />
                        ) : (
                          <Trash2
                            size={17}
                          />
                        )}
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          </>
        ))}

      {section === "categories" &&
        (loading ? (
          <p className="seller-empty">
            Đang tải danh mục...
          </p>
        ) : categories.length ===
          0 ? (
          <p className="seller-empty">
            Chưa có danh mục nào.
          </p>
        ) : (
          <div className="seller-category-list">
            {categories.map(
              (category) => {
                const productCount =
                  products.filter(
                    (product) =>
                      Number(
                        product.categoryId
                      ) ===
                      Number(
                        category.id
                      )
                  ).length;

                const isEditing =
                  editingCategoryId ===
                  category.id;

                return (
                  <article
                    className="seller-category-card"
                    key={
                      category.id
                    }
                  >
                    {isEditing ? (
                      <form
                        className="seller-category-edit"
                        onSubmit={(
                          event
                        ) =>
                          saveCategory(
                            event,
                            category
                          )
                        }
                      >
                        <label>
                          <span>
                            Tên danh
                            mục
                          </span>

                          <input
                            autoFocus
                            required
                            maxLength={
                              100
                            }
                            value={
                              categoryNameDraft
                            }
                            onChange={(
                              event
                            ) =>
                              setCategoryNameDraft(
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </label>

                        <div className="seller-category-actions">
                          <button
                            type="button"
                            className="seller-secondary-button"
                            onClick={() => {
                              setEditingCategoryId(
                                null
                              );

                              setCategoryNameDraft(
                                ""
                              );
                            }}
                            disabled={
                              savingCategoryId ===
                              category.id
                            }
                          >
                            Hủy
                          </button>

                          <button
                            type="submit"
                            className="seller-primary-button"
                            disabled={
                              savingCategoryId ===
                              category.id
                            }
                          >
                            {savingCategoryId ===
                            category.id ? (
                              <Spinner
                                size={
                                  15
                                }
                              />
                            ) : (
                              <Save
                                size={
                                  15
                                }
                              />
                            )}

                            <span>
                              Lưu
                            </span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="seller-category-info">
                          <h2>
                            {
                              category.name
                            }
                          </h2>

                          <p>
                            {
                              productCount
                            }{" "}
                            sản phẩm
                          </p>
                        </div>

                        <div className="seller-category-actions">
                          <button
                            type="button"
                            className="seller-secondary-button"
                            onClick={() => {
                              setEditingCategoryId(
                                category.id
                              );

                              setCategoryNameDraft(
                                category.name ||
                                  ""
                              );

                              setError(
                                ""
                              );
                            }}
                          >
                            <Edit3
                              size={15}
                            />

                            <span>
                              Sửa
                            </span>
                          </button>

                          <button
                            type="button"
                            className="seller-category-delete"
                            onClick={() =>
                              deleteCategory(
                                category
                              )
                            }
                            disabled={
                              deletingCategoryId ===
                              category.id
                            }
                          >
                            {deletingCategoryId ===
                            category.id ? (
                              <Spinner
                                size={
                                  15
                                }
                              />
                            ) : (
                              <Trash2
                                size={
                                  15
                                }
                              />
                            )}

                            <span>
                              Xóa
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              }
            )}
          </div>
        ))}

      {section === "orders" && (
        <>
          <div
            className="seller-order-status-tabs"
            role="tablist"
            aria-label="Lọc đơn theo trạng thái"
          >
            {ORDER_STATUSES.map(
              (status) => (
                <button
                  key={status.value}
                  role="tab"
                  aria-selected={
                    activeOrderStatus ===
                    status.value
                  }
                  className={
                    activeOrderStatus ===
                    status.value
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setActiveOrderStatus(
                      status.value
                    )
                  }
                >
                  <span>
                    {status.label}
                  </span>

                  <strong>
                    {
                      orders.filter(
                        (order) =>
                          order.status ===
                          status.value
                      ).length
                    }
                  </strong>
                </button>
              )
            )}
          </div>

          {loading ? (
            <p className="seller-empty">
              Đang tải đơn hàng...
            </p>
          ) : filteredOrders.length ===
            0 ? (
            <p className="seller-empty">
              Không có đơn ở trạng
              thái này.
            </p>
          ) : (
            <>
              <div className="seller-order-list">
                {pagedOrders.map(
                  (order) => (
                    <article
                      className="seller-order-card"
                      key={
                        order.id
                      }
                    >
                      <header className="seller-order-header">
                        <div>
                          <h2>
                            Đơn #
                            {
                              order.id
                            }
                          </h2>

                          <time>
                            {formatOrderDate(
                              order.createdAtEpoch,
                              order.createdAt
                            )}
                          </time>
                        </div>

                        <span
                          className={`seller-order-status seller-order-status--${order.status.toLowerCase()}`}
                        >
                          {ORDER_STATUSES.find(
                            (
                              status
                            ) =>
                              status.value ===
                              order.status
                          )?.label ||
                            order.status}
                        </span>
                        {(order.status === "COMPLETED" || order.status === "CANCELLED") &&
                          getOrderAutoDeleteAt(order) && (
                            <OrderDeletionCountdown
                              autoDeleteAt={getOrderAutoDeleteAt(order)}
                            />
                          )}
                      </header>

                      <div className="seller-order-customer">
                        <p>
                          <strong>
                            {
                              order.customerName
                            }
                          </strong>
                        </p>

                        <p>
                          {
                            order.customerPhone
                          }{" "}
                          ·{" "}
                          {
                            order.customerEmail
                          }
                        </p>

                        <p>
                          {
                            order.customerAddress
                          }
                        </p>
                      </div>

                      <div className="seller-order-lines">
                        {order.items.map(
                          (item) => (
                            <div
                              className="seller-order-line"
                              key={
                                item.id
                              }
                            >
                              <img
                                src={
                                  item.imgUrl
                                }
                                alt={
                                  item.productName
                                }
                              />

                              <span>
                                {item.productName.replace(
                                  /\s+HUGAN\b/gi,
                                  ""
                                )}{" "}
                                ·{" "}
                                {
                                  item.size
                                }{" "}
                                ·{" "}
                                {
                                  item.color
                                }{" "}
                                ×{" "}
                                {
                                  item.quantity
                                }
                              </span>

                              <strong>
                                {formatCurrency(
                                  item.subtotal
                                )}
                              </strong>
                            </div>
                          )
                        )}
                      </div>

                      <footer className="seller-order-footer">
                        <strong>
                          Tổng{" "}
                          {formatCurrency(
                            order.totalPrice
                          )}
                        </strong>

                        <div className="seller-order-actions">
                          {order.status ===
                            "PENDING" && (
                            <button
                              className="seller-order-next"
                              onClick={() =>
                                changeOrderStatus(
                                  order,
                                  "CONFIRMED"
                                )
                              }
                              disabled={
                                !!changingStatusId
                              }
                            >
                              {changingStatusId ===
                              order.id +
                                "-CONFIRMED" ? (
                                <Spinner
                                  size={
                                    14
                                  }
                                />
                              ) : null}

                              Xác nhận đơn
                            </button>
                          )}

                          {order.status ===
                            "CONFIRMED" && (
                            <button
                              className="seller-order-next"
                              onClick={() =>
                                changeOrderStatus(
                                  order,
                                  "SHIPPED"
                                )
                              }
                              disabled={
                                !!changingStatusId
                              }
                            >
                              {changingStatusId ===
                              order.id +
                                "-SHIPPED" ? (
                                <Spinner
                                  size={
                                    14
                                  }
                                />
                              ) : null}

                              Bắt đầu giao
                            </button>
                          )}

                          {order.status ===
                            "SHIPPED" && (
                            <button
                              className="seller-order-next"
                              onClick={() =>
                                changeOrderStatus(
                                  order,
                                  "COMPLETED"
                                )
                              }
                              disabled={
                                !!changingStatusId
                              }
                            >
                              {changingStatusId ===
                              order.id +
                                "-COMPLETED" ? (
                                <Spinner
                                  size={
                                    14
                                  }
                                />
                              ) : null}

                              Hoàn thành
                            </button>
                          )}

                          {![
                            "COMPLETED",
                            "CANCELLED",
                          ].includes(
                            order.status
                          ) && (
                            <button
                              className="seller-order-cancel"
                              onClick={() =>
                                changeOrderStatus(
                                  order,
                                  "CANCELLED"
                                )
                              }
                              disabled={
                                !!changingStatusId
                              }
                            >
                              {changingStatusId ===
                              order.id +
                                "-CANCELLED" ? (
                                <Spinner
                                  size={
                                    14
                                  }
                                />
                              ) : null}

                              Hủy đơn
                            </button>
                          )}

                          <div className="seller-row-actions">
                            <button
                              onClick={() =>
                                openEditOrder(
                                  order
                                )
                              }
                              aria-label={`Sửa đơn ${order.id}`}
                              title="Sửa thông tin"
                              disabled={
                                deletingOrderId ===
                                order.id
                              }
                            >
                              <Edit3
                                size={
                                  17
                                }
                              />
                            </button>

                            <button
                              onClick={() =>
                                deleteOrder(
                                  order
                                )
                              }
                              aria-label={`Xóa đơn ${order.id}`}
                              title="Xóa đơn"
                              disabled={
                                deletingOrderId ===
                                order.id
                              }
                            >
                              {deletingOrderId ===
                              order.id ? (
                                <Spinner
                                  size={
                                    17
                                  }
                                />
                              ) : (
                                <Trash2
                                  size={
                                    17
                                  }
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      </footer>
                    </article>
                  )
                )}
              </div>
            </>
          )}
        </>
      )}

      {(section === "products" ||
        section === "orders") && (
        <div className="seller-pagination-sticky">
          <Pagination
            currentPage={
              section === "orders"
                ? orderPage
                : productPage
            }
            totalPages={
              section === "orders"
                ? orderTotalPages
                : productTotalPages
            }
            onPageChange={(
              page
            ) => {
              if (
                section === "orders"
              ) {
                setOrderPage(page);
              } else {
                setProductPage(
                  page
                );
              }

              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });
            }}
          />
        </div>
      )}

      {editingOrder && (
        <div
          className="seller-dialog-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setEditingOrder(null);
            }
          }}
        >
          <form
            className="seller-form seller-order-edit-form"
            onSubmit={saveOrder}
          >
            <div className="seller-form-heading">
              <h2>
                Sửa đơn #
                {editingOrder.id}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditingOrder(null)
                }
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <label>
              <span>
                Họ tên người đặt
              </span>

              <input
                required
                value={
                  orderForm.customerName
                }
                onChange={(
                  event
                ) =>
                  setOrderForm({
                    ...orderForm,
                    customerName:
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              <span>
                Địa chỉ
              </span>

              <input
                required
                value={
                  orderForm.customerAddress
                }
                onChange={(
                  event
                ) =>
                  setOrderForm({
                    ...orderForm,
                    customerAddress:
                      event.target
                        .value,
                  })
                }
              />
            </label>

            <div className="seller-form-row">
              <label>
                <span>
                  Số điện thoại
                </span>

                <input
                  required
                  value={
                    orderForm.customerPhone
                  }
                  onChange={(
                    event
                  ) =>
                    setOrderForm({
                      ...orderForm,
                      customerPhone:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Email
                </span>

                <input
                  type="email"
                  required
                  value={
                    orderForm.customerEmail
                  }
                  onChange={(
                    event
                  ) =>
                    setOrderForm({
                      ...orderForm,
                      customerEmail:
                        event.target
                          .value,
                    })
                  }
                />
              </label>
            </div>

            <div className="seller-form-actions">
              <button
                type="button"
                className="seller-secondary-button"
                onClick={() =>
                  setEditingOrder(null)
                }
                disabled={
                  savingOrder
                }
              >
                Hủy
              </button>

              <button
                className="seller-primary-button"
                type="submit"
                disabled={
                  savingOrder
                }
              >
                {savingOrder ? (
                  <Spinner
                    size={16}
                  />
                ) : (
                  <Save size={16} />
                )}

                <span>
                  {savingOrder
                    ? "Đang lưu..."
                    : "Lưu thay đổi"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
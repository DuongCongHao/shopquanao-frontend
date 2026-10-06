import { useState } from "react";
import { ChevronDown } from "lucide-react";
import "./category-picker.css";

export const CategoryPicker = ({ categories, value, onChange, label = "Danh mục *", variant = "seller" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const addCategory = (name) => {
    const names = value.split(",").map((item) => item.trim()).filter(Boolean);
    if (!names.some((item) => item.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi"))) {
      names.push(name);
      onChange(names.join(", "));
    }
    setIsOpen(false);
  };

  return (
    <div className={`category-picker category-picker--${variant}`}>
      <label className="category-picker__label">{label}</label>
      <div className="category-picker__control">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nhập danh mục, ngăn cách bằng dấu phẩy"
          aria-label={label}
        />
        <button
          type="button"
          className="category-picker__toggle"
          aria-label="Chọn danh mục có sẵn"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <ChevronDown size={18} />
        </button>
        {isOpen && (
          <div className="category-picker__menu">
            {categories.length ? categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => addCategory(category.name)}
              >
                {category.name}
              </button>
            )) : (
              <span>Chưa có danh mục. Nhập tên để tạo mới.</span>
            )}
          </div>
        )}
      </div>
      <small>Chọn từ danh sách hoặc nhập tên mới. Phân cách nhiều danh mục bằng dấu phẩy.</small>
    </div>
  );
};

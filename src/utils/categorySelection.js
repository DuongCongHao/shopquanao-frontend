export function parseCategoryNames(value) {
  const names = value.split(",").map((name) => name.trim()).filter(Boolean);
  return names.filter((name, index) =>
    names.findIndex((candidate) =>
      candidate.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi")
    ) === index
  );
}

export async function resolveCategoryNames(value, categories, createCategory) {
  const names = parseCategoryNames(value);
  if (!names.length) {
    throw new Error("Vui lòng chọn hoặc nhập ít nhất một danh mục.");
  }

  const resolved = [];
  for (const name of names) {
    const existing = categories.find((category) =>
      category.name.trim().toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi")
    );
    const category = existing || await createCategory({ name });
    if (!category?.id) {
      throw new Error(`Không thể tạo danh mục "${name}".`);
    }
    resolved.push(category);
  }
  return resolved;
}

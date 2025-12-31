export const locales = ["en", "uk"] as const;
export type Locale = (typeof locales)[number];

export const translations = {
  en: {
    app: {
      name: "Uchtenka",
      tagline: "Receipt-first budget tracker",
      accent: "Accent",
      presets: "Presets",
    },
    nav: {
      dashboard: "Dashboard",
      scan: "Scan receipt",
      receipts: "All receipts",
      items: "All items",
    },
    dashboard: {
      title: "Budget command center",
      subtitle: "Track spending, savings, and trends from every receipt.",
      cards: {
        totalSpent: "Spent this month",
        savedThisMonth: "Saved this month",
        averageReceipt: "Average receipt",
        receipts: "Receipts",
        items: "All items",
      },
      charts: {
        spendVsSaved: "Spending vs savings",
        categories: "Category focus",
        trend: "Monthly trend",
        savingsRate: "Savings rate",
        daily: "Daily spending",
        monthly: "Monthly spending",
      },
      stats: {
        savedTotal: "Total saved",
        largestReceipt: "Largest receipt",
      },
      hints: {
        receipts: "receipts",
        savedOnDiscounts: "On discounts",
        itemsHistory: "Tap for price history",
      },
      filters: {
        allMonths: "All months",
        allCategories: "All categories",
        allStores: "All stores",
      },
    },
    scan: {
      title: "Scan a receipt",
      hint: "Upload a photo and let the OCR model parse the line items.",
      upload: "Select image",
      uploadLabel: "Receipt photo",
      uploadHint: "PNG, JPG, or HEIC. Use a clear, well-lit photo.",
      fileSelected: "Selected:",
      analyze: "Analyze receipt",
      processing: "Analyzing receipt...",
      ocrReady: "New OCR result is ready.",
      applyOcr: "Apply OCR result",
      keepDraft: "Keep current edits",
      review: "Review and save the receipt.",
      success: "Receipt saved. Items were added to All items.",
      failure: "Could not parse the receipt. Try a clearer photo.",
      viewReceipts: "Go to receipts",
      previewTitle: "Scanned items",
      previewEmpty: "Upload a receipt to see a preview here.",
      detailsTitle: "Receipt details",
      summaryTitle: "Receipt summary",
      totalsTitle: "Totals",
      itemsTitle: "Items",
      save: "Save receipt",
      saving: "Saving...",
      addItem: "Add item",
      removeItem: "Remove",
      recalculate: "Recalculate totals",
      edit: "Edit",
      closeEdit: "Hide editor",
      storeLabel: "Store",
      dateLabel: "Date",
      currencyLabel: "Currency",
      subtotalLabel: "Subtotal",
      discountItemsLabel: "Item discounts",
      discountReceiptLabel: "Receipt discount",
      discountTotalLabel: "Total discount",
      totalLabel: "Total",
      paymentMethodLabel: "Payment method",
      rawNameLabel: "Raw name",
      nameLabel: "Name",
      categoryLabel: "Category",
      quantityLabel: "Quantity",
      unitLabel: "Unit",
      unitPriceLabel: "Unit price",
      lineTotalLabel: "Line total",
      discountLabel: "Line discount",
    },
    receipts: {
      title: "All receipts",
      empty: "No receipts yet. Scan your first receipt to get started.",
      items: "Items",
      subtotal: "Subtotal",
      discount: "Discount",
      total: "Total",
      payment: "Payment",
      edit: "Edit",
      delete: "Delete",
      confirmDelete: "Delete this receipt?",
    },
    items: {
      title: "All items",
      empty: "No items yet. Scan a receipt first.",
      lastPrice: "Last price",
      store: "Store",
      history: "Price history",
      back: "Back",
    },
    filters: {
      store: "Store",
      allStores: "All stores",
      search: "Search",
    },
    categories: {
      grocery: "Grocery",
      household: "Household",
      electronics: "Electronics",
      entertainment: "Entertainment",
      transport: "Transport",
      other: "Other",
    },
    general: {
      loading: "Loading...",
      noData: "No data",
    },
  },
  uk: {
    app: {
      name: "Uchtenka",
      tagline: "Бюджет на основі чеків",
      accent: "Акцент",
      presets: "Пресети",
    },
    nav: {
      dashboard: "Дашборд",
      scan: "Сканувати чек",
      receipts: "Усі чеки",
      items: "Усі товари",
    },
    dashboard: {
      title: "Центр бюджету",
      subtitle: "Контролюйте витрати, економію та тренди з кожного чека.",
      cards: {
        totalSpent: "Витрачено цього місяця",
        savedThisMonth: "Зекономлено цього місяця",
        averageReceipt: "Середній чек",
        receipts: "Чеки",
        items: "Усі товари",
      },
      charts: {
        spendVsSaved: "Витрати та економія",
        categories: "Фокус категорій",
        trend: "Місячний тренд",
        savingsRate: "Рівень економії",
        daily: "Витрати по днях",
        monthly: "Витрати по місяцях",
      },
      stats: {
        savedTotal: "Всього зекономлено",
        largestReceipt: "Найбільший чек",
      },
      hints: {
        receipts: "чеків",
        savedOnDiscounts: "На знижках",
        itemsHistory: "Натисніть для історії цін",
      },
      filters: {
        allMonths: "Усі місяці",
        allCategories: "Усі категорії",
        allStores: "Усі магазини",
      },
    },
    scan: {
      title: "Сканувати чек",
      hint: "Завантажте фото, і OCR розпізнає позиції.",
      upload: "Обрати зображення",
      uploadLabel: "Фото чека",
      uploadHint: "PNG, JPG або HEIC. Зробіть чітке фото при доброму світлі.",
      fileSelected: "Обрано:",
      analyze: "Проаналізувати чек",
      processing: "Аналізуємо чек...",
      ocrReady: "Нові результати OCR готові.",
      applyOcr: "Застосувати OCR",
      keepDraft: "Залишити поточні правки",
      review: "Перевірте та збережіть чек.",
      success: "Чек збережено. Товари додані до списку.",
      failure: "Не вдалося розпізнати чек. Спробуйте чіткіше фото.",
      viewReceipts: "Перейти до чеків",
      previewTitle: "Відскановані товари",
      previewEmpty: "Завантажте чек, щоб побачити попередній перегляд.",
      detailsTitle: "Деталі чека",
      summaryTitle: "Підсумок чека",
      totalsTitle: "Підсумки",
      itemsTitle: "Товари",
      save: "Зберегти чек",
      saving: "Збереження...",
      addItem: "Додати товар",
      removeItem: "Видалити",
      recalculate: "Перерахувати підсумки",
      edit: "Виправити",
      closeEdit: "Згорнути",
      storeLabel: "Магазин",
      dateLabel: "Дата",
      currencyLabel: "Валюта",
      subtotalLabel: "Проміжний підсумок",
      discountItemsLabel: "Знижки на товари",
      discountReceiptLabel: "Знижка на чек",
      discountTotalLabel: "Загальна знижка",
      totalLabel: "Разом",
      paymentMethodLabel: "Спосіб оплати",
      rawNameLabel: "Як у чеку",
      nameLabel: "Назва",
      categoryLabel: "Категорія",
      quantityLabel: "Кількість",
      unitLabel: "Одиниця",
      unitPriceLabel: "Ціна за од.",
      lineTotalLabel: "Сума рядка",
      discountLabel: "Знижка рядка",
    },
    receipts: {
      title: "Усі чеки",
      empty: "Ще немає чеків. Додайте перший.",
      items: "Товари",
      subtotal: "Проміжний підсумок",
      discount: "Знижка",
      total: "Разом",
      payment: "Оплата",
      edit: "Редагувати",
      delete: "Видалити",
      confirmDelete: "Видалити цей чек?",
    },
    items: {
      title: "Усі товари",
      empty: "Поки що немає товарів. Скануйте чек.",
      lastPrice: "Остання ціна",
      store: "Магазин",
      history: "Історія цін",
      back: "Назад",
    },
    filters: {
      store: "Магазин",
      allStores: "Усі магазини",
      search: "Пошук",
    },
    categories: {
      grocery: "Продукти",
      household: "Побут",
      electronics: "Техніка",
      entertainment: "Розваги",
      transport: "Транспорт",
      other: "Інше",
    },
    general: {
      loading: "Завантаження...",
      noData: "Немає даних",
    },
  },
} as const;

export function translate(locale: Locale, key: string): string {
  const fallback = translations.en;
  const parts = key.split(".");
  let current: unknown = translations[locale];
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      current = undefined;
      break;
    }
  }
  if (typeof current === "string") {
    return current;
  }
  let fallbackCurrent: unknown = fallback;
  for (const part of parts) {
    if (
      fallbackCurrent &&
      typeof fallbackCurrent === "object" &&
      part in (fallbackCurrent as Record<string, unknown>)
    ) {
      fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[part];
    } else {
      fallbackCurrent = undefined;
      break;
    }
  }
  return typeof fallbackCurrent === "string" ? fallbackCurrent : key;
}

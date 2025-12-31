export const OCR_TEXT_PROMPT = `You are an OCR engine. Transcribe the receipt image into plain text.
Return ONLY the raw receipt text. No JSON, no markdown, no extra commentary.`;

export const OCR_PROMPT = `You are a receipt parser. You will receive OCR text from a receipt.
The response MUST comply with the provided JSON schema.

Only include purchased products/services in "items".
Do NOT include: headers/footers, store address/phone, barcodes, QR codes, loyalty cards/bonuses,
payment lines, card numbers, authorization codes, VAT/tax lines, cash change, marketing lines,
websites, cashier info. Totals/discount lines must be reflected in "totals", not as items.
If a line is not clearly a purchased item with a price, omit it from "items".

Rules:
- Always output numbers as decimals using a dot (".") without currency symbols.
- Keep raw_name exactly as in the receipt line for items you keep.
- name should be a human-readable description of the product in English.
- For weighted goods, quantity is the weight value (e.g. 1.710) and unit is "kg".
- For pieces, quantity is a number and unit is "pcs" or "pack".
- unit_price is the price before line discount; if only line total is present, use total_price / quantity.
- total_price is the line total after line discount.
- discount is the line discount amount (0 if none): discount = (unit_price * quantity) - total_price.
- totals.subtotal is the pre-discount subtotal from the receipt, or compute as sum(unit_price * quantity).
- totals.discount_items is the sum of all item discounts.
- totals.discount_receipt is the overall receipt-level discount (club card, promo, etc.).
- totals.discount is the total discount (discount_items + discount_receipt).
- totals.total must satisfy: total = subtotal - discount_items - discount_receipt.
- If receipt totals disagree with the formula, adjust discount_receipt to make the formula hold.
- Round all monetary values to 2 decimals.
- purchased_at format: "YYYY-MM-DD" (date only).
- If store name/address, currency, purchased_at, or payment_method is unknown, use null.
- For numeric fields that are unknown, use 0.
`;

export const OCR_IMAGE_PROMPT = `You are a receipt parser. Analyze the receipt image and return ONLY valid JSON.
Schema:
{
  "store": { "name": "string or null", "address": "string or null" },
  "purchased_at": "YYYY-MM-DD or null",
  "currency": "string or null",
  "items": [
    {
      "raw_name": "string",
      "name": "string",
      "category": "grocery|household|electronics|entertainment|transport|other",
      "quantity": number,
      "unit": "pcs|pack|kg|g|l|m",
      "unit_price": number,
      "total_price": number,
      "discount": number
    }
  ],
  "totals": {
    "subtotal": number,
    "discount_items": number,
    "discount_receipt": number,
    "discount": number,
    "total": number,
    "payment_method": "string or null"
  }
}

Rules:
- Only include purchased products/services in "items".
- Do NOT include: headers/footers, store address/phone, barcodes, QR codes, loyalty cards/bonuses,
  payment lines, card numbers, authorization codes, VAT/tax lines, cash change, marketing lines,
  websites, cashier info. Totals/discount lines must be reflected in "totals", not as items.
- Always output numbers as decimals using a dot (".") without currency symbols.
- Keep raw_name exactly as in the receipt line for items you keep.
- name should be a human-readable description of the product in English.
- For weighted goods, quantity is the weight value (e.g. 1.710) and unit is "kg".
- For pieces, quantity is a number and unit is "pcs" or "pack".
- unit_price is the price before line discount; if only line total is present, use total_price / quantity.
- total_price is the line total after line discount.
- discount is the line discount amount (0 if none): discount = (unit_price * quantity) - total_price.
- totals.subtotal is the pre-discount subtotal from the receipt, or compute as sum(unit_price * quantity).
- totals.discount_items is the sum of all item discounts.
- totals.discount_receipt is the overall receipt-level discount (club card, promo, etc.).
- totals.discount is the total discount (discount_items + discount_receipt).
- totals.total must satisfy: total = subtotal - discount_items - discount_receipt.
- If receipt totals disagree with the formula, adjust discount_receipt to make the formula hold.
- Round all monetary values to 2 decimals.
- purchased_at format: "YYYY-MM-DD" (date only).
- If store name/address, currency, purchased_at, or payment_method is unknown, use null.
- For numeric fields that are unknown, use 0.
`;

export const OCR_JSON_SCHEMA = {
  name: "receipt",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["store", "purchased_at", "currency", "items", "totals"],
    properties: {
      store: {
        type: "object",
        additionalProperties: false,
        required: ["name", "address"],
        properties: {
          name: { type: ["string", "null"] },
          address: { type: ["string", "null"] },
        },
      },
      purchased_at: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      currency: { type: ["string", "null"] },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "raw_name",
            "name",
            "category",
            "quantity",
            "unit",
            "unit_price",
            "total_price",
            "discount",
          ],
          properties: {
            raw_name: { type: "string" },
            name: { type: "string" },
            category: {
              type: "string",
              enum: [
                "grocery",
                "household",
                "electronics",
                "entertainment",
                "transport",
                "other",
              ],
            },
            quantity: { type: "number" },
            unit: {
              type: "string",
              enum: ["pcs", "pack", "kg", "g", "l", "m"],
            },
            unit_price: { type: "number" },
            total_price: { type: "number" },
            discount: { type: "number" },
          },
        },
      },
      totals: {
        type: "object",
        additionalProperties: false,
        required: [
          "subtotal",
          "discount_items",
          "discount_receipt",
          "discount",
          "total",
          "payment_method",
        ],
        properties: {
          subtotal: { type: "number" },
          discount_items: { type: "number" },
          discount_receipt: { type: "number" },
          discount: { type: "number" },
          total: { type: "number" },
          payment_method: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

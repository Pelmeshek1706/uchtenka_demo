import { OCR_JSON_SCHEMA, OCR_PROMPT, OCR_TEXT_PROMPT } from "@/server/ocrPrompt";

const OCR_BASE_URL = process.env.OCR_BASE_URL || "http://127.0.0.1:1234";
const OCR_MODEL = process.env.OCR_MODEL || "nanonets-ocr2-3b";

function extractContent(payload: any) {
  if (payload?.choices?.[0]?.message?.content !== undefined) {
    return payload.choices[0].message.content;
  }
  if (payload?.choices?.[0]?.message?.parsed !== undefined) {
    return payload.choices[0].message.parsed;
  }
  if (payload?.choices?.[0]?.text !== undefined) return payload.choices[0].text;
  if (payload?.output_text !== undefined) return payload.output_text;
  const output = payload?.output?.[0]?.content?.[0]?.text;
  if (output !== undefined) return output;
  return null;
}

function parseJsonResponse(content: unknown) {
  if (content && typeof content === "object") return content;
  if (typeof content !== "string") {
    throw new Error("OCR response is not valid JSON");
  }
  const trimmed = content.trim();
  const withoutFences = trimmed
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    const match = withoutFences.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  }
  throw new Error("OCR response is not valid JSON");
}

const STRUCTURED_OUTPUT = {
  type: "json_schema",
  json_schema: OCR_JSON_SCHEMA,
} as const;

async function requestChat(payload: Record<string, unknown>) {
  const response = await fetch(`${OCR_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OCR service error: ${response.status} ${text}`);
  }

  return response.json();
}

async function extractOcrText(imageBase64: string) {
  const messages = [
    { role: "system", content: OCR_TEXT_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe this receipt image." },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
        },
      ],
    },
  ];

  const data = await requestChat({
    model: OCR_MODEL,
    messages,
    temperature: 0,
    max_tokens: 1800,
  });

  return extractContent(data);
}

async function parseReceiptText(text: string) {
  const messages = [
    { role: "system", content: OCR_PROMPT },
    {
      role: "user",
      content: `Receipt text:\\n${text}\\n\\nReturn JSON only.`,
    },
  ];

  const data = await requestChat({
    model: OCR_MODEL,
    messages,
    temperature: 0,
    max_tokens: 1800,
    response_format: STRUCTURED_OUTPUT,
    structured_output: STRUCTURED_OUTPUT,
  });

  const content = extractContent(data);
  return parseJsonResponse(content);
}

export async function analyzeReceipt(imageBase64: string) {
  const ocrContent = await extractOcrText(imageBase64);
  try {
    return parseJsonResponse(ocrContent);
  } catch {
    const text = typeof ocrContent === "string" ? ocrContent : JSON.stringify(ocrContent ?? "");
    return parseReceiptText(text);
  }
}

export const OCR_service = {
  analyzeReceipt,
};

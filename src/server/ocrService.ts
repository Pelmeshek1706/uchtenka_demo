import { OCR_IMAGE_PROMPT, OCR_JSON_SCHEMA, OCR_PROMPT, OCR_TEXT_PROMPT } from "@/server/ocrPrompt";

const OCR_BASE_URL = process.env.OCR_BASE_URL || "http://127.0.0.1:1234";
const DEFAULT_OCR_MODEL = process.env.OCR_MODEL || "nanonets-ocr2-3b";
const DEFAULT_VLM_MODEL = process.env.OCR_VLM_MODEL || DEFAULT_OCR_MODEL;
const DEFAULT_OCR_FLOW = (process.env.OCR_FLOW || "two-step").toLowerCase();
const DIRECT_IMAGE_MODELS = new Set(["qwen/qwen3-vl-8b"]);

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

function resolveMimeType(mimeType?: string) {
  if (typeof mimeType !== "string") return "image/jpeg";
  const normalized = mimeType.trim().toLowerCase();
  if (!normalized) return "image/jpeg";
  if (normalized.startsWith("image/")) return normalized;
  if (normalized === "application/pdf") return normalized;
  return "image/jpeg";
}

function contentToText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return null;
}

function parseJsonResponse(content: unknown) {
  if (content && typeof content === "object" && !Array.isArray(content)) return content;
  const text = contentToText(content);
  if (typeof text !== "string") {
    throw new Error("OCR response is not valid JSON");
  }
  const trimmed = text.trim();
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

async function extractOcrText(imageBase64: string, mimeType?: string, model = DEFAULT_OCR_MODEL) {
  const resolvedType = resolveMimeType(mimeType);
  const messages = [
    { role: "system", content: OCR_TEXT_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe this receipt image." },
        {
          type: "image_url",
          image_url: { url: `data:${resolvedType};base64,${imageBase64}` },
        },
      ],
    },
  ];

  const data = await requestChat({
    model,
    messages,
    temperature: 0,
    max_tokens: 1800,
  });

  return extractContent(data);
}

async function parseReceiptText(text: string, model = DEFAULT_OCR_MODEL) {
  const messages = [
    { role: "system", content: OCR_PROMPT },
    {
      role: "user",
      content: `Receipt text:\\n${text}\\n\\nReturn JSON only.`,
    },
  ];

  const data = await requestChat({
    model,
    messages,
    temperature: 0,
    max_tokens: 1800,
    response_format: STRUCTURED_OUTPUT,
    structured_output: STRUCTURED_OUTPUT,
  });

  const content = extractContent(data);
  return parseJsonResponse(content);
}

async function analyzeReceiptFromImage(
  imageBase64: string,
  mimeType?: string,
  model = DEFAULT_VLM_MODEL
) {
  const resolvedType = resolveMimeType(mimeType);
  const messages = [
    { role: "system", content: OCR_IMAGE_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this receipt image and return JSON only." },
        {
          type: "image_url",
          image_url: { url: `data:${resolvedType};base64,${imageBase64}` },
        },
      ],
    },
  ];

  const data = await requestChat({
    model,
    messages,
    temperature: 0,
    max_tokens: 1800,
  });

  const content = extractContent(data);
  return parseJsonResponse(content);
}

function resolveFlow(model?: string, flow?: string) {
  const normalizedFlow = flow?.toLowerCase();
  if (normalizedFlow) return normalizedFlow;
  if (model && DIRECT_IMAGE_MODELS.has(model)) return "vision";
  return DEFAULT_OCR_FLOW;
}

export async function analyzeReceipt(
  imageBase64: string,
  options?: { mimeType?: string; model?: string; flow?: string }
) {
  const model = options?.model || DEFAULT_OCR_MODEL;
  const flow = resolveFlow(model, options?.flow);

  if (["vision", "image", "vlm", "direct"].includes(flow)) {
    return analyzeReceiptFromImage(imageBase64, options?.mimeType, model);
  }

  const ocrContent = await extractOcrText(imageBase64, options?.mimeType, model);
  try {
    return parseJsonResponse(ocrContent);
  } catch {
    const text = typeof ocrContent === "string" ? ocrContent : JSON.stringify(ocrContent ?? "");
    return parseReceiptText(text, model);
  }
}

export const OCR_service = {
  analyzeReceipt,
};

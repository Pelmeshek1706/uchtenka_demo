# Uchtenka

Receipt-first budget tracker with OCR-driven parsing. Built with Next.js (React) and a local OCR model.

## Requirements
- Node.js 18+ and npm
- Local OCR model running at `http://127.0.0.1:1234`

## Setup
```bash
npm install
npm run dev
```

## OCR configuration
Create `.env.local` if needed:
```bash
OCR_BASE_URL=http://127.0.0.1:1234
OCR_MODEL=nanonets-ocr2-3b
```

## Data storage
Data is stored in `data/db.json` (single-user).

## TODO
- Improve overall design and visuals (charts should respect currency formatting; dashboard charts should scale to average values instead of max-only scaling).
- When editing receipts, keep the previously scanned state and allow re-run of OCR while preserving the draft.
- Add Google authentication to persist user data and progress.
- Enable sharing receipts with other users (family mode) so invited users can add/edit receipts and affect the dashboard.
- Add shopping lists with multiple lists (e.g., “weekly groceries”, “missing at home”) and autocomplete from previously purchased items; if multiple store variants exist, use a shared name and average price; show total list cost with “+” when some items lack prices. Maybe add where is the lowest price.
- Improve OCR for electronic and paper receipts: strengthen text parsing, item classification, and JSON schema; handle extra promotions/discounts; add tests with sample receipts; validate on large receipts; support multi-image receipts; allow user-pasted receipt text (image uses OCR model; text uses LLM or VLM with a different prompt).
- MOBILE VERSION SUPPORT AND MOBILE APPLICATION!!!!!
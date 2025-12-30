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

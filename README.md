## QR Code For Everyone

A beautiful QR code generator with live preview and customization:

- **Paste any link/text**
- **Customize**: dots, corners, colors, gradient, background transparency
- **Add a logo** (upload an image)
- **Download** as PNG / JPEG / WEBP / SVG

## Getting Started

Install deps and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (recommended)

- Push this project to GitHub (or GitLab/Bitbucket)
- In Vercel, click **Add New → Project**
- Import the repo
- Framework preset: **Next.js**
- Build command: `next build` (default)
- Output: (default)
- Deploy

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

Notes:

- **No environment variables are required** for this app.
- The Vercel project display name can be set to **“QR Code For Everyone”** in Vercel’s project settings (the repo/folder name can stay `qr-code-for-everyone`).

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- `qr-code-styling`

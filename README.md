# Wardrobe Talks — Luxury Couture Portfolio Lookbook

A professional, production-ready workspace-based monorepo for the **Wardrobe Talks** luxury couture brand website and its separate administrative dashboard panel.

---

## 📁 Project Architecture & Directory Structure

This repository is configured as an npm workspaces monorepo:

* **`apps/web`**: Customer lookbook website and the unified REST API backend server (Next.js 14).
* **`apps/admin`**: Administrative dashboard interface (Next.js 14 running on port `3001`).
* **`scripts`**: Data utilities, including the Cloudinary base64 image migration tool.

```
/
├── apps/
│   ├── web/                     # Customer Lookbook App + Backend API
│   │   ├── app/
│   │   │   ├── api/[[...path]]  # Backend REST API routes handler
│   │   │   ├── page.js          # Customer landing and views router
│   │   │   └── globals.css      # Customer lookbook themes and typography
│   │   └── package.json
│   │
│   └── admin/                   # Administrative Panel App
│       ├── app/
│       │   ├── page.js          # Dashboard Home Analytics
│       │   ├── products/        # Couture design CRUD forms
│       │   ├── inquiries/       # Client inquiries tags log
│       │   ├── hero/            # Hero slideshow slide list
│       │   ├── gallery/         # Daily Atelier masonry tiles
│       │   └── layout.js        # Responsive sidebar + auth blocker
│       └── package.json
│
├── scripts/
│   └── migrate-images-to-cloudinary.js  # Base64 CDN migration utility
│
├── package.json                 # Monorepo workspaces coordinator
└── README.md
```

---

## 🎨 Design System Palette

* **Primary Background**: `#121212` (Ink Charcoal)
* **Secondary Background**: `#1C1C1C` (Carbon Black)
* **Accent Gold**: `#C6A972` (Luxury Gold)
* **Hover Champagne**: `#D8C4A0` (Champagne Accent)
* **Ivory Cream**: `#F5F1E8` (Primary typography)

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the root directory and configure:

```env
# Database configuration
MONGO_URL=mongodb+srv://...
DB_NAME=wardrobe_talks

# Subdomain URLs (no trailing slash)
NEXT_PUBLIC_SITE_URL=https://thewardrobetalks.com
NEXT_PUBLIC_ADMIN_URL=https://admin.thewardrobetalks.com
NEXT_PUBLIC_API_URL=https://thewardrobetalks.com

# Cloudinary CDN credentials
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Auth token secret (JWT)
AUTH_SECRET=generate_your_secure_secret_key

# SMTP Credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
INQUIRY_TO=...
```

---

## 🏃 Running Locally

Run all commands from the root workspace directory:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Customer Lookbook & Backend Server** (Port `3000`):
   ```bash
   npm run dev:web
   ```

3. **Start Admin Dashboard** (Port `3001`):
   ```bash
   npm run dev:admin
   ```

4. **Verify Production Build**:
   ```bash
   npm run build:web
   npm run build:admin
   ```

---

## 📦 Image Migration

To scan your database for old base64 images and upload them safely to Cloudinary:

* **Dry run (Inspect only)**:
   ```bash
   node scripts/migrate-images-to-cloudinary.js --dry-run
   ```

* **Execute migration**:
   ```bash
   node scripts/migrate-images-to-cloudinary.js
   ```

---

## 📘 Supplementary Documentation

Refer to these files for detailed instructions:
* **[DEPLOYMENT.md](file:///Users/krishnanitinjain/Documents/wardrobe_talks_project/DEPLOYMENT.md)**: Hosting configuration guide.
* **[SECURITY.md](file:///Users/krishnanitinjain/Documents/wardrobe_talks_project/SECURITY.md)**: Encryption, CORS, validation filters.
* **[DATABASE.md](file:///Users/krishnanitinjain/Documents/wardrobe_talks_project/DATABASE.md)**: Collection models and indexes setup.
* **[ADMIN_GUIDE.md](file:///Users/krishnanitinjain/Documents/wardrobe_talks_project/ADMIN_GUIDE.md)**: Simple user manual for lookbook management.

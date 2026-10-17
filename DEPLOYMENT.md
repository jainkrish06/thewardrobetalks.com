# Wardrobe Talks — Production Deployment Guide

This document explains how to deploy the customer lookbook website and the admin dashboard to production hosts like Vercel or Netlify, configure subdomains, and map DNS records.

---

## ☁️ Next.js Standalone Deployment (Recommended)

Both `apps/web` and `apps/admin` are configured to support Next.js `standalone` mode builds, optimizing container and serverless functions sizing.

### A. Customer Website + API Backend (`thewardrobetalks.com` / `api.thewardrobetalks.com`)

The customer-facing website and backend API routes reside inside `apps/web`.

1. **Deploy to Vercel/Netlify**:
   - Create a new project in your deployment hosting service.
   - Point to your GitHub repository.
   - Under **Project Settings**:
     - Set **Root Directory** to `apps/web`.
     - Build Command: `next build` (or default).
     - Output Directory: `.next`.
   - Set all **Environment Variables** (see Environment Variables list).
   - Trigger the deployment.

2. **Domain Settings**:
   - In Vercel/Netlify domains tab, add:
     - `thewardrobetalks.com` (Client Website)
     - `api.thewardrobetalks.com` (API Host - redirects queries to backend routes)

---

### B. Admin Dashboard Panel (`admin.thewardrobetalks.com`)

The administrative dashboard resides inside `apps/admin`.

1. **Deploy to Vercel/Netlify**:
   - Create a second separate project in your hosting service.
   - Point to the same GitHub repository.
   - Under **Project Settings**:
     - Set **Root Directory** to `apps/admin`.
     - Build Command: `next build`.
     - Output Directory: `.next`.
   - Set all **Environment Variables** (see Environment Variables list).
   - Trigger the deployment.

2. **Domain Settings**:
   - In your dashboard project domain tab, add:
     - `admin.thewardrobetalks.com`

---

## 🛠 DNS Records Mapping Configuration

Log in to your Domain Registrar dashboard (e.g. GoDaddy, Namecheap) and configure:

| Type | Name | Value | TTL | Purpose |
|---|---|---|---|---|
| A | `@` | Vercel/Netlify IP (e.g. `76.76.21.21` for Vercel) | Default | Points base domain to client site |
| CNAME | `www` | `cname.vercel-dns.com.` | Default | Points www subdomain to client site |
| CNAME | `api` | `cname.vercel-dns.com.` | Default | Maps API endpoint calls to Web backend |
| CNAME | `admin` | `cname.vercel-dns.com.` | Default | Maps Admin dashboard subdomain |

---

## ⚡ Caching and Invalidations

Atelier configurations and settings are cached on the server-side to maximize loading speeds.
* Caches are automatically invalidated in memory when an administrator submits settings updates via `PUT /api/admin/settings`.
* If manual cache clearing is required during testing, redeploy the `apps/web` project, or query system diagnostics dashboard.

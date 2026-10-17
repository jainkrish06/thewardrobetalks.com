# Wardrobe Talks — Security Assessment & Protocols

This document outlines the security parameters, validation logic, encryption keys usage, and endpoint authorization guards implemented in the refactored Wardrobe Talks lookbook application.

---

## 🔒 1. Secrets and Environment Variable Isolation

Hardcoded passwords, JWT secrets, database connection URLs, Cloudinary keys, and SMTP server passwords have been removed from the git repository codebase.
* All credentials are now dynamically read from environment variables on the server-side.
* `.env` file containing local development keys is explicitly ignored in `.gitignore` to prevent leaks.
* Frontend client components have no access to server variables. Only variables prefixed with `NEXT_PUBLIC_` are exposed in browser bundles.

---

## 🔑 2. JSON Web Token (JWT) Session Authentication

* Authentication is handled via signed JSON Web Tokens (JWT).
* Tokens are issued upon success of `/api/auth/login` and signed using a secure `AUTH_SECRET` environment key.
* The API returns the token in JSON payload, and also sets an HTTP-only secure cookie named `wt_session` with properties:
  - `HttpOnly: true` (Blocks access from client-side XSS scripts).
  - `Secure: true` (Enforces HTTPS transport layer encryption).
  - `SameSite: Lax` (Protects against Cross-Site Request Forgery (CSRF) exploits).
  - `Path: /` (Scapes session across sub-routes).

---

## 🛡️ 3. Server-Side Role Authorization Guards

Authorization checks are executed on the server-side for every single administrative endpoint (`/api/admin/...`). Client-side UI badges or routing flags are never trusted.

* **SUPER_ADMIN**: Full dashboard control, global settings adjustments, database status inspections, and provisioning admin users.
* **CONTENT_MANAGER**: Authorized to manage products, collections metadata, hero sliders, gallery atelier tiles, and editorial blog articles. Denied access to inquiries list, settings forms, or administrator accounts.
* **INQUIRY_MANAGER**: Authorized to view, update statuses of, or delete customer inquiries. Denied access to products, blogs, settings, or other assets.

---

## 📁 4. Secure File Upload Policies

The image upload endpoint `/api/admin/upload` parses files on the server-side and implements robust validation filters before uploading to Cloudinary CDN:
1. **Size Controls**: Rejects files larger than 10MB to prevent Denial of Service (DoS) disk exhaustion.
2. **MIME Verification**: Restricts file types to:
   - `image/jpeg`
   - `image/png`
   - `image/gif`
   - `image/webp`
   - `image/heic`
   - `image/heif`
   - `image/avif`
   - All executable scripts (`.exe`, `.sh`), HTML documents, or other suspicious file structures are strictly blocked.

---

## 🚨 5. Secure Logging & Error Handlers

* Stack traces, server paths, and raw database engine query logs are intercepted. In the event of a failure, APIs respond with a generic error code structure, hiding structural vulnerabilities:
  ```json
  {
    "success": false,
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "An internal server error occurred."
    }
  }
  ```
* Sensitive variables (e.g. passwords, secrets) are excluded from server logs to prevent leakages into filesystem logs.

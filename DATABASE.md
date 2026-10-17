# Wardrobe Talks — MongoDB Database Schema & Backups

This document covers the database configuration, collections schema designs, indices, backup exports, and seed fallbacks implemented for Wardrobe Talks.

---

## 🗄️ 1. MongoDB Atlas Collections & Schema Models

### A. `products`
* **`id`**: Unique string ID (UUID).
* **`title`**: String. Couture design title.
* **`slug`**: String (Unique, Indexed). URL slug.
* **`description`**: String. Detail specs.
* **`category`**: String (Indexed). E.g. `Women`, `Men`, `Celebrity`.
* **`subcategory`**: String. E.g. `Bridal Lehenga`, `Anarkali`.
* **`fabric`**: String. Material specs.
* **`occasion`**: String.
* **`designerNotes`**: String. Personal quote.
* **`images`**: Array of Strings (Cloudinary CDN URLs). Cover image is at index `0`.
* **`featured`**: Boolean (Indexed). Renders signature tags.
* **`published`**: Boolean (Indexed). Renders on lookbook.
* **`displayOrder`**: Integer. Ordering sort sequence.
* **`createdAt`**: Date (Indexed).
* **`updatedAt`**: Date.
* **`seoTitle`**: String.
* **`seoDescription`**: String.

### B. `inquiries`
* **`id`**: Unique string ID (UUID).
* **`name`**: Client name.
* **`email`**: Client email.
* **`phone`**: Client contact number.
* **`message`**: Details of enquiry.
* **`productId`**: Associated design ID.
* **`productTitle`**: Associated design name.
* **`status`**: String (Indexed). E.g. `NEW`, `CONTACTED`, `IN_PROGRESS`, `CLOSED`.
* **`createdAt`**: Date (Indexed).

### C. `heroSlides`
* **`id`**: Unique string ID (UUID).
* **`kicker`**: Top tagline kicker.
* **`title`**: Slide title text.
* **`subtitle`**: Secondary tagline.
* **`image`**: Background image URL.
* **`ctaLabel`**: Button text.
* **`ctaTarget`**: Navigation target view.
* **`order`**: Integer. Slide sequence.
* **`active`**: Boolean. Display status.
* **`createdAt`**: Date.

### D. `gallery` (Daily Atelier)
* **`id`**: Unique string ID (UUID).
* **`image`**: Image URL.
* **`caption`**: Text caption.
* **`alt`**: Accessibility description.
* **`link`**: Instagram post link.
* **`order`**: Integer. Masonry sequence.
* **`published`**: Boolean. Display status.
* **`createdAt`**: Date.

### E. `settings`
* **`id`**: `'main'` (Single configuration document).
* **`whatsappNumber`**: WhatsApp contact.
* **`whatsappCommunity`**: Group invite link.
* **`instagramUrl`**: Instagram link.
* **`facebookUrl`**: Facebook link.
* **`youtubeUrl`**: YouTube channel link.
* **`inquiryEmail`**: Showroom recipient email.
* **`storeAddress`**: Showroom text address.
* **`storeMapsUrl`**: Showroom Google Maps link.
* **`brandTagline`**: Global website tagline.
* **`heroHeadline`**: Main website cover header.
* **`heroSubtext`**: Subtitle summary under header.

### F. `admins`
* **`id`**: Unique string ID (UUID).
* **`email`**: String (Unique, Indexed).
* **`passwordHash`**: Bcrypt hash.
* **`role`**: E.g. `SUPER_ADMIN`, `CONTENT_MANAGER`, `INQUIRY_MANAGER`.
* **`name`**: Administrator name.
* **`createdAt`**: Date.

---

## 🗂️ 2. Flat-File Fallback Database (`db_backup.json`)

If your MongoDB Atlas database cluster becomes unavailable (e.g. temporary network outage, credentials rotating), the backend routes automatically fall back to reading/writing data from the local JSON database file:

* Path: `/db_backup.json`
* Fallback operations: Read collections, add submissions (e.g. client inquiries), write changes.
* System Recovery: The admin dashboard System tab will display the database as `FALLBACK_LOCAL_JSON` if this recovery layer is active.

---

## 💾 3. Seeding & Database Backups

Database backups and seeding are managed through standard utilities:

* **Trigger backup**:
  ```bash
  npm run backup:db   # Runs dump of collections to db_backup.json
  ```
* **Restore cluster**:
  ```bash
  node restore_db.js  # Feeds database collections from db_backup.json to MongoDB
  ```

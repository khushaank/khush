# Khushaank Gupta — Portfolio & Blog

[![Live Site](https://img.shields.io/badge/Live-khushaankgupta.qzz.io-blue?style=for-the-badge)](https://khushaankgupta.qzz.io)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-red?style=for-the-badge)](#license)

> A premium portfolio and financial insights blog built by **Khushaank Gupta** — CA aspirant, finance student at Delhi University, and technology enthusiast.

---

## ✨ Features

- **Portfolio Homepage** — About, skills, timeline, projects, AI toolkit, and contact
- **Financial Blog** — Dynamic articles on tax, auditing, market trends, and economic analysis
- **AI & Quant Finance** — Dedicated page showcasing AI integration with traditional finance
- **Article Viewer** — Focus mode, in-article search, reading progress, comments, TOC
- **PWA Support** — Installable with offline caching via Service Worker
- **SEO Optimized** — Sitemap, robots.txt, structured data (JSON-LD), Open Graph, Twitter Cards

## 🛠️ Tech Stack

| Layer        | Technology                                             |
| ------------ | ------------------------------------------------------ |
| **Frontend** | HTML5, CSS3 (custom design system), Vanilla JavaScript |
| **Backend**  | Supabase (PostgreSQL, Auth, Storage)                   |
| **Icons**    | Lucide Icons                                           |
| **Fonts**    | Manrope + Playfair Display (Google Fonts)              |
| **Hosting**  | GitHub Pages                                           |
| **Domain**   | khushaankgupta.qzz.io                                  |

## 📁 Project Structure

```
├── index.html          # Homepage / Portfolio
├── blog.html           # Blog listing page
├── ai.html             # AI & Quantitative Finance
├── admin.html          # Blog admin panel (protected)
├── privacy.html        # Privacy Policy
├── terms.html          # Terms & Conditions
├── contact.html        # Contact Page
├── 404.html            # Custom 404 page
├── pulse/
│   └── index.html      # Article viewer
├── assets/
│   ├── css/            # Stylesheets
│   ├── js/             # Scripts
│   └── images/         # Images & favicon
├── sitemap.xml         # XML Sitemap
├── robots.txt          # Crawler instructions
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker
├── llms.txt            # LLM context file
├── llms-full.txt       # Extended LLM context
├── humans.txt          # humans.txt standard
├── security.txt        # Security contact (RFC 9116)
├── .htaccess           # Apache rewrite rules
├── _redirects          # Netlify redirects
└── CNAME               # Custom domain config
```

## 🚀 Getting Started

This is a static website. To run locally:

1. Clone the repository
2. Open `index.html` in a browser, or use a local server:
   ```bash
   npx serve .
   ```
3. For Supabase features (blog, comments), configure the Supabase keys in `script.js`

## 📝 SEO & Standards

- `sitemap.xml` — All public pages with priority and change frequency
- `robots.txt` — Crawler directives with sitemap reference
- `llms.txt` / `llms-full.txt` — Context files for AI/LLM systems
- `humans.txt` — Creator credits
- `security.txt` / `.well-known/security.txt` — Security contact (RFC 9116)
- `manifest.json` — PWA manifest with icons and theme
- JSON-LD structured data on all pages
- Open Graph + Twitter Cards meta tags

## 👤 Author

**Khushaank Gupta**

- 🌐 [khushaankgupta.qzz.io](https://khushaankgupta.qzz.io)
- 💼 [LinkedIn](https://www.linkedin.com/in/khushaank)
- 🐙 [GitHub](https://github.com/khushaank)
- 🐦 [Twitter / X](https://x.com/Khushaankgupta)
- 📧 khushaankgupta@gmail.com

## 📄 License

All rights reserved. © 2026 Khushaank Gupta.

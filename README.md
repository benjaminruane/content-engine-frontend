# Brightline Content Engine (Frontend)

**Version:** v3.0.0 (Clean UI Release)  
**Live site:** Deployed via Vercel

The Brightline Content Engine is an AI-powered drafting tool designed for investment, reporting, and communications workflows.

It allows users to upload sources, run structured drafting prompts, rewrite content, track versions, and export output in multiple formats.

---

## 🚀 Features (v3.0 — Clean UI)

### Dashboard
- Two-column workspace:
  - **Sources** (file uploads, URL ingestion, public-domain search toggle)
  - **Configuration** (title, output types, prompt notes, model settings)
- **Draft Output** panel with:
  - Live editable text
  - Colour-coded quality score pill
  - Copy/export (.TXT, .DOC — .PDF coming soon)
- **Versions** timeline with comments, scores, model info, and metadata
- **Future roadmap** section (collapsible)
- First-time “Getting started” guidance panel

### Navigation & Layout
- Dynamic page titles for each tab (Dashboard, Projects, Sources, Outputs, Templates)
- Header navigation with active state highlight
- Clean, consistent sidebar for session info
- Toast notifications for all key actions

---

## 🏷 Release Notes

Full v3.0.0 release notes:  
https://github.com/benjaminruane/content-engine-frontend/releases/tag/v3.0.0

---

## 🛠 Running Locally (optional)

# 1. Clone the repository
git clone https://github.com/benjaminruane/content-engine-frontend
cd content-engine-frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

Your app will start at:
http://localhost:3000

**##📌 Roadmap (Short Version)**

v3.1 — UI refactoring & code cleanup
v3.2 — PDF export + improved file handling
v3.3 — Version comparison & diff view
v3.4 — Rubric-based scoring engine rewrite
v4.0 — Persistent Projects workspace

**##📝 License**

Private project — not open-source.

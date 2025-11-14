# AI Content Engine – v2.0

**Current frontend version:** `v2.0`

This repository contains the frontend application for the AI Content Engine, a prototype tool that enables structured content generation using source documents, URLs, predefined output types, and version tracking.

🚀 Features

Upload TXT files or add URLs as source material

Select one or multiple output types (Investor Commentary, Detailed Note, Press Release, LinkedIn Post)

Public Domain Search toggle (forwarded to backend prompt)

Prompt Notes / Rewrite Instructions for refining drafts

Model configuration (model ID, temperature, max tokens)

Full versioning system including:

Version numbers (V1, V2, ...)

Rewrite summaries

Timestamps

Public search status

Model used

Scores & metrics display

Rubric modal to view scoring breakdown

New Output workflow that resets the workspace

Backend health check & configurable API Base URL

🧱 Project Structure

content-engine-frontend/
├── public/
├── src/
│   ├── App.jsx        ← main React application (v1.0)
│   └── index.js
├── package.json
├── .gitignore
├── .prettierrc        ← Prettier formatting rules
├── .prettierignore
└── README.md

🛠️ Setup & Development

1. Install dependencies

npm install

2. Run the dev server

npm start

The app will be available at:

http://localhost:3000

🌐 Connecting to Backend

This frontend expects a backend at:

https://content-engine-backend-v2.vercel.app/api

You can configure this inside the "Advanced" section of the UI.

If no API Base URL is set, the app will generate demo output only.

🧪 Prettier Formatting

This repository uses Prettier for consistent formatting.

Config files:

.prettierrc → formatting rules

.prettierignore → excluded paths

GitHub Action

A GitHub workflow automatically runs Prettier on every push to main.
You do not need to manually format code.

📦 Deployment

This project is designed for Vercel hosting.

Simply connect the repo to Vercel and deploy — no extra configuration needed.


🙌 Author & Usage

This prototype was generated collaboratively using ChatGPT and is intended for exploration, testing, and future development.

Feel free to adapt, extend, or fork the project.

Developer: Benjamin Ruane

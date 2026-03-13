# QA Command Center

A full-featured QA review system built with **React + Vite + Tailwind CSS**.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

## 📁 Project Structure

```
qa-center/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root layout + routing
    ├── index.css             # Global styles + Tailwind
    ├── store/
    │   └── useStore.js       # Global state + localStorage
    └── components/
        ├── ui.jsx            # Shared UI: Badge, Modal, Toast, Panel...
        ├── Sidebar.jsx       # Navigation sidebar
        ├── Dashboard.jsx     # Overview stats + recent reviews
        ├── ReviewCall.jsx    # Manual entry + CSV import
        ├── CallLog.jsx       # Filterable call log table
        ├── Agents.jsx        # Agent performance cards
        ├── Reports.jsx       # Full analytics + charts
        └── Criteria.jsx      # QA criteria management
```

## ✨ Features

- **Dashboard** — live stats, top agents, failed criteria breakdown, reviewer activity
- **Review Call** — manual form with pass/fail scoring per criterion, CSV bulk import
- **Call Log** — searchable & filterable table, click any row for full details
- **Agents** — performance cards with pass rate bars for all reviewed agents
- **Reports** — agent performance table, worst criteria chart, reviewer activity
- **QA Criteria** — add/delete custom scoring attributes with optional categories
- **Persistent storage** — all data saved in `localStorage`, survives page refresh

## 🎨 Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- DM Sans + DM Mono + Syne (Google Fonts)
- No external UI library — fully custom components

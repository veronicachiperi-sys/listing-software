# STR Listing Optimization Dashboard

Analytical dashboard for short-term rental portfolio management — review intelligence, listing audits, and task tracking across Airbnb, Booking.com, and VRBO.

## Features

- **Portfolio Overview** — Property health ranking with computed ratings, audit scores, and open action counts
- **Review Intelligence** — AI-powered sentiment analysis, topic extraction, removal candidate detection, and response suggestions (via Claude API)
- **CSV Upload** — Flexible column matching for reviews, properties, and audit data from any OTA or PMS export
- **Manual Paste** — For platforms without CSV export (VRBO, etc.)
- **Action Items** — Task management with auto-generated items from AI analysis, priority tracking, and change log
- **Data Export** — CSV export of reviews (with analysis) and action items

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Claude API Key

Go to **Settings** in the dashboard and paste your API key from [console.anthropic.com](https://console.anthropic.com). Required for AI review analysis.

## CSV Format

The parser is flexible with column names. Examples:

**Reviews:** `property`, `ota`, `date`, `rating`, `text`, `guest`
(also accepts: `property_name`, `listing`, `platform`, `channel`, `score`, `stars`, `review`, `comment`, `review_text`, etc.)

**Properties:** `name`, `market`, `otas` (comma-separated), `guesty_id`, `airbnb_url`, `booking_url`, `vrbo_url`

**Audit:** `property`, `ota`, `date`, plus any additional columns (scored automatically)

## Tech Stack

React 18, Vite, PapaParse, Lucide React, Claude API (Sonnet)

## Build for Production

```bash
npm run build
```

Output in `dist/` — deploy anywhere that serves static files.

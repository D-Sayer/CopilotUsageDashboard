# Copilot Usage Dashboard

A React dashboard that visualizes your GitHub Copilot CLI token usage by parsing local session data from `~/.copilot/session-state/`.

## Features

- **Daily token usage chart** — stacked area chart showing input, output, and reasoning tokens by day
- **Requests & sessions chart** — bar chart showing API requests and sessions per day
- **Model breakdown table** — per-model totals for input/output/cache/reasoning tokens
- **Recent sessions table** — session details with code change stats (+/- lines)
- **Sync button** — re-pull data on demand from your local `.copilot` folder

## Quick Start

```bash
# Install dependencies
npm install

# Start both the API server and Vite dev server
npm start

# Or start them separately:
npm run server   # API on http://localhost:3001
npm run dev      # Vite on http://localhost:5173
```

Then open http://localhost:5173 in your browser.

## How It Works

1. The Express server (`server.mjs`) reads all `events.jsonl` files from `~/.copilot/session-state/`
2. It extracts `session.shutdown` events which contain detailed model metrics (token counts per model)
3. The React frontend fetches `/api/usage` and displays the data using Recharts
4. Click "Sync Data" to re-parse all sessions

## Data Extracted

From each session's `events.jsonl`:
- Model name (e.g., `gpt-5.4`, `claude-opus-4.6`, `claude-sonnet-4.6`)
- Input tokens, output tokens, cache read/write tokens, reasoning tokens
- Request counts and premium request costs
- Code changes (lines added/removed)
- Session duration and API duration

## Tech Stack

- **React 19** + **TypeScript**
- **Recharts** for charts
- **Vite** for dev/build
- **Express** for the local API server

# Vigility — Product Analytics Dashboard

An interactive analytics dashboard that tracks its own usage. Every filter change, chart click, and export is recorded as an event and fed back into the visualization.

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React (Vite), Chart.js
- **Auth**: JWT with bcrypt password hashing
- **Persistence**: Cookie-based filter saving (js-cookie)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Seed

```bash
cd backend && npm install
cd ../frontend && npm install

# populate the database with dummy data
cd ../backend
npm run seed
```

This creates 11 users and ~150 click events across 30 days. The demo account is `demo` / `demo`. Other accounts use `pass123`.

### Run

```bash
# terminal 1
cd backend && npm run dev    # http://localhost:5000

# terminal 2
cd frontend && npm run dev   # http://localhost:5173
```

## Features

- **Bar Chart** — Feature usage breakdown. Click a bar to drill into its time trend.
- **Line Chart** — Daily click trend, updates based on bar chart selection.
- **Demographics** — Gender and age distribution (pie/doughnut charts with tab switching).
- **Time Tracking** — Average and total time spent per feature.
- **Recent Activity** — Last 5 user actions across the platform.
- **Filters** — Date range, age group, gender. Persisted in cookies across refreshes.
- **Self-Tracking** — Every interaction fires POST /track to record the event.
- **CSV Export** and auto-refresh (10s polling).

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Get JWT token |
| POST | `/track` | Yes | Log a feature click |
| POST | `/track-time` | Yes | Log time spent |
| GET | `/analytics` | Yes | Aggregated data (supports `start_date`, `end_date`, `age_group`, `gender`, `feature_name` query params) |

## Project Structure

```
backend/
  src/
    server.js           Express entry point
    database.js         SQLite schema
    seed.js             Dummy data generation
    middleware/auth.js   JWT middleware
    routes/auth.js       Login & registration
    routes/analytics.js  Tracking & analytics queries

frontend/
  src/
    App.jsx             Root with auth routing
    AuthContext.jsx      Auth state (Context API)
    api.js              API client
    components/
      LoginPage.jsx     Login/register form
      Dashboard.jsx     Main dashboard
      BarChart.jsx      Feature usage chart
      LineChart.jsx     Time trend chart
      PieChart.jsx      Demographics chart
      RecentActivity.jsx Activity feed
      FeatureTimeList.jsx Time tracking table
```

## Scaling to 1M Events/Minute

If this needed to handle a million writes per minute:

1. **Message queue** — Replace direct DB writes with Kafka or Kinesis. The `/track` endpoint publishes and returns immediately.
2. **Batch processing** — Consumer workers pull from the queue and do bulk inserts (batches of ~10k rows).
3. **Database** — Swap SQLite for ClickHouse or TimescaleDB, both optimized for high-volume time-series writes and analytical queries.
4. **Horizontal scaling** — Stateless API behind a load balancer. JWT makes this straightforward.
5. **Read path** — Pre-computed aggregations in Redis, updated by stream processors. Separate read and write paths (CQRS).

This shifts the architecture from "every request hits the DB" to "writes go to a buffer, reads go to a cache."

## License

MIT

# 🏓 TT Absagen-System

A lightweight, self-hosted web app for table tennis clubs to manage training cancellations. Parents can notify coaches when their child can't attend — the coach gets an email instantly, and the overview page shows all cancellations at a glance.

**No login required. No database. No framework overhead.**

![Node.js](https://img.shields.io/badge/Node.js-TypeScript-3178c6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Cancellation form** — enter child's name, select trainer → email sent automatically
- **Overview page** — all cancellations grouped by trainer, auto-refreshes every 30 seconds
- **Personal links** — `/?name=Max+Mustermann` pre-fills the name field; QR code & clipboard copy built in
- **Auto-reset** — absences are cleared automatically after each training session (configurable via cron schedule)
- **Fully configurable** via a single `config.json` — club name, trainers, training times, SMTP settings
- **Responsive & mobile-friendly** — works great on phones
- **In-memory storage** — intentionally simple, no database needed

---

## Screenshots

| Absage eintragen | Übersicht |
|---|---|
| Form with trainer selection cards and personal link section | Overview with per-trainer counts and last-reset timestamp |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An SMTP server (e.g. your hosting provider, Gmail, Mailgun)

### Installation

```bash
git clone https://github.com/youruser/tt-absagen.git
cd tt-absagen
npm install
```

### Configuration

```bash
cp config.example.json config.json
nano config.json   # fill in your values
```

> ⚠️ `config.json` is in `.gitignore` — your SMTP credentials will never be committed.

### Run

```bash
# Development (ts-node, hot-ish)
npm run dev

# Production
npm run build
npm start
```

The app is available at `http://localhost:3000` (or the port set in `config.json`).

---

## Configuration Reference

See [`config.example.json`](config.example.json) for a full example. Key sections:

### `club`
```json
"club": {
  "name": "TT-Verein Musterstadt",
  "subtitle": "Jugendtraining Absagen"
}
```

### `trainers`
```json
"trainers": [
  { "id": "mueller", "name": "Max Müller", "email": "max@example.com" },
  { "id": "schmidt", "name": "Lisa Schmidt", "email": "lisa@example.com" }
]
```
`id` must be unique and URL-safe. Add as many trainers as needed.

### `training.sessions`
```json
"sessions": [
  { "day": 3, "label": "Mittwoch", "time": "18:00", "resetDay": 3, "resetTime": "22:00" },
  { "day": 5, "label": "Freitag",  "time": "18:00", "resetDay": 5, "resetTime": "22:00" }
]
```

| Field | Description |
|---|---|
| `day` | Day of week for the training (0 = Sunday … 6 = Saturday) |
| `label` | Human-readable label shown in the UI |
| `time` | Training start time (`HH:MM`) |
| `resetDay` | Day of week when absences are cleared |
| `resetTime` | Time when the reset fires — typically after training ends |

The reset uses `Europe/Berlin` timezone via `node-cron`.

### `smtp`
```json
"smtp": {
  "host": "smtp.yourprovider.de",
  "port": 587,
  "secure": false,
  "user": "absagen@tt-verein.de",
  "password": "YOUR_PASSWORD",
  "from": "Absagen TT-Verein <absagen@tt-verein.de>"
}
```
`secure: true` for port 465 (TLS), `false` for port 587 (STARTTLS).

### `app`
```json
"app": {
  "port": 3000,
  "baseUrl": "https://your-domain.de"
}
```
`baseUrl` is used to generate personal links with the correct domain.

---

## Personal Links

Every parent can save a pre-filled link for next time:

```
https://your-domain.de/?name=Max%20Mustermann
```

The form pre-fills the name from the query parameter. Under the form, options appear to:
- 📋 Copy the link to clipboard
- 📱 Show a QR code to scan & save on mobile
- 🔖 Navigate to the link (then use browser bookmark / Add to Home Screen)

---

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/config` | Public config (club name, trainers, next training) |
| `GET` | `/api/absagen` | All current absences, grouped by trainer |
| `POST` | `/api/absagen` | Submit a new absence (sends email) |
| `DELETE` | `/api/absagen` | Manual reset of all absences |

### POST `/api/absagen`
```json
{ "kindName": "Max Mustermann", "trainerId": "mueller" }
```

---

## Production Deployment

### With PM2

```bash
npm run build
pm2 start dist/server.js --name tt-absagen
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    server_name your-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then enable HTTPS with Certbot:
```bash
certbot --nginx -d your-domain.de
```

---

## Project Structure

```
tt-absagen/
├── src/
│   ├── server.ts       # Express app, API routes
│   ├── store.ts        # In-memory absence store
│   ├── mailer.ts       # Nodemailer email sending
│   └── scheduler.ts    # node-cron resets + next-training logic
├── public/
│   ├── index.html      # Cancellation form
│   ├── overview.html   # Trainer overview
│   └── style.css       # Dark theme, responsive layout
├── config.example.json # Template — copy to config.json
├── config.json         # Your config (gitignored)
└── tsconfig.json
```

---

## Contributing

PRs welcome! Some ideas for contributions:
- Persistent storage option (SQLite)
- Multi-language support (currently German UI)
- Push notifications / WhatsApp integration
- Admin authentication for the reset button

---

## License

MIT — do whatever you want, attribution appreciated.

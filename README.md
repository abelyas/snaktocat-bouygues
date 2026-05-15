# 🐍 Snaktocat

**Nokia 3310-themed Snake game starring GitHub's Mona, built for the GitHub × Bouygues Telecom Workshop.**

## Features

- 🐍 Classic snake gameplay with Mona as the snake head
- 📱 Nokia 3310 phone frame wrapping the game canvas
- 📋 Registration with professional email validation
- 🔒 3 attempts per player (+ bonus via magic codes)
- 🏆 Top 5 live leaderboard (auto-refresh every 5s)
- 🔐 Password-protected admin dashboard
- 📥 XLSX export of all participants
- 🎟️ Magic code system for bonus attempts
- 🎮 Mobile-friendly with swipe controls

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL (Azure Flexible Server)
- **Deployment**: Azure Container Apps, Front Door, Key Vault

## Getting Started

```bash
npm install
npm run dev
```

Set environment variables:
```
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=your-admin-password
```

## Pages

| Route | Description |
|-------|------------|
| `/` | Registration page |
| `/game` | Snake game (inside Nokia 3310 frame) |
| `/leaderboard` | Top 5 live leaderboard |
| `/admin/login` | Admin login |
| `/admin` | Admin dashboard (players, export, magic codes) |

## Deployment

```bash
azd up
```

## License

Internal use only, GitHub × Bouygues Telecom.

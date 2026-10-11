# E-Cell Outreach CRM

An integrated Outreach and Partnership Relationship Management system designed specifically for Entrepreneurship Cells to manage corporate sponsors, keynote speakers, ecosystem partners, and sponsorship deal pipelines.

---

## Features
- **Sponsor & Partner Directory**: Organization deduplication and normalization by corporate domain and name.
- **Deal Pipeline Tracker**: Track sponsorship amounts, stages (PROSPECT, CONTACTED, PITCHED, NEGOTIATING, COMMITTED, WON, LOST), and owners.
- **Activity Logging**: Log calls, meetings, emails, and follow-ups with team members.
- **Data Protection & CSV Export**: Safe CSV export with formula injection sanitization.
- **Backup & Restore**: Built-in automated SQLite snapshot backup utility (`scripts/backup.ts`).

---

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + SQLite
- Authentication via JWT (`jose`) and `bcryptjs`
- Vitest unit testing suite

---

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Seed database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials
All seeded accounts use password: `password123`
- **Lead / Admin**: `aditi@ecell.org`
- **Member**: `rahul@ecell.org`

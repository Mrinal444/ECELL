# E-Cell Engineering Ecosystem (Assignments 1 – 4)

A unified repository containing four full-stack systems designed for university Entrepreneurship Cells, venture incubators, and startup ecosystems.

---

## Repository Index & Assignment Overview

| Folder | System Name | Core Domain | Key Highlights |
|---|---|---|---|
| [**`assignment 1/`**](./assignment%201/README.md) | **E-Cell Notetaker & Action Tracker** | Meeting Records & Task Execution | Next.js 14, SQLite + Prisma, Manifest V3 Chrome Extension, Web Speech API dictation, AI decision & action item extraction, background alarms, de-duplicated notifications. |
| [**`assignment 2/`**](./assignment%202/README.md) | **E-Cell Outreach CRM** | Corporate Sponsorships & Partnerships | Deal pipeline tracker, company domain normalization, contact activity logs, CSV security defense, automated database backup utility. |
| [**`assignment 3/`**](./assignment%203/README.md) | **PitchVault** | Competition & Pitch Judging | Mathematical rubric engine (sum to 100%), blind review masking, immutable lifecycle state machine (`DRAFT` → `PUBLISHED`), CSV injection defense, Vitest suite. |
| [**`assignment 4/`**](./assignment%204/README.md) | **MentorMatch** | Founder-Operator Mentorship | Deterministic multi-dimensional matching engine (domain, stage, skills, calendar availability), request workflow, session status machine, unit tests. |

---

## Repository Structure

```
ecell/
├── assignment 1/              # Meeting Notetaker & Action Tracker
│   ├── web/                   # Next.js 14 App Router Web Dashboard
│   ├── extension/             # Manifest V3 Chrome Extension (Vite + React)
│   ├── demo_data/             # Pre-formatted WhatsApp & meeting transcripts
│   └── README.md              # In-depth architectural & setup guide
│
├── assignment 2/              # E-Cell Outreach CRM
│   ├── src/                   # Pipeline deals, organizations, contacts
│   ├── prisma/                # SQLite schema and seeds
│   └── README.md              # CRM setup & credentials
│
├── assignment 3/              # PitchVault Competition Judging Platform
│   ├── src/                   # Rubric builder, blind scoring, leaderboard
│   ├── __tests__/             # Mathematical ranking & tiebreaker tests
│   └── README.md              # Judging flow & lifecycle replay guide
│
├── assignment 4/              # MentorMatch Platform
│   ├── src/                   # Deterministic matching engine & request booking
│   └── README.md              # Mentorship match rules & setup
│
└── README.md                  # This portfolio overview
```

---

## Quick Navigation & Running Each Assignment

Each assignment is a standalone full-stack application with its own dependencies, database migrations, and test suites:

### 1. Assignment 1: Notetaker & Action Tracker (+ Chrome Extension)
- **Navigate:** `cd "assignment 1/web"`
- **Setup:** `npm install && npm run prisma:setup`
- **Run Web App:** `npm run dev` (Runs on `http://localhost:3000`)
- **Chrome Extension:** `cd "../extension" && npm install && npm run build` (Load unpacked from `assignment 1/extension/dist`)
- **Demo Credentials:** `demo@ecell.org` / `ecell2026` (Pre-seeded extension token: `ecell_ext_token_demo_987654321`)
- **Detailed Docs:** Read [`assignment 1/README.md`](./assignment%201/README.md)

### 2. Assignment 2: Outreach CRM
- **Navigate:** `cd "assignment 2"`
- **Setup:** `npm install && npm run db:push && npm run db:seed`
- **Run:** `npm run dev`
- **Demo Credentials:** `aditi@ecell.org` / `password123`
- **Detailed Docs:** Read [`assignment 2/README.md`](./assignment%202/README.md)

### 3. Assignment 3: PitchVault Judging System
- **Navigate:** `cd "assignment 3"`
- **Setup:** `npm install && npm run db:reset`
- **Test Suite:** `npm test`
- **Run:** `npm run dev`
- **Demo Credentials:** Organizer: `admin@pitchvault.local` / `password123`, Judge: `judge.a@pitchvault.local`
- **Detailed Docs:** Read [`assignment 3/README.md`](./assignment%203/README.md)

### 4. Assignment 4: MentorMatch Founder-Operator Engine
- **Navigate:** `cd "assignment 4"`
- **Setup:** `npm install && npm run db:seed`
- **Test Suite:** `npm test`
- **Run:** `npm run dev`
- **Detailed Docs:** Read [`assignment 4/README.md`](./assignment%204/README.md)

---

## Shared Engineering Standards
- **Frameworks:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Data Layer:** SQLite with Prisma ORM for zero-configuration, standalone portability
- **Testing:** Unit & regression test coverage with Vitest
- **Security:** Hashed passwords (`bcryptjs`), JWT-based sessions, and defense against CSV formula injection

---

## Author
Maintained and submitted by [Mrinal444](https://github.com/Mrinal444).

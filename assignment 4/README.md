# MentorMatch MVP

MentorMatch is a curated founder-operator mentorship platform built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma, and SQLite. It pairs early-stage founders with proven operators based on deterministic domain, stage, skill, and calendar availability fit.

---

## Quick Start

### 1. Prerequisites & Dependencies
Ensure Node.js (v18+) is installed. Install packages:
```bash
npm install
```

### 2. Database Setup & Seeding
The project uses SQLite with Prisma 6.4+. Seed the database with 8 founders, 10 mentors, availability slots, requests, and relative-timestamped sessions:
```bash
npm run db:seed
```

Or to run a full reset and re-seed:
```bash
npm run db:reset
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
Vitest runs the pure matching engine tests and state-machine transition tests:
```bash
npm test
```

---

## Demo Credentials

All seeded accounts use password: `demo1234`

| Role | Email | Details |
|---|---|---|
| **Founder** | `priya@mentormatch.dev` | EduScale (EdTech, Seed stage) · Needs: GTM & Fundraising |
| **Mentor** | `arjun@mentormatch.dev` | Ex-VP Product at EdTech Unicorn · Domains: EdTech, SaaS · Stages: PreSeed, Seed |

*Note: The login page includes quick click-to-fill demo credential cards.*

---

## Product Features & Workflows

### 1. Deterministic Matching Engine (`src/lib/match.ts`)
Calculates a fit score out of 100 with a transparent reason string:
- **Domain Fit (40 pts):** Exact match (+40) or adjacent domain (+15) via graph adjacency.
- **Stage Fit (25 pts):** Exact stage match (+25) or neighbouring stage (+10).
- **Skill Needs Fit (25 pts):** Proportional coverage of founder needs by mentor skills.
- **Calendar Availability (10 pts):** Presence of open 60-minute slots in the next 14 days.

### 2. Guarded Connection Requests
- Only founders can initiate requests.
- Score and reason string are snapshotted at creation.
- Mentors can **Accept** or **Decline**.
- **14-Day Cooldown Policy:** A declined request cannot be re-sent for 14 days.

### 3. Session State Machine (`src/lib/actions/sessions.ts`)
- Sessions can only be requested against **ACCEPTED** matches.
- Bookable 60-minute slots are generated on-demand for the next 14 days based on weekly recurring IST availability, subtracting existing booked slots.
- State transitions: `REQUESTED` -> `CONFIRMED` (by mentor) -> `COMPLETED` (only after session start time passes) or `CANCELLED`.
- Dual private notes (`founderNotes`, `mentorNotes`) editable independently only once `COMPLETED`.

### 4. Discovery with Live Filters (`/discover`)
- Ranked matching cards displaying % fit, progress bar, reason string, and tags.
- Multi-dimensional filters for Domain, Stage, Skill, and "Has open slots (14d)".
- Designed empty states with a 1-click "Clear filters" action.

### 5. Profile & Availability Management (`/profile`)
- **Founders:** Edit startup name, pitch, domain, stage, and needs.
- **Mentors:** Edit headline, bio, expertise notes, supported domains/stages/skills, and add/remove weekly recurring availability windows (Asia/Kolkata IST).

---

## Architecture & Design Discipline

- **Authentication:** Passwords hashed with `bcryptjs`. Session JWTs signed with `jose` (HS256) stored in httpOnly, SameSite=Lax cookies.
- **Edge Middleware:** Token verification occurs at the edge without Prisma queries.
- **Design Tokens:** Editorial ink (`#1c1c1a`), paper (`#fdfbf7`), ochre accent (`#dca54c`), and olive secondary (`#8c9071`).
- **Motion:** Scoped GSAP micro-animations using `@gsap/react` and `gsap`.
- **Viewport Stability:** All full-screen viewports use `min-h-[100dvh]` with zero horizontal overflow.
- **Zero Em-Dash Rule:** Complies with strict typography guidelines.

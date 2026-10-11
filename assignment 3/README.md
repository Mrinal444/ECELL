# PitchVault

PitchVault accelerates the judging process for campus and venture competitions. Designed for clarity, structure, and impartial evaluation.

## Features
- **Structured Rubrics**: Weights must sum to 100%, ensuring mathematical precision.
- **Blind Review**: Mask team identities. Judges see only the problem, solution, and anonymized bios.
- **Immutable Results**: Handled through strict state transitions: DRAFT → OPEN → JUDGING → PUBLISHED.
- **Strong Typing**: Next.js App Router, Prisma ORM, and comprehensive domain unit tests with Vitest.
- **CSV Data Safety**: Formula injection defense implemented.

## Stack
- Next.js 14 (App Router) + Tailwind CSS + TypeScript
- Prisma + SQLite
- Auth via Custom Next.js Server Actions (with JWT using `jose` & bcrypt)
- Vitest

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Seed the database with demo accounts and data:
   ```bash
   npm run db:reset
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Demo Accounts
After seeding, you can log in with `password123`:
- Organizer: `admin@pitchvault.local`
- Judge A: `judge.a@pitchvault.local`
- Judge B: `judge.b@pitchvault.local`
- Team 1: `alice@pitchvault.local`
- Team 2: `bob@pitchvault.local`

## Complete Lifecycle Replay
If you want to experience the complete flow from scratch (`DRAFT` → `PUBLISHED`):

1. **Clear DB & Restart**:
   Run `npm run db:reset`. It will recreate the default seeded contest (which is in `JUDGING` state).
2. **Create New Contest**:
   Because we didn't add a UI button to create a *brand new contest* out-of-the-box in this MVP demo, you can modify `prisma/seed.js` to create the contest with `status: 'DRAFT'` instead of `'JUDGING'` and restart the flow:
   - Go to `prisma/seed.js`.
   - Set contest status to `'DRAFT'`.
   - Re-run `npm run db:reset`.
3. **Organizer Flow**:
   - Log in as `admin@pitchvault.local`.
   - Go to the contest dashboard.
   - Adjust the Rubric values (must equal 100%).
   - Click **Open Submissions**.
4. **Team Flow**:
   - Log out. Log in as `alice@pitchvault.local`.
   - Ensure the contest is `OPEN`. Wait until submissions are fully logged.
5. **Start Judging**:
   - Log as Organizer again, click **Start Judging**.
6. **Judge Flow**:
   - Log as `judge.a@pitchvault.local`.
   - View Queue, open the submission.
   - Fill out sliders and comments (blind review mode masks team identity).
   - "Submit Review" lock the scores.
7. **Publish**:
   - Log as Organizer.
   - Go to Progress Board (to verify completion) and click **Publish Results (Override)**.
   - Teams can now see their ranking, and all results are final.

## Development Tests
Run the deterministic Vitest test suite for scoring, lifecycle, CSV, and standard competition ranking rules (with tiebreakers):

```bash
npm run test
```

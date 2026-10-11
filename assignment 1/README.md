# E-Cell Meeting Notetaker & Action Tracker

> **A single system of record for entrepreneurship cell meetings, verified decisions, task owners, and deadlines — coupled with an intelligent browser capture companion.**

---

## 1. Problem & Core Idea

In student entrepreneurship cells and startup clubs, crucial agreements and decisions regularly get lost across fragmented WhatsApp threads, impromptu Google Meets, and forgotten notebook pages. Action items slip through the cracks because ownership and due dates are ambiguous, and no one updates static docs after the call ends.

**The Solution:**
- **The Web Dashboard is the System of Record:** Tracks meetings, verified decisions, task owners, deadlines, Kanban boards, and personal work queues.
- **The Chrome Extension is the Capture Layer:** Stops notes and decisions from dying in WhatsApp chats or video calls via live Web Speech dictation, 1-click line promotion, and instant server synchronization.
- **Background Reminders & In-Dashboard Banners:** Close the "deadline slipped" gap with de-duplicated desktop notifications and real-time status chips.

---

## 2. Architecture & Layered Scope

| Layer | Scope | Key Capabilities | Status |
|---|---|---|---|
| **L1: Core Web App** | Single system of record | Next.js 14 App Router, SQLite + Prisma ORM, Session Auth, Meetings CRUD, Decisions, Action Items, Kanban & List Action Board, "My Work" personal view, Overdue & Due-soon chips, Omni-search, Rich Seed Data | **Shipped (Production-Ready)** |
| **L2: Import + AI Extraction** | Intelligent NLP parser | WhatsApp `.txt` export / transcript import, Server-side AI extraction (`POST /api/extract`), Roster alias fuzzy matching, Relative date parsing, Offline rule-based NLP fallback, Interactive review table | **Shipped (Production-Ready)** |
| **L3: Extension Capture** | Fast side panel companion | Manifest V3 Chrome Extension, Web Speech API live voice dictation, Bearer token auth, 1-click line promotion to Decision / Action, Direct meeting sync | **Shipped (Production-Ready)** |
| **L4: Reminders** | Proactive alert system | Extension popup with overdue/today stats & 1-click completion, `chrome.alarms` service worker with de-duplicated `chrome.notifications`, In-dashboard "Due Soon" banner | **Shipped (Production-Ready)** |
| **L5: Live Capture (Stretch)** | Context injection | WhatsApp Web chat capture button, Google Meet meeting title & code auto-sync helper | **Shipped (Production-Ready)** |

---

## 3. Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18.17+ or v20+ (v24 tested)
- **Browser**: Google Chrome (for Web Speech API and extension side panel)

---

### Step 1: Run the Web Dashboard

1. Navigate to the `web` directory:
   ```bash
   cd "assignment 1/web"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize the database and run seed data:
   ```bash
   npm run prisma:setup
   ```
   *(This creates `prisma/dev.db` and populates realistic E-Cell team members, meetings, decisions, active/overdue action items, and API tokens).*

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Step 2: Build & Load the Chrome Extension

1. Navigate to the `extension` directory:
   ```bash
   cd "assignment 1/extension"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the Manifest V3 production bundle:
   ```bash
   npm run build
   ```
   *(This compiles Vite + React into the `assignment 1/extension/dist` folder).*

4. Load into Google Chrome:
   1. Open Chrome and navigate to `chrome://extensions`.
   2. Enable **Developer mode** (toggle in the top-right corner).
   3. Click **Load unpacked**.
   4. Select the directory: `assignment 1/extension/dist`.
   5. Pin the **E-Cell Notetaker** icon to your Chrome toolbar.

---

## 4. Demo Login Credentials

### Web Dashboard Account
- **Email:** `demo@ecell.org`
- **Password:** `ecell2026`
- **Role:** Core Team Lead (Member profile: *Siddharth Verma*)

### Extension Pre-Seeded API Token
- **API URL:** `http://localhost:3000`
- **API Token:** `ecell_ext_token_demo_987654321`
- *(The extension also includes a **"1-Click Use Pre-Seeded Demo Token"** button for instant pairing).*

---

## 5. Design Principles & Anti-Slop Discipline

- **Warm Paper Foundation:** Warm paper background (`#FAF8F5`, `#F4F0E8`), rich ink typography (`#191613`), deep teal accent (`#0F766E`), amber warning (`#D97706`), and bold overdue red (`#DC2626`).
- **Typography:** `Plus Jakarta Sans` for clean, professional legibility and `JetBrains Mono` for timestamps and technical badges.
- **Copywriting:** Clear, unambiguous labels with zero robotic AI filler copy.
- **Viewport Stability:** All layouts engineered with responsive auto-flowing grids, custom-styled scrollbars, and high contrast status indicators.

---

## 6. Key Features & Workflow Tour

### 1. Unified Dashboard (`/home`)
- **Due Soon & Overdue Banner:** Immediate high-visibility alerts for action items requiring attention within 48 hours or past their deadline.
- **Summary Metrics:** Total logged meetings, agreed decisions, active tasks, and team roster count.
- **Quick Actions:** Instant shortcuts to log new meetings, import WhatsApp chats, or view the Action Board.

### 2. Meetings System of Record (`/meetings`, `/meetings/[id]`)
- **Rich Meeting Details:** Organized cards for Agenda, Notes, Agreed Decisions, and Action Items.
- **Carry-Over Unfinished Actions:** 1-click button to carry over pending tasks from the previous meeting into the current agenda with full audit history (`carriedFromId`).
- **Real-Time Search:** Client-side and server-side filtering across meeting titles, raw transcript notes, decisions, and action item text.

### 3. WhatsApp & Transcript Import (`/import`)
- **Dual Mode:** Upload `.txt` files or paste messy chat logs directly.
- **Human-in-the-Loop AI Extraction:** Hits `POST /api/extract` to propose decisions, assignees, and due dates.
- **Fail-Safe Heuristic Fallback:** If OpenAI or external LLM API keys are not configured or the network is offline, a built-in NLP regex parser seamlessly extracts bullet points, speaker names, and relative date cues without failing.
- **Interactive Review Grid:** Allows users to adjust assignees via dropdown, modify due dates, delete spurious items, or add new items before saving.
- **Sample Files Provided:** Ready-to-use sample chat logs in `assignment 1/demo_data/sample_whatsapp_chat.txt` and `sample_core_team_sync.txt`.

### 4. Action Board (`/board`) & My Work (`/my-work`)
- **Action Board:** Kanban view (Open, In Progress, Done columns) and Filterable List view. Includes filters for Assignee, Status, and Overdue items.
- **My Work Personal Hub:** Filtered view for the logged-in member with quick 1-click status checkboxes to transition tasks directly to Done.

### 5. Chrome Extension Capture Companion (Side Panel)
- **Web Speech API Live Dictation:** Click "Start Live Speech Notes" for continuous voice transcription with interim visual feedback.
- **1-Click Line Promotion:** Select any line in your speech notes to promote it directly into a verified **Decision** or **Action Item**.
- **AI Extract in Side Panel:** Auto-parses speech notes into structured decisions and action items with team member matching.
- **Instant Cloud Sync:** Saves directly to the web app database with a direct link to open the meeting record.

### 6. Background Reminders & Popup
- **Extension Popup:** Shows overdue counts, items due today, and items due in the next 48 hours with 1-click "Done" toggling.
- **Service Worker (`chrome.alarms`):** Runs periodically in the background, checks `/api/actions/reminders`, and fires de-duplicated native desktop notifications.
- **Dynamic Badge Counter:** Displays the number of overdue tasks in red on the extension toolbar icon.

### 7. Live Capture Content Scripts (Stretch)
- **WhatsApp Web (`web.whatsapp.com`):** Floating "Capture Chat to E-Cell" button extracts visible messages or highlighted text and pipes them into the extension side panel.
- **Google Meet (`meet.google.com`):** Floating header pill detects the active meeting title and meeting code to populate the Side Panel title automatically.

---

## 7. Security & Privacy Architecture

- **Password Hashing:** Passwords hashed with `bcryptjs` (salt rounds: 10).
- **Dual Authentication:**
  - **Web Dashboard:** HTTP-only, secure session cookie (`ecell_session`) containing signed JWTs.
  - **Chrome Extension:** Revocable API tokens (`ApiToken` model) sent via `Authorization: Bearer <token>`, with SHA-256 validation on the backend.
- **Data Integrity:** SQLite foreign keys with cascade rules on attendees, decisions, and action items.
- **Raw Context Preservation:** Original transcripts and chat exports are permanently preserved in the `rawText` field of the meeting for complete auditability.

---

## 8. Known Limitations & Out-of-Scope Design Choices

| Feature | Design Decision & Limitation |
|---|---|
| **WhatsApp Integration** | Inbound capture only via paste, `.txt` file export, or DOM capture. Sending outbound WhatsApp messages is out of scope to prevent spam and avoid unofficial API bans. |
| **Google Meet Audio** | Web Speech API captures user/room mic audio when explicitly started by the user. Background tab audio sniffing is restricted by browser security policies. |
| **Browser Dependency** | Speech recognition and side panel features are optimized for Chromium-based browsers (Chrome, Edge, Brave). |
| **Notification Reliability** | Background alerts require Chrome to be running. For non-extension users, the web dashboard's top "Due Soon" banner serves as the primary reminder mechanism. |

---

## 9. Future Roadmap

- [ ] **WhatsApp Business API Webhook:** Automated daily summary digests to team leads.
- [ ] **Google Calendar Sync:** Auto-export scheduled action items and milestone deadlines to Google Calendar.
- [ ] **Slack / Discord Webhooks:** Post newly agreed decisions to an `#announcements` channel.
- [ ] **PostgreSQL Migration:** Multi-tenant support with row-level security for multi-university deployments.

---

## 10. Verification & Test Checklist

- [x] **Authentication:** Login, invalid password handling, session cookies, and API token generation.
- [x] **Meetings CRUD:** Create, edit, view, delete meetings with associated decisions and action items.
- [x] **Carry-Over Logic:** Carry over unfinished actions from prior meetings.
- [x] **Import & AI Extraction:** Parse WhatsApp `.txt` logs, fuzzy-match assignees against roster aliases, resolve relative dates ("by Friday"), and fall back cleanly if AI keys are absent.
- [x] **Action Board & My Work:** Kanban drag-style status shifts, list filters, overdue badges, and instant completion.
- [x] **Chrome Extension Side Panel:** Live Web Speech voice dictation, line promotion to decisions/actions, and cloud save.
- [x] **Extension Popup & Reminders:** Overdue task badge, popup filter tabs, and background alarms.
- [x] **Live Content Scripts:** WhatsApp Web floating capture button and Google Meet title helper.

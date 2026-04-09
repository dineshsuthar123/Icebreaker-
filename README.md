# Icebreaker Board Game — Live Facilitation Platform

A real-time web-based board game designed for innovation workshop icebreakers. A facilitator creates a session and projects it on a shared screen. Participants join in seconds by scanning a QR code — no login, no app install, no friction. Teams take turns on a shared board, completing collaborative prompts that warm up a room before ideation begins.

Built as a focused MVP for rapid deployment in live workshop settings.

---

## Overview

This application solves a specific problem: **getting a room of strangers to interact before a workshop begins**. Traditional icebreakers are awkward, hard to scale, and difficult to facilitate. This platform turns icebreaking into a structured, facilitator-controlled game that runs on any device with a browser.

**Design principles:**
- Zero-friction participant onboarding (QR scan → enter name → play)
- Facilitator stays in full control at all times
- Non-competitive by design — no scoring, no winners, no pressure
- Prompts drive real-world interaction, not screen time
- Designed to transition naturally into structured ideation

---

## Features

### Host / Facilitator
- Create a session with 2–8 named teams
- Configure max rounds and board size
- Display a QR code and 6-character join code for instant participant onboarding
- Control the full game lifecycle: start, advance turns, reset turns, end game
- Large-screen optimized layout for projection

### Participants
- Join by scanning QR code or entering a short join code
- No login, no account creation, no app install
- Automatic captain assignment (first player per team)
- Captain-only dice rolling enforced by server
- Mobile-optimized view with live state updates

### Game Mechanics
- All teams share one board with cycling space types: Move, Talk, Create, Wildcard
- Fixed turn rotation across teams
- Server-authoritative dice roll (1–6)
- Prompt selected based on landed space type
- No-repeat prompt logic within a session (fallback: any unused → reuse if exhausted)
- Game ends by host decision or after configured max rounds

### Prompt System
- 35 seed prompts included (10 Move, 10 Talk, 10 Create, 5 Wildcard)
- Persistent storage in database
- Admin panel for full CRUD: add, edit, enable/disable, delete
- Filter by prompt type
- Expandable — facilitators can add custom prompts before a session

### Real-Time Sync
- All connected clients (host + participants) receive live updates
- Powered by Supabase Realtime with PostgreSQL change notifications
- Debounced client-side fetch to prevent redundant queries

---

## Tech Stack

| Technology | Role |
|---|---|
| **Next.js** (App Router) | Full-stack framework — server actions + React UI |
| **TypeScript** | End-to-end type safety |
| **Tailwind CSS** | Utility-first responsive styling |
| **Supabase** | PostgreSQL database + Row Level Security + Realtime |
| **qrcode.react** | Client-side QR code generation |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│                  Next.js App                  │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Host   │  │  Player  │  │   Admin     │ │
│  │  View   │  │  View    │  │   Panel     │ │
│  └────┬────┘  └────┬─────┘  └──────┬──────┘ │
│       │             │               │         │
│  ┌────▼─────────────▼───────────────▼──────┐ │
│  │         Server Actions (game.ts,        │ │
│  │         session.ts, prompts.ts)         │ │
│  └────────────────┬────────────────────────┘ │
└───────────────────┼──────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │      Supabase         │
        │  ┌─────────────────┐  │
        │  │   PostgreSQL    │  │
        │  │  sessions       │  │
        │  │  teams          │  │
        │  │  participants   │  │
        │  │  turns          │  │
        │  │  prompts        │  │
        │  │  prompt_history │  │
        │  └────────┬────────┘  │
        │           │           │
        │  ┌────────▼────────┐  │
        │  │    Realtime     │  │
        │  │  (WebSocket)    │  │
        │  └─────────────────┘  │
        └───────────────────────┘
```

**Key architectural decisions:**
- **Server actions** handle all mutations — dice rolls, turn management, prompt selection. No client-side writes to game state.
- **Conditional database updates** (`UPDATE ... WHERE status = 'expected'`) prevent race conditions on dice rolls, prompt selection, and turn completion.
- **Debounced realtime subscriptions** coalesce rapid change events to prevent query storms with many connected clients.
- **Session-keyed localStorage** preserves participant identity across page refreshes without requiring accounts.

---

## Setup

### Prerequisites

- Node.js 18+
- npm
- A free [Supabase](https://supabase.com) account

### 1. Supabase Project

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Settings → API** and copy the **Project URL** and **anon public key**.

### 2. Database Setup

1. Open the **SQL Editor** in the Supabase dashboard.
2. Paste and run `supabase/schema.sql` — creates all tables, indexes, RLS policies, and enables realtime publications.
3. Paste and run `supabase/seed.sql` — inserts 35 icebreaker prompts.

### 3. Verify Realtime

In Supabase Dashboard → **Database → Replication**, confirm these tables are enabled for realtime:
- `sessions`, `teams`, `participants`, `turns`

(The schema already configures this, but verify in the dashboard.)

### 4. Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Hosting a Game

1. Open `/` → click **"Create Session (Host)"**
2. Name 2–8 teams, set rounds and board size → click **"Create Session"**
3. Project the host screen — it shows a QR code and join code
4. Participants join on their phones
5. Click **"▶ Start Game"** when ready
6. Each turn: roll dice → show prompt → team does the activity → click **"✓ Done — Next Turn"**
7. Use **"Reset Turn"** if needed, **"End Game"** when finished

### Joining as a Participant

1. Scan the QR code displayed on the host screen (or enter the 6-character code at `/`)
2. Enter your name and choose a team — no login required
3. The first player on each team becomes **captain** and can roll the dice
4. Follow along on your phone — state updates in real time

### Managing Prompts (Admin)

1. Go to `/admin` (linked from the home page)
2. Add prompts with a type (Move, Talk, Create, Wildcard)
3. Edit, enable/disable, or delete existing prompts
4. Filter the list by type
5. Prompts are available immediately in new game sessions

### Prompt Seeding

The `supabase/seed.sql` file includes 35 ready-to-use icebreaker prompts:
- **10 Move**: Physical activities (e.g., "Everyone stand up and switch seats")
- **10 Talk**: Discussion starters (e.g., "Two truths and a lie")
- **10 Create**: Creative tasks (e.g., "Draw your team mascot in 60 seconds")
- **5 Wildcard**: Surprise activities (e.g., "The host picks any player for the next activity")

Additional prompts can be added via the admin panel at any time.

---

## Project Structure

```
src/
├── app/                            # Next.js App Router pages
│   ├── page.tsx                    # Home — create session or join
│   ├── layout.tsx                  # Root layout
│   ├── admin/page.tsx              # Prompt management admin panel
│   ├── host/create/page.tsx        # Session creation form
│   ├── host/[sessionId]/page.tsx   # Host game view (lobby → playing → ended)
│   ├── join/[code]/page.tsx        # Participant join page
│   └── play/[sessionId]/page.tsx   # Participant game view
├── components/                     # Reusable UI components
│   ├── DiceRoller.tsx              # Animated dice roller
│   ├── GameBoard.tsx               # Board visualization with tokens
│   ├── PromptCard.tsx              # Category-styled prompt display
│   ├── QRJoin.tsx                  # QR code + join code widget
│   └── TeamList.tsx                # Team roster with captain indicator
├── hooks/
│   └── useGameState.ts             # Realtime state subscription (debounced)
└── lib/
    ├── supabase.ts                 # Supabase client initialization
    ├── types.ts                    # TypeScript types + board space logic
    └── actions/
        ├── session.ts              # Session lifecycle + participant join
        ├── game.ts                 # Dice roll, prompt selection, turn flow
        └── prompts.ts              # Admin prompt CRUD
supabase/
├── schema.sql                      # Database schema (6 tables + RLS + realtime)
└── seed.sql                        # 35 seed prompts
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Base URL for QR code links (default: `http://localhost:3000`) | Optional |

---

## Known Limitations

These are intentional scope decisions for a 1-day MVP build:

- **No authentication**: Designed for facilitator-led sessions where trust is assumed. Host and admin routes are accessible by URL. Production deployment would add role-based access.
- **Single facilitator model**: One host controls each session. Multi-host or co-facilitation is out of scope.
- **Captain persistence**: If a captain leaves, no automatic reassignment occurs. The host can continue driving the game from the host screen, which has full dice and turn controls.
- **Prompt pool size**: 35 prompts are seeded. Long sessions may exhaust the pool, at which point prompts are reused. Additional prompts can be added via the admin panel before a session.
- **Browser-based identity**: Participant state is stored in browser localStorage, keyed by session. Clearing browser data requires rejoining.
- **Online required**: All participants need an active internet connection. No offline or PWA mode.
- **Realtime dependency**: Live sync requires Supabase Realtime to be enabled. If unavailable, a manual page refresh still shows the current state.

---

## Future Improvements

If extended beyond the MVP:
- Role-based authentication for host and admin
- Automatic captain reassignment on disconnect
- Facilitator prompt customization per session
- Session history and replay
- Exportable session summary for workshop documentation

---

## Troubleshooting

| Issue | Solution |
|---|---|
| QR code shows `localhost` | Set `NEXT_PUBLIC_APP_URL` in `.env.local` to your public URL or ngrok URL |
| Realtime not updating | Verify realtime is enabled for `sessions`, `teams`, `participants`, `turns` in Supabase → Database → Replication |
| "No prompts available" error | Run `supabase/seed.sql` in the SQL Editor, or add prompts via `/admin` |
| Player lost after refresh | Identity is stored in localStorage. If cleared, the player must rejoin via the join code |
| Build fails | Ensure Node.js 18+ and run `npm install` before `npm run dev` |
#   I c e b r e a k e r -  
 
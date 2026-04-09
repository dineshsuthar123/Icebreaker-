# Icebreaker - Real-Time Facilitation Board Game for Innovation Workshops

---

## Overview

A full-stack web application that turns workshop icebreaking into a structured, facilitator-controlled board game. The host creates a session and projects it on a shared screen. Participants join instantly by scanning a QR code - no login, no app install. Teams take turns rolling dice, landing on themed spaces, and completing collaborative prompts that warm up a room before ideation begins.

Built as a focused MVP for Topcoder's Rapid Application Development challenge.

---

## Features

- Host creates a session with 2-8 named teams, configures max rounds and board size
- QR code and 6-character join code for zero-friction participant onboarding
- No authentication required - participants enter a name and choose a team
- First participant per team is auto-assigned as captain
- Captain-only dice rolling, enforced server-side
- Shared turn-based board with 4 cycling space types: Move, Talk, Create, Wildcard
- Prompt shown per landed space; no-repeat logic within a session
- Host controls full game lifecycle: start, advance, reset turn, end game
- Real-time sync across all connected devices via Supabase Realtime
- Admin panel for prompt CRUD with type filtering

---

## Tech Stack

| Technology | Role |
|---|---|
| Next.js 16 (App Router) | Full-stack framework, server actions |
| TypeScript | End-to-end type safety |
| Tailwind CSS v4 | Utility-first responsive styling |
| Supabase | PostgreSQL database + Row Level Security |
| Supabase Realtime | WebSocket-based live state sync |
| qrcode.react | Client-side QR code generation |

---

## Project Structure

```
src/
  app/                        # Pages (App Router)
    page.tsx                  # Home
    layout.tsx                # Root layout
    globals.css               # Global styles
    admin/page.tsx             # Prompt management
    host/create/page.tsx       # Session creation
    host/[sessionId]/page.tsx  # Host game view
    join/[code]/page.tsx       # Participant join
    play/[sessionId]/page.tsx  # Participant game view
  components/                 # Reusable UI components
    DiceRoller.tsx            # Animated dice roller
    GameBoard.tsx             # Board visualization with tokens
    PromptCard.tsx            # Category-styled prompt display
    QRJoin.tsx                # QR code + join code widget
    TeamList.tsx              # Team roster with captain indicator
  hooks/
    useGameState.ts           # Debounced realtime subscription
  lib/
    supabase.ts               # Supabase client initialization
    types.ts                  # TypeScript types + board space logic
    actions/
      session.ts              # Session lifecycle + participant join
      game.ts                 # Dice roll, prompt selection, turn flow
      prompts.ts              # Admin prompt CRUD
supabase/
  schema.sql                  # All tables, indexes, RLS policies, realtime config
  seed.sql                    # 35 seed prompts
```

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the dashboard, go to **Settings > API** and copy:
   - **Project URL**
   - **anon public key**

### 3. Run the database schema

1. Open the **SQL Editor** in the Supabase dashboard.
2. Paste the contents of `supabase/schema.sql` and run it.

### 4. Seed the prompts

1. In the SQL Editor, paste the contents of `supabase/seed.sql` and run it.
2. This inserts 35 ready-to-use icebreaker prompts.

### 5. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase credentials (see **Environment Variables** below).

### 6. Verify Realtime

In Supabase Dashboard > **Database > Replication**, confirm these tables are enabled for realtime:
`sessions`, `teams`, `participants`, `turns`

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both variables are required. An `.env.example` file is included in the repository. The app will throw a descriptive error on startup if either variable is missing.

---

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint
```

---

## How to Use

### Host Flow

1. Go to `/` and click **Create Session (Host)**
2. Name 2-8 teams, set max rounds and board size
3. Click **Create Session** - the lobby opens with a QR code and join code
4. Project the host screen; participants scan the QR code or enter the short code
5. Click **Start Game** when ready
6. Each turn: active team captain rolls dice > prompt appears > team completes activity > click **Done - Next Turn**
7. Use **Reset Turn** to redo a turn, or **End Game** to finish early

### Participant Flow

1. Scan the QR code on the host screen or go to `/join/[code]`
2. Enter your name and select a team - no login required
3. The first player per team becomes captain and can roll the dice
4. All game state updates live on every device

### Admin Flow

1. Go to `/admin`
2. Add, edit, enable/disable, or delete prompts
3. Filter prompts by type (Move, Talk, Create, Wildcard)
4. Changes are reflected immediately in new game sessions

---

## Routes

| Route | Description |
|---|---|
| `/` | Home - create session or enter join code |
| `/host/create` | Session creation form |
| `/host/[sessionId]` | Host game view (lobby, playing, ended) |
| `/join/[code]` | Participant join page |
| `/play/[sessionId]` | Participant game view |
| `/admin` | Prompt management panel |

---

## Prompt Management Notes

- Prompts are grouped into four categories: **Move**, **Talk**, **Create**, **Wildcard**
- When a team lands on a space, a prompt matching the space type is selected
- **No-repeat logic**: prompts already used in a session are excluded from selection
- **Fallback**: if all prompts of a type are exhausted, any unused prompt is selected; if all prompts are exhausted, prompts are reused
- 35 prompts are seeded via `seed.sql`; additional prompts can be added at any time via `/admin`

---

## Reliability / Implementation Notes

- **Server-authoritative game logic**: all mutations (dice rolls, prompt selection, turn completion) run as Next.js server actions - no client-side writes to game state
- **Race condition prevention**: critical DB updates use conditional writes (`UPDATE ... WHERE status = 'expected'`), preventing double-rolls and duplicate prompt assignments
- **Realtime sync**: all connected clients subscribe to live Supabase change events; a 200ms debounce prevents redundant query storms when multiple tables change in rapid succession
- **Session identity**: participant identity is stored in `localStorage`, keyed by session ID, so page refreshes do not require rejoining
- **Inline error handling**: all user actions show inline error banners instead of blocking alerts
- **Runtime env validation**: the app throws a clear error on startup if Supabase credentials are missing

---

## Known Limitations

These are intentional MVP scope decisions:

- **No authentication**: host and admin routes are accessible by URL - appropriate for facilitated, trusted-room settings
- **Single-host model**: one host drives each session; multi-host or co-facilitation is out of scope
- **Captain persistence**: if a captain disconnects, no automatic reassignment occurs; the host screen retains full dice and turn controls as a fallback
- **Browser identity**: participant state is tied to `localStorage`; clearing browser storage requires rejoining via the join code
- **Online required**: all participants must have an active internet connection - no offline or PWA support
- **Realtime dependency**: live sync requires Supabase Realtime to be enabled; a manual page refresh still shows current state if Realtime is unavailable

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Realtime not updating | In Supabase dashboard > Database > Replication, confirm `sessions`, `teams`, `participants`, `turns` are enabled |
| "No prompts available" error | Run `supabase/seed.sql` in the SQL Editor, or add prompts via `/admin` |
| Participant lost after refresh | Identity is auto-restored from localStorage. If cleared, rejoin via the join code |
| QR code shows wrong URL | QR URL is auto-detected from the browser. Ensure the host accesses the app via the public URL, not localhost |
| Build fails | Ensure Node.js 18+ is installed and run `npm install` before building |

---

## Future Improvements

- Role-based access for host and admin routes
- Automatic captain reassignment on participant disconnect
- Per-session prompt customization by the host
- Session history and exportable summary
- PWA support for offline-capable participant views

---

## Submission Notes

- The application builds and runs locally with `npm run dev` after completing setup
- `supabase/schema.sql` and `supabase/seed.sql` are included for full database setup
- `.env.example` documents all required environment variables
- No paid services required - a free Supabase tier is sufficient
- Zero lint errors, zero build warnings
- Designed and built as a rapid MVP for real-world workshop facilitation use cases
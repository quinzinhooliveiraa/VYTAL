# FitStake

Fitness/sports challenge web app with financial stakes (Pix payments). Users create challenges with monetary entry fees, invite friends, track progress, and win from the prize pool. Platform takes 10% fee.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (node-postgres driver)
- **Auth**: bcryptjs + express-session + connect-pg-simple
- **Routing**: wouter (frontend)
- **State**: TanStack React Query

## Architecture
- `shared/schema.ts` — Drizzle schema & Zod insert schemas
- `server/db.ts` — PostgreSQL connection via node-postgres
- `server/storage.ts` — IStorage interface + DatabaseStorage implementation
- `server/routes.ts` — Express API routes
- `client/src/hooks/use-auth.ts` — Auth hook (login, register, logout mutations + user query)
- `client/src/App.tsx` — Root with auth-based routing

## Database Tables
users, challenges, challengeParticipants, checkIns, messages, follows, communities, communityMembers, walletTransactions

## API Routes
- **Auth**: POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, GET `/api/auth/me`
- **Users**: GET `/api/users/search`, `/api/users/:username`, PATCH `/api/users/me`
- **Challenges**: GET/POST `/api/challenges`, GET `/api/challenges/:id`, POST `/api/challenges/:id/join`
- **Check-ins**: POST `/api/checkins`
- **Messages**: GET `/api/messages/conversations`, GET `/api/messages/:username`, POST `/api/messages`
- **Follows**: GET/POST/DELETE `/api/follows/:username`, GET `/api/follows/status/:username`, `/api/follows/followers`, `/api/follows/following`
- **Communities**: GET `/api/communities`, POST `/api/communities`, GET `/api/communities/mine`, POST `/api/communities/:id/join`, DELETE `/api/communities/:id/leave`
- **Wallet**: GET `/api/wallet/balance`, `/api/wallet/transactions`, POST `/api/wallet/deposit`

## Frontend Pages
- `/login` — Login/register form
- `/onboarding` — New user onboarding (saves profile via API)
- `/dashboard` — Main feed
- `/explore` — Browse challenges
- `/create` — Create challenge
- `/challenge/:id` — Challenge details
- `/check-in/:id` — Check-in flow
- `/profile` — Own profile
- `/settings` — Settings (logout calls real API)
- `/wallet` — Wallet with real balance/transactions from API
- `/user/:username` — Public profile (real API data, follow/unfollow)
- `/friends` — Following/followers/suggestions
- `/chat-hub` — Conversations list (real API)
- `/messages/:username` — DM chat (real API)
- `/communities` — Community list
- `/create-community` — Create community

## Design
- **Primary color**: `--primary: 145 65% 38%` (light) / `145 65% 48%` (dark)
- **Fonts**: Inter (sans) + Space Grotesk (display)
- **Border radius**: 0.75rem
- **Language**: Brazilian Portuguese (pt-BR)

## Key Notes
- Session stored in PostgreSQL via connect-pg-simple
- Use `drizzle-orm/node-postgres` (NOT neon-serverless)
- IDs are UUIDs (varchar with `gen_random_uuid()`)
- `SESSION_SECRET` env var required

# VYTAL

Fitness/sports challenge web app with financial stakes (Pix payments). Users create challenges with monetary entry fees, invite friends, track progress, and win from the prize pool. Platform takes 10% fee.

## Onboarding (5 steps)
1. **Legal Terms** — Accept terms of use, privacy policy, financial terms, and image consent
2. **How It Works** — 4-step overview (bet, check-in, moderation, profit) + 10% fee explanation
3. **Personalization** — Name input + goal selection (weight loss, hypertrophy, cardio, discipline)
4. **Notifications + PWA** — Enable push notifications, install PWA (iOS/Android instructions)
5. **Final** — Completion screen with invite friends + explore button

## PWA
- `client/public/manifest.json` — Web App Manifest (standalone, portrait, green theme)
- `client/public/sw.js` — Service Worker (cache-first for static, network-first with offline fallback)
- `client/src/hooks/use-pwa-install.ts` — PWA install prompt hook (supports Android + iOS instructions)
- PWA meta tags in `client/index.html` (apple-mobile-web-app-capable, theme-color, manifest link)
- Service worker registered in `client/src/main.tsx`

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (node-postgres driver)
- **Auth**: bcryptjs + express-session + connect-pg-simple + Replit OIDC (Google/Apple social login)
- **Payments**: AbacatePay API (Pix deposits/withdrawals)
- **Routing**: wouter (frontend)
- **State**: TanStack React Query

## Architecture
- `shared/schema.ts` — Drizzle schema & Zod insert schemas
- `server/db.ts` — PostgreSQL connection via node-postgres
- `server/storage.ts` — IStorage interface + DatabaseStorage implementation
- `server/routes.ts` — Express API routes
- `server/services/` — Financial service modules:
  - `wallet-service.ts` — Balance ops, lock/unlock for challenges/withdrawals
  - `transaction-service.ts` — Create/update transactions, idempotency keys
  - `payment-service.ts` — AbacatePay API integration (Pix charges, withdrawals)
  - `webhook-service.ts` — Process payment confirmations, withdrawal status
  - `challenge-finance-service.ts` — Entry fees, prize distribution, platform fees
- `client/src/hooks/use-auth.ts` — Auth hook (login, register, logout mutations + user query)
- `client/src/App.tsx` — Root with auth-based routing

## Database Tables
- **Core**: users (with cpf, phone fields), challenges (with isPrivate), challengeParticipants, challengeJoinRequests (pending/approved/rejected), checkIns (with status active/completed, checkedOutAt, isIndoor, locationName, endLocationName, flagged, flagReason), messages, follows, communities, communityMembers, challengeMessages
- **Financial**: wallets (balance + locked_balance per user), transactions (with status, external_id, idempotency_key, metadata)
- **Support**: supportTickets (id, userId, type[feedback/suporte/ideia], message, status[open/resolved/closed], adminNotes, createdAt)
- **Legacy**: walletTransactions (kept for backward compatibility)

## Communities Business Model
- Communities have `ownerFeePercent` (default 5%) — community owner earns % of challenge prize pool for challenges linked to their community
- Communities only appear publicly when they have 50+ members
- Challenges can be linked to a community via `communityId` field
- Revenue split: 10% platform fee + community owner fee from remaining pool

## Financial System
- **Wallet**: Internal balance tracking. `available_balance = balance - locked_balance`
- **Deposits**: Pix via AbacatePay → QR code → webhook confirms → balance credited
- **Withdrawals**: Async flow → lock balance → gateway processes → webhook confirms → balance deducted
- **Challenge entry**: Entry fee locked from balance. On finalization: locked amounts deducted, prizes distributed, 10% platform fee.
- **Fraud prevention**: Idempotency keys, row-level balance checks, locked balance for pending ops, no negative balances
- **Limits**: Minimum R$ 30 for deposits and withdrawals
- **Simulation mode**: When ABACATEPAY_API_KEY is not set, deposits/withdrawals complete instantly (dev mode)

## API Routes
- **Auth**: POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, GET `/api/auth/me`, GET `/api/login` (social OIDC), GET `/api/callback` (OIDC callback)
- **Users**: GET `/api/users/search`, `/api/users/:username`, PATCH `/api/users/me`
- **Challenges**: GET/POST `/api/challenges`, GET `/api/challenges/:id`, POST `/api/challenges/:id/join`, POST `/api/challenges/:id/request-join`, GET `/api/challenges/:id/join-requests`, POST `/api/challenges/:id/join-requests/:requestId/approve`, POST `/api/challenges/:id/join-requests/:requestId/reject`, POST `/api/challenges/:id/finalize`
- **Check-ins**: POST `/api/check-ins/start` (start active check-in with photo), POST `/api/check-ins/:checkInId/checkout` (complete with end photo, server calculates duration), GET `/api/check-ins/active` (get user's active check-ins), POST `/api/check-ins/location-update` (send GPS update, triggers push reminder if user moved >500m), POST `/api/check-ins` (legacy), GET `/api/check-ins/:challengeId`
- **Messages**: GET `/api/messages/conversations`, GET `/api/messages/:username`, POST `/api/messages`
- **Follows**: GET/POST/DELETE `/api/follows/:username`, GET `/api/follows/status/:username`, `/api/follows/followers`, `/api/follows/following`
- **Communities**: GET `/api/communities`, POST `/api/communities`, GET `/api/communities/mine`, POST `/api/communities/:id/join`, DELETE `/api/communities/:id/leave`
- **Support**: POST `/api/support` (create ticket), GET `/api/support/mine` (user's tickets)
- **Avatar**: POST `/api/users/avatar` (save cropped avatar)
- **Admin**: GET `/api/admin/stats`, `/api/admin/transactions`, `/api/admin/users`, `/api/admin/suspicious`, `/api/admin/support`, PATCH `/api/admin/support/:id`. Requires `isAdmin: true`.

## Admin Panel
- Route: `/admin` (accessible from profile page via shield icon, only visible for admin users)
- Tabs: Resumo, Transações, Usuários, Alertas, Suporte
- Shows platform revenue (10% fees), total deposits/withdrawals, user balances, transaction history, support tickets
- Admin emails: quinzinhooliveiraa@gmail.com and oliveirasocial74@gmail.com (isAdmin=true in DB)
- **Wallet**: GET `/api/wallet/balance` (returns balance, lockedBalance, availableBalance), GET `/api/wallet/transactions`, POST `/api/wallet/deposit`, POST `/api/wallet/withdraw`, GET `/api/wallet/deposit/:id/status`
- **Webhooks**: POST `/api/webhooks/abacatepay`

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session encryption key
- `ABACATEPAY_API_KEY` — AbacatePay API key (optional for dev simulation mode)

## Design
- **Primary color**: `--primary: 145 65% 38%` (light) / `145 65% 48%` (dark). DO NOT revert.
- **Fonts**: Inter (sans) + Space Grotesk (display)
- **Border radius**: 0.75rem
- **Language**: Brazilian Portuguese (pt-BR)

## Key Notes
- Session stored in PostgreSQL via connect-pg-simple
- Use `drizzle-orm/node-postgres` (NOT neon-serverless)
- IDs are UUIDs (varchar with `gen_random_uuid()`)
- Transaction types: deposit, challenge_entry, challenge_win, withdraw_request, withdraw_processing, withdraw_completed, platform_fee, refund
- Transaction statuses: pending, processing, completed, failed

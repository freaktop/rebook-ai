# Rebook AI

Automated customer rebooking and retention system. Owned commercially by AI Cipher Agency.

Rebook AI reminds existing customers when they are due to book their next appointment. It is an independent SaaS product: its own repository, architecture, deployment, database, and administration.

## Stack
- Next.js 14 (App Router), React, TypeScript
- Prisma + PostgreSQL
- NextAuth (credentials) for business admin auth
- Resend for email delivery
- Vercel for hosting + cron

## Local development
1. Copy `.env.example` to `.env.local` and fill values.
2. `npm install`
3. `npx prisma migrate dev`
4. `npm run db:seed`
5. `npm run dev`

Default seeded login: `admin@rebook.ai` / `demo1234`

## Tests
`npm test`

## Deployment
See `docs/DEPLOYMENT.md`.

## Integration
See `docs/INTEGRATION.md` (PerezBooking adapter).

## Status
See `docs/STATUS.md`.
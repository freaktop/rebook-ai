# Deployment

## Prerequisites
- Vercel account (hobby or pro)
- PostgreSQL database (Neon, Supabase, or any Postgres)
- Resend account with a verified sender domain
- A webhook signing secret shared with the booking system

## Steps
1. Create a Vercel project linked to this repo.
2. Provision a Postgres database. Accept the marketplace terms in the Vercel dashboard if using an integration.
3. Set environment variables in Vercel (Production):
   - `DATABASE_URL` (Postgres connection string)
   - `NEXTAUTH_URL` (production URL)
   - `NEXTAUTH_SECRET` (long random string)
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `REBOOK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `CRON_SECRET`
4. Run migrations: `npx prisma migrate deploy` (with DATABASE_URL set).
5. Seed initial business/admin: `npm run db:seed`.
6. Deploy: `vercel --prod`.

## Cron
Vercel hobby limits cron to once per day. The default schedule runs daily at 09:00 UTC.
For more frequent reminder processing, trigger `/api/cron/send-reminders` with `Authorization: Bearer <CRON_SECRET>` from an external scheduler (e.g., GitHub Actions) every hour.

## Health check
`GET /api/health` returns 200 when the database is reachable.
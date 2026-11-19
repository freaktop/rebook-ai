# PerezBooking Integration

PerezBooking is a PHP/MySQL booking engine. Its schema (verified from `database/perez-booking.sql`) uses:
- `rzvy_customers` (id, email, firstname, lastname, phone, ...)
- `rzvy_bookings` (id, order_id, customer_id, booking_datetime, booking_end_datetime, booking_status, service_id, service_rate, staff_id)
- `rzvy_services` (id, title, ...)
- `rzvy_payments` (order_id, payment_method, transaction_id, net_total, ...)

Booking status values include: pending, confirmed, confirmed_by_staff, rescheduled_*, cancelled_by_customer, rejected_*, completed.

## Adapter
`lib/integrations/perezbooking.ts` maps PerezBooking rows to normalized Rebook AI events:
- `mapCompletedAppointment(...)` for `booking_status = completed`
- `mapNewBooking(...)` for new bookings (suppression)

## Webhook contract
`POST /api/webhooks/perezbooking`
Headers:
- `X-Rebook-Signature`: HMAC-SHA256 hex of raw body using `REBOOK_WEBHOOK_SECRET`
- `X-Rebook-Timestamp`: unix seconds (replay window 5 min)
- `X-Idempotency-Key`: unique per event

Body (normalized):
```json
{
  "event": "appointment.completed" | "booking.created",
  "businessSlug": "demo-business",
  "idempotencyKey": "pb:completed:123",
  "data": { "customer": {...}, "appointment": {...} }
}
```

## What remains unconnected
PerezBooking does not emit webhooks natively. To connect:
1. Add a PHP hook in PerezBooking that POSTs to this endpoint on status change, OR
2. Run a polling worker that reads `rzvy_bookings` where `booking_status` changed and forwards events.

Credentials/access to the live PerezBooking MySQL instance are required for end-to-end testing. Until then, the adapter and contract are implemented and unit-tested.
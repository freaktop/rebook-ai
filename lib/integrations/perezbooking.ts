// Adapter for PerezBooking (PHP/MySQL booking engine).
// Maps PerezBooking rows to Rebook AI normalized events.
// Source schema verified from database/perez-booking.sql.

export interface PerezBookingCustomer {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
}

export interface PerezBookingService {
  id: number;
  title: string;
}

export interface PerezBookingBooking {
  id: number; // rzvy_bookings.id
  order_id: number;
  customer_id: number;
  booking_datetime: string; // "YYYY-MM-DD HH:MM:SS"
  booking_end_datetime: string;
  booking_status: string; // pending|confirmed|...|completed|cancelled_by_customer|...
  service_id: number;
  service_rate: number;
  staff_id: string;
}

export interface NormalizedCompletedAppointment {
  type: "appointment.completed";
  idempotencyKey: string;
  customer: { externalId: string; email: string; firstName: string; lastName: string; phone?: string };
  appointment: { externalId: string; serviceName: string; completedAt: string; status: string };
}

export interface NormalizedNewBooking {
  type: "booking.created";
  idempotencyKey: string;
  customer: { externalId: string; email: string };
  booking: { externalId: string; serviceName?: string; scheduledAt: string };
}

export function mapCompletedAppointment(
  booking: PerezBookingBooking,
  customer: PerezBookingCustomer,
  service: PerezBookingService
): NormalizedCompletedAppointment {
  return {
    type: "appointment.completed",
    idempotencyKey: `pb:completed:${booking.id}`,
    customer: {
      externalId: String(customer.id),
      email: customer.email,
      firstName: customer.firstname,
      lastName: customer.lastname,
      phone: customer.phone,
    },
    appointment: {
      externalId: String(booking.id),
      serviceName: service.title,
      completedAt: booking.booking_datetime,
      status: booking.booking_status,
    },
  };
}

export function mapNewBooking(
  booking: PerezBookingBooking,
  customer: PerezBookingCustomer
): NormalizedNewBooking {
  return {
    type: "booking.created",
    idempotencyKey: `pb:booking:${booking.id}`,
    customer: { externalId: String(customer.id), email: customer.email },
    booking: { externalId: String(booking.id), scheduledAt: booking.booking_datetime },
  };
}

export const PerezBookingStatus = {
  COMPLETED: "completed",
  CANCELLED_BY_CUSTOMER: "cancelled_by_customer",
  REJECTED: ["rejected_by_you", "rejected_by_staff"],
};
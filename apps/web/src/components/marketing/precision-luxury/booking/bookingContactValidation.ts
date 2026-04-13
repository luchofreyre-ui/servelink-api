/** Sane-enough format check for funnel gating (not a full RFC parser). */
const BOOKING_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidBookingCustomerEmailFormat(email: string): boolean {
  const t = email.trim();
  if (!t) return false;
  return BOOKING_EMAIL_PATTERN.test(t);
}

export function getBookingCustomerNameError(name: string): string | null {
  if (!name.trim()) return "Please enter your name.";
  return null;
}

export function getBookingCustomerEmailError(email: string): string | null {
  const t = email.trim();
  if (!t) return "Please enter your email.";
  if (!isValidBookingCustomerEmailFormat(t)) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function isBookingContactValid(name: string, email: string): boolean {
  return (
    getBookingCustomerNameError(name) === null &&
    getBookingCustomerEmailError(email) === null
  );
}

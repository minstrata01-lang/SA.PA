/**
 * Validation helpers for checkout form (guest checkout — no auth)
 */

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  // Indonesian phone format: starts with 08 or +62
  const re = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return re.test(phone.replace(/[\s-]/g, ''));
}

export function validateRequired(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

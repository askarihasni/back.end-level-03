import { ApiError } from '../utils/errors.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export function validationError(field, message) {
  return new ApiError(400, 'Validation failed.', [{ field, message }]);
}

export function requiredString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') {
    throw validationError(field, `${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw validationError(field, `${field} must be at least ${min} characters.`);
  }
  if (trimmed.length > max) {
    throw validationError(field, `${field} must be at most ${max} characters.`);
  }
  return trimmed;
}

export function optionalString(value, field, { max = 5000 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw validationError(field, `${field} must be text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw validationError(field, `${field} must be at most ${max} characters.`);
  }
  return trimmed.length ? trimmed : null;
}

export function normalizeEmail(value) {
  const email = requiredString(value, 'email', { min: 3, max: 255 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw validationError('email', 'Enter a valid email address.');
  }
  return email;
}

export function password(value) {
  if (typeof value !== 'string') {
    throw validationError('password', 'Password is required.');
  }
  if (value.length < 8) {
    throw validationError('password', 'Password must be at least 8 characters.');
  }
  if (value.length > 128) {
    throw validationError('password', 'Password must be at most 128 characters.');
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw validationError('password', 'Password must include at least one letter and one number.');
  }
  return value;
}

export function positiveInteger(value, field, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed)) {
    throw validationError(field, `${field} must be a whole number.`);
  }
  if (parsed < min || parsed > max) {
    throw validationError(field, `${field} must be between ${min} and ${max}.`);
  }
  return parsed;
}

export function nonNegativeInteger(value, field, { max = 10_000_000 } = {}) {
  return positiveInteger(value ?? 0, field, { min: 0, max });
}

export function money(value, field) {
  const raw = typeof value === 'number' ? String(value) : value;
  if (typeof raw !== 'string' || !MONEY_PATTERN.test(raw.trim())) {
    throw validationError(field, `${field} must be a valid non-negative amount with up to 2 decimals.`);
  }
  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 9_999_999_999.99) {
    throw validationError(field, `${field} is outside the allowed range.`);
  }
  return numeric.toFixed(2);
}

export function booleanValue(value, field) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  throw validationError(field, `${field} must be true or false.`);
}

export function optionalBoolean(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  return booleanValue(value, field);
}

export function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw validationError(field, `${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value;
}

export function safeImageUrl(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw validationError('image_url', 'image_url must be text.');
  }
  const trimmed = value.trim();
  if (trimmed.length > 500) {
    throw validationError('image_url', 'image_url must be at most 500 characters.');
  }
  if (/[\s<>"']/.test(trimmed)) {
    throw validationError('image_url', 'image_url contains invalid characters.');
  }
  if (!trimmed.startsWith('/') && !/^https?:\/\//i.test(trimmed)) {
    throw validationError('image_url', 'image_url must be a local path or an http(s) URL.');
  }
  return trimmed;
}

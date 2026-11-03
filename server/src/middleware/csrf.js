import { config } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import { timingSafeEquals } from '../utils/security.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for cookie-authenticated state-changing requests:
 * the X-CSRF-Token header must match the non-httpOnly double-submit cookie.
 * SameSite cookies provide a second layer of defence.
 */
export function verifyCsrf(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[config.csrfCookieName];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken || !timingSafeEquals(cookieToken, headerToken)) {
    return next(new ApiError(403, 'Invalid or missing CSRF token. Please refresh the page.'));
  }
  return next();
}

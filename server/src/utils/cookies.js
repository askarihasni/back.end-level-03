import { config } from '../config/env.js';
import { createCsrfToken } from './security.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions() {
  return {
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/',
    maxAge: SEVEN_DAYS_MS,
  };
}

export function setAuthCookie(res, token) {
  res.cookie(config.authCookieName, token, {
    ...baseCookieOptions(),
    httpOnly: true,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.authCookieName, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: undefined,
  });
}

/**
 * Double-submit CSRF cookie. It is readable by the SPA (httpOnly false) and
 * must be echoed in the X-CSRF-Token header for state-changing requests.
 */
export function issueCsrfCookie(res, existingToken = null) {
  const token = existingToken || createCsrfToken();
  res.cookie(config.csrfCookieName, token, {
    ...baseCookieOptions(),
    httpOnly: false,
  });
  return token;
}

export function clearCsrfCookie(res) {
  res.clearCookie(config.csrfCookieName, {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: undefined,
  });
}

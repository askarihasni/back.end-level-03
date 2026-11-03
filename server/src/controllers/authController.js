import { config } from '../config/env.js';
import {
  authenticateUser,
  registerUser,
} from '../services/authService.js';
import { clearAuthCookie, clearCsrfCookie, issueCsrfCookie, setAuthCookie } from '../utils/cookies.js';
import { asyncHandler } from '../utils/errors.js';
import { createCsrfToken, signAccessToken } from '../utils/security.js';
import { validateLogin, validateRegister } from '../validators/auth.validators.js';

export const register = asyncHandler(async (req, res) => {
  const input = validateRegister(req.body);
  const user = await registerUser(input);
  const token = signAccessToken(user);

  setAuthCookie(res, token);
  const csrfToken = issueCsrfCookie(res, req.cookies?.[config.csrfCookieName]);

  res.status(201).json({ user, csrfToken });
});

export const login = asyncHandler(async (req, res) => {
  const input = validateLogin(req.body);
  const user = await authenticateUser(input);
  const token = signAccessToken(user);

  setAuthCookie(res, token);
  const csrfToken = issueCsrfCookie(res, req.cookies?.[config.csrfCookieName]);

  res.json({ user, csrfToken });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  clearCsrfCookie(res);
  res.json({ message: 'Signed out successfully.' });
});

export const me = asyncHandler(async (req, res) => {
  const csrfToken = issueCsrfCookie(
    res,
    req.cookies?.[config.csrfCookieName] || createCsrfToken()
  );
  res.json({ user: req.user, csrfToken });
});

export const csrf = asyncHandler(async (req, res) => {
  const csrfToken = issueCsrfCookie(
    res,
    req.cookies?.[config.csrfCookieName] || createCsrfToken()
  );
  res.json({ csrfToken });
});

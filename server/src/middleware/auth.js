import { config } from '../config/env.js';
import { findUserById } from '../services/authService.js';
import { ApiError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/security.js';

async function resolveUser(req) {
  const token = req.cookies?.[config.authCookieName];
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);
    const user = await findUserById(Number(payload.sub));
    return user;
  } catch {
    return null;
  }
}

export async function optionalAuth(req, _res, next) {
  req.user = await resolveUser(req);
  next();
}

export async function requireAuth(req, _res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      throw new ApiError(401, 'Authentication required. Please sign in.');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(role) {
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required. Please sign in.'));
    }
    if (req.user.role !== role) {
      return next(new ApiError(403, `Access denied. ${role} role required.`));
    }
    return next();
  };
}

export function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

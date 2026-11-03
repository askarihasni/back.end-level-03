import { normalizeEmail, password, requiredString } from './common.js';

export function validateRegister(body) {
  return {
    // role is deliberately ignored: registration can only create customers.
    name: requiredString(body?.name, 'name', { min: 2, max: 120 }),
    email: normalizeEmail(body?.email),
    password: password(body?.password),
  };
}

export function validateLogin(body) {
  return {
    email: normalizeEmail(body?.email),
    password: typeof body?.password === 'string' ? body.password : '',
  };
}

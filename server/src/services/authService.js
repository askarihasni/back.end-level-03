import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { ApiError } from '../utils/errors.js';

const BCRYPT_ROUNDS = 10;
// A valid bcrypt hash used only to equalize timing for unknown emails.
// It is not a usable credential for any seeded account in normal operation.
const TIMING_DUMMY_HASH = '$2b$10$stu/8KKWeFVhw.Kjz7s.buherwgSQrW9KkENvpl/7De0YzwJjrc0y';

export function mapPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, passwordHash]
    );
    return mapPublicUser(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'An account with this email address already exists.');
    }
    throw error;
  }
}

export async function authenticateUser({ email, password }) {
  const { rows } = await query(
    `SELECT id, name, email, password_hash, role, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  const row = rows[0];
  const hashToCheck = row?.password_hash || TIMING_DUMMY_HASH;
  const passwordMatches = typeof password === 'string' && password.length > 0
    ? await bcrypt.compare(password, hashToCheck)
    : false;

  if (!row || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  return mapPublicUser(row);
}

export async function findUserById(id) {
  const { rows } = await query(
    `SELECT id, name, email, role, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return mapPublicUser(rows[0]);
}

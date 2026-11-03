import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasErrors,
  validateEmail,
  validateLoginForm,
  validateName,
  validatePassword,
  validateRegisterForm,
} from '../src/utils/validation.js';

describe('validateEmail', () => {
  test('requires a non-blank address', () => {
    assert.match(validateEmail(''), /required/i);
    assert.match(validateEmail('   '), /required/i);
    assert.match(validateEmail(null), /required/i);
  });

  test('rejects malformed addresses', () => {
    for (const email of ['plainaddress', 'user@', '@example.com', 'user@example', 'a b@example.com', 'user@example.c']) {
      assert.notEqual(validateEmail(email), '', `${email} should be rejected`);
    }
  });

  test('accepts valid addresses, including surrounding whitespace', () => {
    assert.equal(validateEmail('user@example.com'), '');
    assert.equal(validateEmail('  ayesha.khan+shop@example.co.uk  '), '');
  });
});

describe('validatePassword', () => {
  test('requires a password with at least 8 characters, a letter and a number', () => {
    assert.match(validatePassword(''), /required/i);
    assert.match(validatePassword('Pass12'), /at least 8/i);
    assert.match(validatePassword('abcdefgh'), /letter and one number/i);
    assert.match(validatePassword('12345678'), /letter and one number/i);
  });

  test('accepts a compliant password', () => {
    assert.equal(validatePassword('Pass1234'), '');
    assert.equal(validatePassword('longpassphrase9'), '');
  });
});

describe('validateName', () => {
  test('requires between 2 and 120 trimmed characters', () => {
    assert.match(validateName(''), /required/i);
    assert.match(validateName('A'), /at least 2/i);
    assert.match(validateName('  A  '), /at least 2/i);
    assert.match(validateName('x'.repeat(121)), /at most 120/i);
  });

  test('accepts valid names including the 120-character boundary', () => {
    assert.equal(validateName('Ali'), '');
    assert.equal(validateName('x'.repeat(120)), '');
  });
});

describe('validateLoginForm', () => {
  test('reports both missing fields', () => {
    assert.deepEqual(validateLoginForm({ email: '', password: '' }), {
      email: 'Email address is required.',
      password: 'Password is required.',
    });
  });

  test('does not enforce password strength on login', () => {
    assert.deepEqual(validateLoginForm({ email: 'user@example.com', password: 'x' }), {});
  });

  test('reports only the invalid email', () => {
    assert.deepEqual(validateLoginForm({ email: 'bad', password: 'secret' }), {
      email: 'Enter a valid email address.',
    });
  });
});

describe('validateRegisterForm', () => {
  test('requires confirmation and rejects mismatches', () => {
    const missing = validateRegisterForm({
      name: 'Ayesha Khan',
      email: 'ayesha@example.com',
      password: 'Pass1234',
      confirmPassword: '',
    });
    assert.equal(missing.confirmPassword, 'Please confirm your password.');

    const mismatch = validateRegisterForm({
      name: 'Ayesha Khan',
      email: 'ayesha@example.com',
      password: 'Pass1234',
      confirmPassword: 'Pass12345',
    });
    assert.equal(mismatch.confirmPassword, 'Passwords do not match.');
  });

  test('collects every invalid field at once', () => {
    const errors = validateRegisterForm({
      name: 'A',
      email: 'bad',
      password: 'short',
      confirmPassword: 'different',
    });
    assert.deepEqual(Object.keys(errors).sort(), ['confirmPassword', 'email', 'name', 'password']);
    assert.equal(hasErrors(errors), true);
  });

  test('returns no errors for a valid registration', () => {
    assert.deepEqual(
      validateRegisterForm({
        name: 'New Customer',
        email: 'new.customer@example.com',
        password: 'Pass1234',
        confirmPassword: 'Pass1234',
      }),
      {}
    );
  });
});

describe('hasErrors', () => {
  test('detects populated error maps only', () => {
    assert.equal(hasErrors({}), false);
    assert.equal(hasErrors({ email: '' }), true);
  });
});

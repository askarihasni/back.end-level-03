const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getCookie(name) {
  const prefix = `${name}=`;
  const parts = document.cookie ? document.cookie.split('; ') : [];
  const match = parts.find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

let csrfReady = null;

export async function ensureCsrfToken() {
  const existing = getCookie('se_csrf_token');
  if (existing) return existing;
  if (!csrfReady) {
    csrfReady = fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new ApiError('Unable to initialize a secure session.', response.status);
        const data = await response.json();
        return data.csrfToken || getCookie('se_csrf_token');
      })
      .finally(() => {
        csrfReady = null;
      });
  }
  return csrfReady;
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const upperMethod = method.toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(upperMethod);

  let csrfToken = null;
  if (isMutation) csrfToken = await ensureCsrfToken();

  const response = await fetch(`${API_BASE}${path}`, {
    method: upperMethod,
    credentials: 'include',
    signal,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.error?.message || `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, data?.error?.details);
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

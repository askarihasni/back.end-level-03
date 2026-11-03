export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.expose = status < 500;
  }
}

export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function notFoundError(message = 'Resource not found.') {
  return new ApiError(404, message);
}

export function forbiddenError(message = 'You do not have permission to perform this action.') {
  return new ApiError(403, message);
}

export function unauthorizedError(message = 'Authentication required.') {
  return new ApiError(401, message);
}

export function conflictError(message, details = undefined) {
  return new ApiError(409, message, details);
}

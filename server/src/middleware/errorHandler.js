import { ApiError } from '../utils/errors.js';

const PG_MESSAGES = {
  '23505': [409, 'A record with these values already exists.'],
  '23503': [409, 'This action conflicts with a related record.'],
  '23514': [400, 'A database constraint rejected one of the submitted values.'],
  '22P02': [400, 'One of the submitted values has an invalid format.'],
  '22003': [400, 'One of the submitted values is out of range.'],
};

// eslint-disable-next-line no-unused-vars
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'API route not found.' } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: {
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }

  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Request body must be valid JSON.' } });
  }

  if (error?.code && PG_MESSAGES[error.code]) {
    const [status, message] = PG_MESSAGES[error.code];
    return res.status(status).json({ error: { message } });
  }

  console.error('[api] Unhandled error:', error?.stack || error);
  return res.status(500).json({
    error: {
      message: 'An unexpected error occurred. Please try again.',
    },
  });
}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { validationError } from '../validators/common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverUploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const clientUploadsDir = path.resolve(__dirname, '..', '..', '..', 'client', 'public', 'uploads');

try {
  fs.mkdirSync(serverUploadsDir, { recursive: true });
  fs.mkdirSync(clientUploadsDir, { recursive: true });
} catch {
  // directories will be created on write if needed
}

const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

export const uploadImage = asyncHandler(async (req, res) => {
  const { image, filename: clientFilename } = req.body || {};

  if (!image || typeof image !== 'string') {
    throw validationError('image', 'Image data is required.');
  }

  const match = image.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
  let mimeType = 'image/jpeg';
  let base64Data = image;

  if (match) {
    mimeType = match[1].toLowerCase();
    base64Data = match[2];
  } else {
    const ext = path.extname(clientFilename || '').toLowerCase();
    const found = Object.entries(ALLOWED_MIME_TYPES).find(([, val]) => val === ext);
    if (found) mimeType = found[0];
  }

  const ext = ALLOWED_MIME_TYPES[mimeType];
  if (!ext) {
    throw validationError(
      'image',
      'Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF, SVG.'
    );
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (buffer.length > MAX_SIZE) {
    throw validationError('image', 'Image size must be less than 10MB.');
  }

  if (buffer.length === 0) {
    throw validationError('image', 'Uploaded file is empty.');
  }

  const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const safeFilename = `product-${uniqueId}${ext}`;

  // Ensure directories exist before saving
  await fs.promises.mkdir(serverUploadsDir, { recursive: true });
  const serverPath = path.join(serverUploadsDir, safeFilename);
  await fs.promises.writeFile(serverPath, buffer);

  try {
    await fs.promises.mkdir(clientUploadsDir, { recursive: true });
    const clientPath = path.join(clientUploadsDir, safeFilename);
    await fs.promises.writeFile(clientPath, buffer);
  } catch {
    // Continue if client public path is inaccessible
  }

  const publicUrl = `/uploads/${safeFilename}`;
  res.status(201).json({
    success: true,
    imageUrl: publicUrl,
    filename: safeFilename,
    size: buffer.length,
    mimeType,
  });
});

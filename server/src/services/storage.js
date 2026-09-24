import path from 'path';
import { put } from '@vercel/blob';

// Returns the URL/path to persist for an uploaded multer file.
// On Vercel: uploads the in-memory buffer to Vercel Blob (public URL).
// Locally: the file was already written to disk by multer storage.
export async function persistUpload(file) {
  if (process.env.VERCEL) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('Image storage is not configured: BLOB_READ_WRITE_TOKEN is missing. Enable Vercel Blob storage for this project.');
    }
    if (!file || !file.buffer) {
      throw new Error('No upload payload found');
    }
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const name = `fixmycity/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const blob = await put(name, file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return blob.url;
  }

  if (!file || !file.filename) {
    throw new Error('No upload payload found');
  }
  return `/uploads/${file.filename}`;
}

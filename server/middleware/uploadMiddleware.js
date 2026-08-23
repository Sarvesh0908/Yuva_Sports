import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { db, STORAGE_BUCKET } from '../database/db.js';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'अवैध फाईल प्रकार. केवळ JPG, PNG, WEBP, GIF किंवा PDF फाईल्स अपलोड करा. (Only JPG, PNG, WEBP, GIF, or PDF files are allowed)'
      ),
      false
    );
  }
};

// Store file temporarily in memory instead of local /uploads folder
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
});

// Upload file directly to Supabase Storage
export async function uploadFileToSupabase(
  file,
  folder = 'uploads'
) {
  if (!file) {
    return '';
  }

  const ext = path
    .extname(file.originalname || '')
    .toLowerCase();

  const safeExt =
    ext && ext.length <= 10
      ? ext
      : '';

  const objectPath =
    `${folder}/${Date.now()}-${crypto.randomUUID()}${safeExt}`;

  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(
      objectPath,
      file.buffer,
      {
        contentType: file.mimetype,
        upsert: false
      }
    );

  if (error) {
    console.error(
      'Supabase upload error:',
      error
    );

    throw error;
  }

  const { data } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}
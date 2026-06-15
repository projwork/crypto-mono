import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { config } from "../../config/index.js";

const KYC_SUBDIR = "kyc";
const kycDir = path.resolve(config.uploadDir, KYC_SUBDIR);

// Ensure the upload directory exists at startup.
fs.mkdirSync(kycDir, { recursive: true });

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, kycDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, unique);
  },
});

/** Multer instance for KYC document uploads (Passport, National ID, Selfie). */
export const kycUpload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/** Build the public URL path for a stored KYC file. */
export const kycFileUrl = (filename: string): string =>
  `/uploads/${KYC_SUBDIR}/${filename}`;

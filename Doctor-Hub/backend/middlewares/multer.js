import multer from 'multer'
import path from 'path'
import { mkdirSync } from 'fs'
import { tmpdir } from 'os'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp|gif)$/i
// Payment screenshots: strictly jpg/png only (no webp/gif)
const PAYMENT_MIME = /^image\/(jpeg|jpg|png)$/i

const uploadDir = path.join(tmpdir(), 'doctor-hub-uploads')
mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(_req, file, callback) {
    const ext = path.extname(file.originalname).slice(0, 10)
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80)
    callback(null, `${Date.now()}-${base}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter(_req, file, callback) {
    if (ALLOWED_MIME.test(file.mimetype)) {
      callback(null, true)
    } else {
      callback(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'))
    }
  },
})

// Strict uploader for payment screenshots — jpg/png only, max 5MB
export const paymentUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(_req, file, callback) {
    if (PAYMENT_MIME.test(file.mimetype)) {
      callback(null, true)
    } else {
      callback(new Error('Payment screenshots must be JPEG or PNG only (max 5 MB)'))
    }
  },
})

export default upload

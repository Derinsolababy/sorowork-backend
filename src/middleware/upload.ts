import multer from 'multer'
import path from 'path'
import { mkdirSync } from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, name)
  },
})

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

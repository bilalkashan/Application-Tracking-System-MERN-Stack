import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Use __dirname relative to this file to avoid issues with process.cwd()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
const profilePicsDir = path.join(__dirname, "..", "uploads", "profilePictures");

fs.mkdirSync(resumesDir, { recursive: true });
fs.mkdirSync(profilePicsDir, { recursive: true });

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumesDir),
  filename: (req, file, cb) => {
    const safeName = path
      .parse(file.originalname)
      .name.replace(/[^a-z0-9_-]+/gi, "-");
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = req.user?._id?.toString() || "anon";
    cb(null, `${safeName}-${uid}-${Date.now()}${ext}`);
  },
});

const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilePicsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = req.user?._id?.toString() || "user";
    cb(null, `profile-${uid}-${Date.now()}${ext}`);
  },
});

const resumeFileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new Error("Only PDF/DOC/DOCX allowed"));
  cb(null, true);
};

const profilePictureFileFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new Error("Only JPG/PNG/GIF allowed"));
  cb(null, true);
};

export const userResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const userProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: profilePictureFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

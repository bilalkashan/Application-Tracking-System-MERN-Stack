import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/user.js";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import compression from "compression";
import cookieParser from "cookie-parser";

import "./models/db.js";
import AuthRouter from "./routes/AuthRouter.js";
import ProfileRouter from "./routes/profileRoutes.js";
import RequisitionRouter from "./routes/RequisitionFormRoutes.js";
import NotificationRouter from "./routes/NotificationRoutes.js";
import MessageRouter from "./routes/MessageRoutes.js";
import JobRouter from "./routes/JobRoutes.js";
import ApplicationRouter from "./routes/ApplicationRoutes.js";
import ReportRouter from "./routes/ReportRoutes.js";
import SearchRouter from "./routes/SearchRoutes.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      (process.env.FRONTEND_URL && process.env.FRONTEND_URL.split(",")) ||
      "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust proxy when configured (needed for secure cookies / behind reverse proxies)
if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

// Helmet configuration: stricter in production, relaxed for local/dev to avoid
// blocking static asset loading during development. Review CSP/COEP settings for production.
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
  // HSTS - 1 year
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    })
  );
} else {
  // Development / local-friendly helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
    })
  );
}

// Basic env checks - warn if critical secrets are missing
if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET is not set. Authentication will fail or be insecure."
  );
}
if (!process.env.MONGODB_CONN) {
  console.warn("⚠️ MONGODB_CONN is not set. Database connection may fail.");
}

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(hpp());

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (key.startsWith("$")) {
      try {
        delete obj[key];
      } catch (e) {}
      return;
    }

    if (key.includes(".")) {
      const safeKey = key.replace(/\./g, "_");
      try {
        obj[safeKey] = value;
        delete obj[key];
      } catch (e) {}
      sanitizeObject(obj[safeKey]);
      return;
    }

    sanitizeObject(value);
  });
};

app.use((req, _res, next) => {
  try {
    if (req.body && typeof req.body === "object") sanitizeObject(req.body);
    if (req.params && typeof req.params === "object")
      sanitizeObject(req.params);
    if (req.query && typeof req.query === "object") sanitizeObject(req.query);
  } catch (e) {
    console.warn("Sanitizer warning:", e && e.message ? e.message : e);
  }
  next();
});

app.use(compression());

app.use(cookieParser());

const allowedOrigins = (process.env.FRONTEND_URL &&
  process.env.FRONTEND_URL.split(",")) || ["http://localhost:5173"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 200 to accommodate dashboard's 4 concurrent calls
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global limiter first
app.use(limiter);

// Auth router: NO dedicated limiter here (will use route-specific limiters instead)
app.use("/auth", AuthRouter);
app.use("/profile", ProfileRouter);
app.use("/requisitions", RequisitionRouter);
app.use("/notifications", NotificationRouter);
app.use("/messages", MessageRouter);
app.use("/jobs", JobRouter);
app.use("/applications", ApplicationRouter);
app.use("/reports", ReportRouter);
app.use("/search", SearchRouter);

const resumesDir = path.join(__dirname, "uploads");
app.use(
  "/uploads",
  express.static(resumesDir, {
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("Referrer-Policy", "no-referrer");
    },
  })
);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (process.env.NODE_ENV === "production") {
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }

  if (err?.message) {
    return res.status(400).json({ message: err.message, success: false });
  }
  res.status(500).json({ message: "Something went wrong!", success: false });
});

const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token)
      return next(new Error("Authentication error: No token provided"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email role");
    if (!user) return next(new Error("Authentication error: User not found"));
    socket.user = { id: String(user._id), name: user.name, role: user.role };
    return next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  if (socket.user?.id) {
    onlineUsers.set(socket.user.id, socket.id);
    socket.join(`user:${socket.user.id}`);
    if (socket.user.role) socket.join(`role:${socket.user.role}`);
  }

  socket.on("register", (userId) => {
    if (userId) onlineUsers.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) onlineUsers.delete(userId);
    }
  });
});

export { io, onlineUsers };

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

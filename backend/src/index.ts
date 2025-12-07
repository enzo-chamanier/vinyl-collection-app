import express, { type Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import authRouter from "./routes/auth";
import vinylesRouter from "./routes/vinyls";
import usersRouter from "./routes/users";
import followersRouter from "./routes/followers";
import scanRouter from "./routes/scan";
import analyticsRouter from "./routes/analytics";
import interactionsRouter from "./routes/interactions";
import notificationsRouter from "./routes/notifications";
import musicRouter from "./routes/music";
import { errorHandler } from "./middleware/errorHandler";
import { initDatabase } from "./config/initDatabase";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const allowedOrigins = [
  "http://localhost:3000",
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Allow local network IPs
  "https://discory-fr.netlify.app", // Production Frontend
  process.env.FRONTEND_URL // Allow env variable override
].filter(Boolean) as (string | RegExp)[];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

console.log("Socket.io initialized");

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Make io available in routes
app.use((req: any, _res, next) => {
  req.io = io;
  next();
});

app.get("/", (_req, res) => {
  res.send("🎵 Discory Backend is running!");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/vinyls", authMiddleware, vinylesRouter);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/followers", authMiddleware, followersRouter);
app.use("/api/scan", authMiddleware, scanRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);
app.use("/api/interactions", authMiddleware, interactionsRouter);
app.use("/api/notifications", authMiddleware, notificationsRouter);
app.use("/api/music", musicRouter);

// Error handling
app.use(errorHandler);

(async () => {
  try {
    await initDatabase();
    console.log("DB ready");
  } catch (err) {
    console.error(err);
  }
})();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🎵 Discory Backend running on port ${PORT}`);
});

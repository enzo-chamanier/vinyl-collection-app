import express, { type Express } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./routes/auth";
import vinylesRouter from "./routes/vinyls";
import usersRouter from "./routes/users";
import followersRouter from "./routes/followers";
import scanRouter from "./routes/scan";
import analyticsRouter from "./routes/analytics";
import { errorHandler } from "./middleware/errorHandler";
import { initDatabase } from "./config/initDatabase";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/vinyls", authMiddleware, vinylesRouter);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/followers", authMiddleware, followersRouter);
app.use("/api/scan", authMiddleware, scanRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);

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

// Start server
app.listen(PORT, () => {
  console.log(`🎵 VinylStack Backend running on port ${PORT}`);
});

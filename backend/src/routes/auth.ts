import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database"; // ton wrapper PostgreSQL
import type { User } from "../types";

const router = Router();

// --- REGISTER ---
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body as {
      email?: string;
      username?: string;
      password?: string;
    };

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username et mot de passe requis" });
    }

    // Vérifie si l'utilisateur existe déjà
    const existingUsers = await query<User>(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUsers.rows.length > 0) {
      return res.status(409).json({ error: "Email ou username déjà utilisé" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    // Insère le nouvel utilisateur
    await query(
      `INSERT INTO users (id, email, username, password, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, email, username, hashedPassword, true]
    );

    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      user: { id: userId, email, username, isPublic: true },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// --- LOGIN ---
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const result = await query<User & Record<string, any>>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const dbUser = result.rows[0];

    // Map snake_case → camelCase
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      password: dbUser.password,
      profilePicture: dbUser.profile_picture ?? undefined,
      bio: dbUser.bio ?? undefined,
      isPublic: !!dbUser.is_public,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isPublic: user.isPublic,
        profilePicture: user.profilePicture,
        bio: user.bio,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

export default router;

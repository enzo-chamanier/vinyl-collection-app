import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "../types"

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    res.status(401).json({ error: "Token manquant" })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as JwtPayload
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: "Token invalide" })
  }
}

export function privacyMiddleware(isPublic: boolean) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!isPublic) {
      const userIdParam = req.params.username || req.params.userId
      const isOwnProfile = req.user?.userId === userIdParam

      if (!isOwnProfile) {
        res.status(403).json({ error: "Ce profil est privé" })
        return
      }
    }
    next()
  }
}

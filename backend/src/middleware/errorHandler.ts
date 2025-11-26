import type { Request, Response, NextFunction } from "express"

export interface AppError extends Error {
  status?: number
  code?: string
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500
  const message = err.message || "Internal server error"

  console.error(`[Error] ${status}: ${message}`)

  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  })
}

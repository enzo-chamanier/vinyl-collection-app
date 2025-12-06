import { Router, type Request, type Response } from "express";

const router = Router();

// Proxy for Deezer API to avoid CORS issues
router.get("/search", async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== "string") {
            return res.status(400).json({ error: "Query parameter 'q' is required" });
        }

        const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`);

        if (!response.ok) {
            return res.status(response.status).json({ error: "Deezer API error" });
        }

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error("Error fetching from Deezer:", error);
        return res.status(500).json({ error: "Failed to fetch from Deezer" });
    }
});

export default router;

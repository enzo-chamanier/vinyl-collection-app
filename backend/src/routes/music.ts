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
        console.log(`Deezer API status for "${q}":`, response.status);

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

// Proxy for audio files to handle CORS and Range requests
router.get("/proxy", async (req: Request, res: Response) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== "string") {
            return res.status(400).json({ error: "URL is required" });
        }

        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).send("Failed to fetch audio");
        }

        // Forward headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");

        // Stream the response body
        if (response.body) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return res.send(buffer);
        } else {
            return res.end();
        }
    } catch (error) {
        console.error("Proxy error:", error);
        return res.status(500).json({ error: "Proxy failed" });
    }
});

export default router;

export const GENRES = [
  "Rock",
  "Pop",
  "Jazz",
  "Hip-Hop",
  "Electronic",
  "Classical",
  "Soul",
  "Blues",
  "Country",
  "Folk",
  "Reggae",
  "Latin",
  "Indie",
  "Alternative",
  "Punk",
  "Metal",
  "Other",
] as const

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const VINYL_PLACEHOLDER = "/vinyl-record-cover.jpg"

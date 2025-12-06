export interface User {
  id: string
  email: string
  username: string
  password: string
  profilePicture?: string
  bio?: string
  isPublic: boolean;
  profileCategory?: string;
  createdAt: Date
  updatedAt: Date
}

export interface Vinyl {
  id: string
  userId: string
  title: string
  artist: string
  genre: string
  releaseYear?: number
  barcode?: string
  discogsId?: string
  coverImage?: string
  notes?: string
  rating?: number
  dateAdded: Date
  updatedAt: Date
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

export interface JwtPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

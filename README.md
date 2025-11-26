# VinylStack - Vinyl Collection Manager PWA

A modern, full-stack Progressive Web App for scanning, organizing, and sharing your vinyl record collection with friends.

## Features

- **Vinyl Management**: Add vinyls via barcode scanning or manual entry
- **Intelligent Scanning**: Integrated with Discogs API for automatic vinyl recognition
- **Collection Stats**: View analytics by genre, artist, release year, and more
- **Social Features**: Follow friends, browse their collections, and share your passion
- **Privacy Controls**: Make your profile public or private
- **PWA Ready**: Install as an app on mobile or desktop
- **Dark Mode**: Eye-friendly dark interface optimized for music lovers

## Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** database with structured schema
- **Discogs API** integration for vinyl data
- **JWT** authentication

### Frontend
- **Next.js 16** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **PWA** manifest and service workers

## Project Structure

\`\`\`
vinylstack/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth & error handling
│   │   ├── config/          # Database setup
│   │   ├── services/        # Discogs service
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Server entry
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── (auth)/          # Login/Register pages
    │   ├── (app)/           # Protected app pages
    │   ├── layout.tsx       # Root layout
    │   └── globals.css      # Global styles
    ├── components/
    │   ├── auth/            # Auth components
    │   ├── vinyl/           # Vinyl management
    │   ├── profile/         # Profile components
    │   ├── friends/         # Social features
    │   ├── analytics/       # Stats components
    │   ├── feed/            # Social feed
    │   ├── scan/            # Barcode scanner
    │   └── layout/          # Layout components
    ├── lib/
    │   └── api.ts           # API client
    ├── public/
    │   └── manifest.json    # PWA manifest
    └── package.json
\`\`\`

## Getting Started

### Backend Setup

1. Install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

2. Create `.env` file:
\`\`\`env
PORT=5000
JWT_SECRET=your_secret_key
DISCOGS_API_KEY=your_discogs_key
FRONTEND_URL=http://localhost:3000
\`\`\`

3. Run development server:
\`\`\`bash
npm run dev
\`\`\`

### Frontend Setup

1. Install dependencies:
\`\`\`bash
cd frontend
npm install
\`\`\`

2. Create `.env.local` file:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
\`\`\`

3. Run development server:
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` in your browser.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Vinyls
- `GET /api/vinyls/my-collection` - Get user's vinyls
- `POST /api/vinyls/add` - Add vinyl
- `PUT /api/vinyls/:id` - Update vinyl
- `DELETE /api/vinyls/:id` - Delete vinyl

### Scanning
- `POST /api/scan/barcode` - Scan barcode
- `POST /api/scan/search` - Manual search

### Users
- `GET /api/users/:username` - Get profile
- `PUT /api/users/profile/update` - Update profile
- `GET /api/users/:userId/stats` - Get stats

### Social
- `POST /api/followers/follow/:userId` - Follow user
- `DELETE /api/followers/unfollow/:userId` - Unfollow user
- `GET /api/followers/followers/:userId` - Get followers
- `GET /api/followers/following/:userId` - Get following
- `GET /api/followers/feed/recent` - Get feed

### Analytics
- `GET /api/analytics/collection/:userId` - Collection stats
- `GET /api/analytics/personal` - Personal stats
- `GET /api/analytics/compare` - Compare collections

## Deployment

### Backend (Vercel)
\`\`\`bash
cd backend
vercel deploy
\`\`\`

### Frontend (Vercel)
\`\`\`bash
cd frontend
vercel deploy
\`\`\`

## Mobile Support

VinylStack is fully responsive and PWA-enabled. You can install it on your phone:

1. Open the app in your mobile browser
2. Click "Add to Home Screen" (iOS) or "Install App" (Android)
3. Access your collection offline

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Support

For issues and feature requests, please visit the GitHub repository.

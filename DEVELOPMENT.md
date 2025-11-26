# VinylStack Development Guide

## Project Structure

\`\`\`
vinylstack/
├── backend/          # Express.js API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
└── frontend/         # Next.js PWA
    ├── app/          # Next.js App Router
    ├── components/   # Reusable components
    ├── lib/          # Utilities & API client
    └── public/       # Static assets
\`\`\`

## Getting Started

1. **Clone and install**:
\`\`\`bash
git clone <repo>
cd backend && npm install
cd ../frontend && npm install
\`\`\`

2. **Set up environment**:
\`\`\`bash
# Backend
cp backend/.env.example backend/.env
# Frontend
cp frontend/.env.example frontend/.env.local
\`\`\`

3. **Get API keys**:
   - Discogs: https://www.discogs.com/settings/developers

4. **Run development servers**:
\`\`\`bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
\`\`\`

## Available Scripts

### Backend
- \`npm run dev\` - Start dev server with hot reload
- \`npm run build\` - Build TypeScript
- \`npm run start\` - Run production build
- \`npm run typecheck\` - Type checking

### Frontend
- \`npm run dev\` - Start Next.js dev server
- \`npm run build\` - Build for production
- \`npm run start\` - Run production server
- \`npm run lint\` - Run ESLint

## Code Standards

### TypeScript
- Strict mode enabled
- All functions must have return types
- Use interfaces for object types
- Avoid \`any\` types

### Components
- One component per file
- Use descriptive names
- Extract reusable logic to hooks
- Keep components pure when possible

### API Design
- RESTful endpoints
- Consistent error responses
- Proper HTTP status codes
- Input validation on all endpoints

## Testing

### Backend
\`\`\`bash
npm run test
\`\`\`

### Frontend
\`\`\`bash
npm run test
\`\`\`

## Common Tasks

### Add New API Endpoint
1. Create route in \`backend/src/routes/\`
2. Add types in \`backend/src/types/index.ts\`
3. Register in \`index.ts\`
4. Create frontend API call in \`frontend/lib/api.ts\`
5. Build UI component in \`frontend/components/\`

### Add New Page
1. Create file in \`frontend/app/(app)/\`
2. Import \`AppLayout\` for protected pages
3. Fetch data from API
4. Build component structure

### Database Schema Changes
1. Update \`backend/src/config/database.ts\`
2. Run migrations script
3. Update TypeScript types

## Debugging

### Backend
\`\`\`typescript
console.log('[DEBUG]', message, data)
\`\`\`

### Frontend
\`\`\`typescript
console.log('[v0] ...', data)
\`\`\`

Use browser DevTools for frontend debugging.

## Performance Tips

1. **Database**: Add indexes for frequently queried columns
2. **API**: Implement caching and pagination
3. **Frontend**: Use React.memo for expensive components
4. **Images**: Use next/image for optimization

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com)
- [Discogs API](https://www.discogs.com/developers/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

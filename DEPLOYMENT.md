# Discory Deployment Guide

## Prerequisites

- Node.js 18+ 
- Discogs API Key (free from https://www.discogs.com/settings/developers)
- Vercel account (optional, recommended)

## Backend Deployment

### Local Development
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

### Deploy to Vercel

1. Create a Vercel project:
\`\`\`bash
cd backend
vercel
\`\`\`

2. Set environment variables:
\`\`\`
PORT=3001
JWT_SECRET=<random-secret>
DISCOGS_API_KEY=<your-key>
FRONTEND_URL=<your-frontend-url>
\`\`\`

3. Update `vercel.json`:
\`\`\`json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "JWT_SECRET": "@jwt_secret",
    "DISCOGS_API_KEY": "@discogs_api_key"
  }
}
\`\`\`

### Deploy to Railway/Render

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy with auto-rebuild on push

## Frontend Deployment

### Deploy to Vercel

1. Create a Vercel project:
\`\`\`bash
cd frontend
vercel
\`\`\`

2. Set environment variable:
\`\`\`
NEXT_PUBLIC_API_URL=<backend-url>/api
\`\`\`

3. Vercel will auto-build and deploy on push

### Deploy to Netlify

1. Connect GitHub repository
2. Build command: \`npm run build\`
3. Publish directory: \`.next\`
4. Set environment variable: \`NEXT_PUBLIC_API_URL\`
5. Deploy

## Database Persistence

Since SQLite is file-based, you need to persist the database:

### Option 1: Vercel Postgres (Recommended)
Replace SQLite with Vercel Postgres for production.

### Option 2: Attach Storage
If using Railway/Render, attach persistent storage volume for the database file.

### Option 3: Backup Strategy
Regularly backup SQLite database to a cloud service.

## Environment Variables

### Backend (.env)
\`\`\`
PORT=5000
NODE_ENV=production
JWT_SECRET=<very-long-random-secret>
DATABASE_URL=file:./data/discory.db
FRONTEND_URL=https://your-frontend-url.com
DISCOGS_API_KEY=<your-discogs-key>
\`\`\`

### Frontend (.env.local)
\`\`\`
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
\`\`\`

## Security Checklist

- [ ] JWT_SECRET is a long random string (32+ chars)
- [ ] CORS origin matches your frontend domain
- [ ] Environment variables never committed to git
- [ ] HTTPS enabled on both frontend and backend
- [ ] Database backups enabled
- [ ] Rate limiting configured for API
- [ ] Input validation on all endpoints
- [ ] Authentication required for protected routes

## Performance Optimization

1. **Backend**:
   - Add caching headers for static assets
   - Implement database connection pooling
   - Add pagination to list endpoints

2. **Frontend**:
   - Enable image optimization
   - Implement code splitting
   - Use SWR for efficient data fetching

## Monitoring

Set up monitoring for:
- Backend uptime and response times
- Frontend error tracking (Sentry)
- Database query performance
- API rate limiting

## Support

For deployment issues, check:
1. Environment variables are set correctly
2. Backend is accessible from frontend
3. Database has write permissions
4. API keys are valid

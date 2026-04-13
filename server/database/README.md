## Backend API Deployment Notes

### Requirements
- Node.js 18+
- MySQL 5.7+ (recommended 8.0+)

### Setup
1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example` and set:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
3. Run Prisma migration:
   - Development: `npm run db:migrate`
   - Production: `npm run db:deploy`
4. Build and run:
   - `npm run build`
   - `node .output/server/index.mjs`

### Prisma files
- Schema: `prisma/schema.prisma`
- Optional SQL bootstrap: `server/database/init.sql`

### API routes
- Posts:
  - `GET /api/posts`
  - `GET /api/posts/:slug`
  - `POST /api/posts/create`
  - `PUT /api/posts/:slug`
  - `DELETE /api/posts/:slug`
- Tags:
  - `GET /api/tags`
  - `GET /api/tags/:slug`

# Environment Variables for Vercel Deployment

Copy these environment variables to Vercel Dashboard → Project Settings → Environment Variables

## Required Variables

### Database
```
DATABASE_URL=postgresql://...
```
Your Supabase PostgreSQL connection string

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STORAGE_BUCKET_NAME=intake-uploads
```

### NextAuth
```
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-vercel-app.vercel.app
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$...
```
**Important**: Update `NEXTAUTH_URL` to your actual Vercel deployment URL after first deploy

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```
**Important**: Update `NEXT_PUBLIC_APP_URL` to your actual Vercel deployment URL

## Generating Values

### NEXTAUTH_SECRET
Run in your terminal:
```bash
openssl rand -base64 32
```

### ADMIN_PASSWORD_HASH
Run in Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-secure-password', 10);
console.log(hash);
```

## Notes
- All variables should be added for "Production", "Preview", and "Development" environments
- After first deployment, update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL with your actual Vercel URL
- Keep the ADMIN_PASSWORD_HASH and SUPABASE_SERVICE_ROLE_KEY secret

# Vercel Deployment Checklist

## Pre-Deployment

- [x] Code is committed and pushed to GitHub
- [x] Build command configured (`vercel.json` created)
- [ ] Merge feature branch into main (optional, or deploy from feature branch)

## Vercel Dashboard Steps

### 1. Import Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select `thinksid/intake_form`
4. Choose branch: `main` or `claude/fix-progress-bar-color-xl8e9`

### 2. Configure Project
- **Framework**: Next.js (auto-detected)
- **Root Directory**: `./` (leave default)
- **Build Command**: Will use `vercel.json` settings
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Add Environment Variables
Copy all variables from `DEPLOYMENT_ENV_VARS.md`:
- Click "Environment Variables"
- Add each variable for all environments (Production, Preview, Development)
- See `DEPLOYMENT_ENV_VARS.md` for complete list

### 4. Deploy
1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Note your deployment URL (e.g., `https://intake-form.vercel.app`)

## Post-Deployment

### Update Environment Variables
After first deployment, update these in Vercel dashboard:
1. `NEXTAUTH_URL` → Your Vercel URL (e.g., `https://intake-form.vercel.app`)
2. `NEXT_PUBLIC_APP_URL` → Your Vercel URL

### Run Database Migrations
If you have pending Prisma migrations:
```bash
# In Vercel project settings → Deployments → Latest Deployment → "Redeploy"
# Or run locally connected to production DB:
npx prisma migrate deploy
```

### Test the Deployment
1. Admin Portal: `https://your-app.vercel.app/admin/login`
2. Sample Intake: Create a questionnaire and test the client flow
3. Voice Input: Test on mobile device (iOS Safari or Chrome Mobile)

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` is accessible from Vercel

### Database Connection Issues
- Verify Supabase connection string includes `?pgbouncer=true&connection_limit=1`
- Check Supabase project is not paused
- Verify DATABASE_URL in environment variables

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your deployment URL
- Check `NEXTAUTH_SECRET` is set
- Verify `ADMIN_PASSWORD_HASH` is correct

### File Upload Issues
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check `STORAGE_BUCKET_NAME` matches your Supabase bucket
- Verify bucket has public read access for uploaded files

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to use custom domain

## Monitoring

- View deployment logs: Vercel Dashboard → Deployments → [Select Deployment] → Logs
- Check analytics: Vercel Dashboard → Analytics
- Monitor performance: Vercel Dashboard → Speed Insights

## Git Integration

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you push to any other branch or open a PR

To change which branch deploys to production:
1. Project Settings → Git → Production Branch
2. Select your preferred branch

# DigitalOcean Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code committed and pushed to main branch
- [ ] Environment validation passes: `npm run validate:env --prefix backend`
- [ ] Backend starts locally: `npm run dev --prefix backend`
- [ ] Health endpoint works: `curl http://localhost:3000/health`

### 2. DigitalOcean App Platform Setup
- [ ] App created and connected to GitHub repository
- [ ] Source directory set to `/backend`
- [ ] Build command set to `npm ci --only=production`
- [ ] Run command set to `npm start`
- [ ] Environment slug set to `node-js`

### 3. Environment Variables (Set in DO Dashboard)
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=mongodb+srv://...` (your MongoDB Atlas connection)
- [ ] `JWT_SECRET=...` (64+ character secure string)
- [ ] `SESSION_SECRET=...` (64+ character secure string)
- [ ] `GOOGLE_CLIENT_ID=...` (your Google OAuth client ID)
- [ ] `GOOGLE_CLIENT_SECRET=...` (your Google OAuth client secret)
- [ ] `DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com`
- [ ] `DO_SPACES_BUCKET=...` (your Spaces bucket name)
- [ ] `DO_SPACES_ACCESS_KEY=...` (your Spaces access key)
- [ ] `DO_SPACES_SECRET_KEY=...` (your Spaces secret key)
- [ ] `DO_SPACES_REGION=nyc3` (or your chosen region)
- [ ] `SENTRY_DSN=...` (optional, your Sentry DSN)

### 4. External Services Configuration
- [ ] MongoDB Atlas network access allows DigitalOcean IPs (0.0.0.0/0 for simplicity)
- [ ] DigitalOcean Spaces bucket created and accessible
- [ ] Google OAuth redirect URIs include your DO app URL
- [ ] Sentry project configured (if using)

## Deployment Process

### 1. Deploy via DigitalOcean Dashboard
1. Go to your app in DigitalOcean dashboard
2. Click "Deploy" or push to main branch (auto-deploy)
3. Monitor build logs for any errors
4. Wait for deployment to complete

### 2. Post-Deployment Verification
- [ ] App shows as "Running" in DigitalOcean dashboard
- [ ] Health check endpoint responds: `curl https://your-app-url/health`
- [ ] API info endpoint responds: `curl https://your-app-url/api`
- [ ] No errors in application logs
- [ ] Database connection successful (check logs)
- [ ] File upload to Spaces working (test via API)

## Troubleshooting Common Issues

### "Cannot find module 'express'" Error
**Cause:** Dependencies not installed during build
**Solution:** 
1. Ensure `build_command: npm ci --only=production` in app.yaml
2. Check that package.json is in `/backend` directory
3. Verify all dependencies are in `dependencies` (not `devDependencies`)

### Health Check Failures
**Cause:** App not responding on expected port
**Solution:**
1. Remove `PORT` from environment variables (DO sets it automatically)
2. Ensure app uses `process.env.PORT` (our config does this)
3. Increase `initial_delay_seconds` in health check config

### Environment Variable Errors
**Cause:** Missing or incorrect environment variables
**Solution:**
1. Check all required variables are set in DO dashboard
2. Verify MongoDB connection string format
3. Ensure secrets are long enough (32+ characters)

### Database Connection Issues
**Cause:** MongoDB Atlas network restrictions
**Solution:**
1. Add 0.0.0.0/0 to MongoDB Atlas network access
2. Verify connection string includes correct database name
3. Check MongoDB Atlas user permissions

## Quick Commands

```bash
# Test locally before deploying
npm run validate:env --prefix backend
npm run dev --prefix backend

# Test health endpoint locally
curl http://localhost:3000/health

# Test deployed health endpoint
curl https://your-app-name.ondigitalocean.app/health

# Generate new secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Support Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [MongoDB Atlas Network Access](https://docs.atlas.mongodb.com/security/ip-access-list/)
- [Google OAuth Setup](https://console.developers.google.com/)
- [Sentry Setup](https://sentry.io/)

---

**Remember:** Never commit sensitive environment variables to version control. Always use the DigitalOcean dashboard for production secrets.
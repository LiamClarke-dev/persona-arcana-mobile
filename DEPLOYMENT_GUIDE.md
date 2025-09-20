# Deployment Guide - Persona Arcana

## Overview

This guide covers deployment using platform-native tools:
- **DigitalOcean App Platform** for backend deployment with dashboard environment management
- **Expo Application Services (EAS)** for mobile app builds and distribution

## Backend Deployment (DigitalOcean)

### 1. DigitalOcean App Platform Setup

1. **Create App from GitHub:**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

2. **Deploy via DigitalOcean Dashboard:**
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository
   - Select `persona-arcana-mobile` repository
   - Choose the `backend` folder as source directory
   - DigitalOcean will auto-detect the Node.js app

3. **Configure Environment Variables in DO Dashboard:**
   
   **Required Variables (set in DO dashboard):**
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/persona-arcana
   JWT_SECRET=your-secure-jwt-secret-64-characters-minimum
   SESSION_SECRET=your-secure-session-secret-64-characters-minimum
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   DO_SPACES_BUCKET=persona-arcana-prod
   DO_SPACES_ACCESS_KEY=your-spaces-access-key
   DO_SPACES_SECRET_KEY=your-spaces-secret-key
   DO_SPACES_REGION=nyc3
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

4. **Deploy:**
   - Click "Create Resources"
   - DigitalOcean will build and deploy automatically
   - Your API will be available at `https://your-app-name.ondigitalocean.app`

### 2. DigitalOcean Spaces Setup

1. **Create Spaces Bucket:**
   - Go to [DigitalOcean Spaces](https://cloud.digitalocean.com/spaces)
   - Create new Space: `persona-arcana-prod`
   - Choose NYC3 region
   - Enable CDN

2. **Generate API Keys:**
   - Go to API → Spaces Keys
   - Generate new key pair
   - Add to your app's environment variables

## Mobile App Deployment (Expo EAS)

### 1. EAS Setup

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure Project:**
   ```bash
   cd mobile-app
   eas build:configure
   ```

### 2. Environment Variables in EAS

**Option 1: EAS Dashboard (Recommended for Production)**
1. Go to [Expo Dashboard](https://expo.dev/)
2. Select your project
3. Go to "Environment Variables"
4. Add production variables:
   ```
   API_URL=https://your-app-name.ondigitalocean.app
   GOOGLE_CLIENT_ID=your-mobile-google-client-id.apps.googleusercontent.com
   SENTRY_DSN=https://your-mobile-sentry-dsn@sentry.io/project-id
   ```

**Option 2: EAS CLI**
```bash
# Set environment variables via CLI
eas env:set API_URL=https://your-app-name.ondigitalocean.app --environment=production
eas env:set GOOGLE_CLIENT_ID=your-client-id --environment=production
```

### 3. Build and Deploy

1. **Development Build:**
   ```bash
   eas build --platform ios --profile development
   eas build --platform android --profile development
   ```

2. **Production Build:**
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

3. **Submit to App Stores:**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Environment Management Best Practices

### Local Development
- Use `.env` files for local development
- Keep `.env.example` files in version control
- Never commit actual `.env` files

### Staging/Production
- Use platform dashboards for environment variables
- DigitalOcean: App Platform → Settings → Environment Variables
- Expo: Dashboard → Project → Environment Variables

### Security
- Use different secrets for each environment
- Rotate secrets regularly
- Use strong, randomly generated secrets (64+ characters)
- Enable 2FA on all platform accounts

## Monitoring and Maintenance

### DigitalOcean Monitoring
- App Platform provides built-in metrics
- Set up alerts for CPU, memory, and response time
- Monitor logs via dashboard or CLI

### Expo Analytics
- Use Expo Analytics for app usage metrics
- Monitor crash reports via Sentry integration
- Track build and update deployment success

### Health Checks
- Backend health endpoint: `/health`
- DigitalOcean automatically monitors this endpoint
- Set up custom alerts for API availability

## Troubleshooting

### Common DigitalOcean Issues

1. **"Cannot find module" errors:**
   - Ensure `build_command: npm ci --only=production` is set in app.yaml
   - Check that package.json is in the correct source directory
   - Verify all dependencies are listed in package.json (not just devDependencies)

2. **Port/Health Check Issues:**
   - Don't set PORT in app.yaml - DigitalOcean sets it automatically
   - Ensure your app uses `process.env.PORT` (our config does this correctly)
   - Health check should point to `/health` endpoint

3. **Build Failures:** 
   - Check build logs in DigitalOcean dashboard
   - Ensure Node.js version compatibility (we use >=18.18.0)

4. **Environment Variables:** 
   - Verify all required vars are set in DO dashboard
   - Don't put sensitive vars in app.yaml - use dashboard instead

5. **Database Connection:** 
   - Ensure MongoDB Atlas allows DigitalOcean IP ranges
   - Check connection string format in environment variables

### Common Expo Issues
1. **Build Failures:** Check EAS build logs
2. **Environment Variables:** Verify variables are set for correct environment
3. **Google OAuth:** Ensure mobile client ID is configured correctly

## Cost Optimization

### DigitalOcean
- Start with Basic plan ($5/month)
- Scale up based on usage
- Use Spaces CDN for better performance

### Expo
- Free tier includes 30 builds/month
- Production apps may need paid plan for unlimited builds
- Consider self-hosted builds for cost savings

This approach leverages platform-native tools while maintaining flexibility for local development.
# Environment Setup Guide - Persona Arcana

## Overview

This guide covers the streamlined environment configuration approach using platform-native tools for deployment while maintaining simple local development setup.

## Quick Start

### 1. Local Development Setup

```bash
# Clone and install dependencies
git clone <your-repo>
cd persona-arcana-mobile
npm run install:all

# Set up environment files
cp backend/.env.example backend/.env
cp mobile-app/.env.example mobile-app/.env

# Fill in your actual values in the .env files
# Then validate configuration
npm run validate:env
```

### 2. Start Development

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start mobile app
npm run dev:mobile
```

## Environment Configuration

### Backend (.env)

**Required Variables:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `DO_SPACES_*` - DigitalOcean Spaces configuration
- `JWT_SECRET` - JWT token signing secret (32+ characters)
- `SESSION_SECRET` - Session signing secret (32+ characters)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Optional Variables:**
- `SENTRY_DSN` - Error tracking (recommended)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: development)

### Mobile App (.env)

**Required Variables:**
- `API_URL` - Backend API URL
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (mobile)

**Optional Variables:**
- `SENTRY_DSN` - Error tracking (recommended)
- `EAS_PROJECT_ID` - Expo Application Services project ID

## Platform-Native Deployment

### DigitalOcean App Platform (Backend)

1. **Create App:**
   - Connect GitHub repository
   - Select `backend` folder as source
   - DigitalOcean auto-detects Node.js app

2. **Set Environment Variables in Dashboard:**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-production-jwt-secret-64-chars
   SESSION_SECRET=your-production-session-secret-64-chars
   GOOGLE_CLIENT_ID=your-prod-client-id
   GOOGLE_CLIENT_SECRET=your-prod-client-secret
   DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   DO_SPACES_BUCKET=persona-arcana-prod
   DO_SPACES_ACCESS_KEY=your-access-key
   DO_SPACES_SECRET_KEY=your-secret-key
   DO_SPACES_REGION=nyc3
   SENTRY_DSN=your-sentry-dsn
   ```

3. **Deploy:**
   - Click "Create Resources"
   - App deploys automatically on git push

### Expo EAS (Mobile App)

1. **Setup EAS:**
   ```bash
   npm install -g @expo/eas-cli
   eas login
   cd mobile-app
   eas build:configure
   ```

2. **Set Environment Variables:**
   
   **Option A: EAS Dashboard**
   - Go to [Expo Dashboard](https://expo.dev/)
   - Select project → Environment Variables
   - Add production variables

   **Option B: EAS CLI**
   ```bash
   eas env:set API_URL=https://your-app.ondigitalocean.app --environment=production
   eas env:set GOOGLE_CLIENT_ID=your-mobile-client-id --environment=production
   ```

3. **Build and Deploy:**
   ```bash
   # Development build
   eas build --profile development
   
   # Production build
   eas build --profile production
   
   # Submit to app stores
   eas submit --platform ios
   eas submit --platform android
   ```

## Environment Validation

### Automatic Validation

The system includes comprehensive environment validation:

```bash
# Validate both backend and mobile app
npm run validate:env

# Validate individual services
npm run validate:env --prefix backend
npm run validate:env --prefix mobile-app
```

### Validation Features

- **Required Variable Checking** - Ensures all critical variables are set
- **Format Validation** - Validates URLs, secrets length, OAuth client IDs
- **Security Recommendations** - Suggests improvements for production
- **Helpful Error Messages** - Clear guidance on how to fix issues
- **Configuration Summary** - Shows current setup (with sensitive data masked)

## Security Best Practices

### Development
- Use real services (MongoDB Atlas, DigitalOcean) even in development
- Generate strong secrets (32+ characters) even for development
- Never commit `.env` files to version control
- Test with actual OAuth credentials

### Production
- Use 64+ character secrets for JWT and session signing
- Restrict CORS origins to your actual domains
- Enable HTTPS-only cookies
- Use separate OAuth clients for production
- Enable Sentry error tracking
- Regularly rotate secrets

## Troubleshooting

### Common Issues

1. **Environment Validation Fails:**
   ```bash
   # Check what's missing
   npm run validate:env
   
   # Copy example files
   cp backend/.env.example backend/.env
   cp mobile-app/.env.example mobile-app/.env
   ```

2. **MongoDB Connection Issues:**
   - Verify connection string format
   - Check MongoDB Atlas network access
   - Ensure database user has proper permissions

3. **Google OAuth Issues:**
   - Verify client ID format (.apps.googleusercontent.com)
   - Check OAuth consent screen configuration
   - Ensure redirect URIs are configured

4. **DigitalOcean Spaces Issues:**
   - Verify bucket name and region
   - Check API key permissions
   - Ensure CORS is configured for your domains

### Getting Help

- **Backend Issues:** Check `backend/.env.example` for required format
- **Mobile Issues:** Check `mobile-app/.env.example` for required format
- **Deployment:** See `DEPLOYMENT_GUIDE.md` for platform-specific instructions
- **Validation:** Run `npm run validate:env` for detailed error messages

## File Structure

```
persona-arcana-mobile/
├── backend/
│   ├── .env.example              # Backend environment template
│   ├── config/environment.js     # Environment validation logic
│   └── scripts/validate-environment.js
├── mobile-app/
│   ├── .env.example              # Mobile app environment template
│   ├── src/config/environment.js # Mobile environment config
│   └── scripts/validate-environment.js
├── eas.json                      # Expo build configuration
├── .do/app.yaml                  # DigitalOcean deployment config
├── DEPLOYMENT_GUIDE.md           # Platform-specific deployment
└── ENVIRONMENT_SETUP.md          # This file
```

This streamlined approach leverages platform-native tools while maintaining developer-friendly local development.
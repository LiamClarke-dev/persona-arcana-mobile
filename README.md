# Persona Arcana Mobile App

Mobile-first AI journal analysis app with dual AI services for immediate insights and long-term persona discovery.

## Project Structure

```
persona-arcana-mobile/
├── backend/                 # Node.js API server
├── mobile-app/             # Expo React Native app
├── shared/                 # Shared types and utilities
└── docs/                   # Documentation
```

## Phase 1: Foundation & Infrastructure

Currently implementing Phase 1 - setting up the core infrastructure:
- MongoDB Atlas database with vector search
- DigitalOcean hosting and file storage
- Google OAuth authentication
- Mobile app shell with navigation
- Error tracking with Sentry

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- MongoDB Atlas account
- DigitalOcean account
- Google Cloud Console project

### Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure environment variables
   npm run dev
   ```

2. **Mobile App Setup**
   ```bash
   cd mobile-app
   npm install
   npx expo start
   ```

## Implementation Progress

See `.kiro/specs/phase-1-foundation/tasks.md` for detailed implementation tasks.

- [ ] Task 1: MongoDB Atlas setup
- [ ] Task 2: DigitalOcean infrastructure
- [ ] Task 3: Backend API foundation
- [ ] Task 4: Google OAuth authentication
- [ ] Task 5: Mobile app shell
- [ ] Task 6: Mobile authentication flow
- [ ] Task 7: Profile management
- [ ] Task 8: Error tracking
- [ ] Task 9: Environment configuration
- [ ] Task 10: Push notifications foundation
- [ ] Task 11: Testing suite
- [ ] Task 12: Development environment
- [ ] Task 13: Integration testing

## Tech Stack

**Mobile**: Expo (React Native), React Navigation, Expo AuthSession
**Backend**: Node.js, Express, Mongoose, Passport.js
**Database**: MongoDB Atlas with vector search
**Infrastructure**: DigitalOcean App Platform + Spaces
**Authentication**: Google OAuth 2.0
**Error Tracking**: Sentry
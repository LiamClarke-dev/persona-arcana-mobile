# Authentication System Documentation

## Overview

The Persona Arcana mobile app uses Google OAuth 2.0 for user authentication with JWT tokens for API access. This provides a secure, familiar sign-in experience while maintaining stateless API authentication.

## Architecture

```
Mobile App → Google OAuth → Backend API → JWT Token → Protected Routes
```

### Components

1. **Google OAuth 2.0**: Primary authentication method
2. **JWT Tokens**: Stateless API authentication
3. **MongoDB Sessions**: OAuth flow state management
4. **Passport.js**: Authentication middleware
5. **Express Session**: Session management with MongoDB store

## Setup Instructions

### 1. Environment Variables

Required environment variables in `.env`:

```bash
# Authentication
JWT_SECRET=your-secure-jwt-secret-at-least-32-characters
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MOBILE_APP_SCHEME=exp://localhost:19000  # For development

# Database (required for sessions)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable Google+ API (or Google People API)
4. Create OAuth 2.0 credentials:
   - **Application type**: Web application
   - **Name**: Persona Arcana Backend
   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/auth/google/callback`
     - Production: `https://your-domain.com/auth/google/callback`

### 3. Quick Setup

Run the setup script:

```bash
npm run setup:auth
```

This will:

- Generate a secure JWT secret
- Create .env file from template
- Provide setup instructions

## API Endpoints

### Authentication Routes

| Method | Endpoint                | Description           | Auth Required |
| ------ | ----------------------- | --------------------- | ------------- |
| GET    | `/auth/google`          | Initiate Google OAuth | No            |
| GET    | `/auth/google/callback` | OAuth callback        | No            |
| POST   | `/auth/verify`          | Verify JWT token      | Yes           |
| POST   | `/auth/logout`          | Logout user           | Yes           |
| GET    | `/auth/status`          | Auth config status    | No            |
| GET    | `/auth/error`           | Handle auth errors    | No            |

### Protected User Routes

| Method | Endpoint                    | Description         | Auth Required |
| ------ | --------------------------- | ------------------- | ------------- |
| GET    | `/api/users/me`             | Get current user    | Yes           |
| PUT    | `/api/users/me`             | Update current user | Yes           |
| GET    | `/api/users/me/stats`       | Get user stats      | Yes           |
| PATCH  | `/api/users/me/preferences` | Update preferences  | Yes           |

## Authentication Flow

### Mobile App Sign-In

1. **Initiate OAuth**: Mobile app opens `/auth/google?redirect_uri=exp://app/auth`
2. **Google Sign-In**: User completes Google OAuth flow
3. **Callback Processing**: Backend receives Google profile data
4. **User Creation/Update**: Create new user or update existing
5. **JWT Generation**: Generate JWT token with user data
6. **Mobile Redirect**: Redirect to mobile app with token and user data
7. **Token Storage**: Mobile app stores JWT in secure storage

### API Request Authentication

1. **Include Token**: Add `Authorization: Bearer <jwt-token>` header
2. **Token Validation**: Passport JWT strategy validates token
3. **User Loading**: Load user from database using token payload
4. **Request Processing**: Process authenticated request

## Code Examples

### Mobile App Integration

```javascript
// Expo AuthSession integration
import * as AuthSession from 'expo-auth-session';

const signInWithGoogle = async () => {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const result = await AuthSession.startAsync({
    authUrl: `${API_BASE_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`,
    returnUrl: redirectUri,
  });

  if (result.type === 'success') {
    const { token, user } = result.params;
    // Store token and user data
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }
};
```

### API Client with Authentication

```javascript
// API client with automatic token inclusion
const apiClient = {
  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : undefined,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, redirect to login
      await AsyncStorage.removeItem('authToken');
      // Navigate to login screen
    }

    return response.json();
  },
};
```

### Backend Route Protection

```javascript
const { requireAuth } = require('../middleware/auth');

// Protect route with authentication
router.get('/protected', requireAuth, (req, res) => {
  // req.user contains authenticated user data
  res.json({ user: req.user });
});

// Protect route with ownership validation
router.get('/users/:id', requireAuth, (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  // Process request
});
```

## Security Features

### JWT Token Security

- **Secure Secret**: 64-byte random secret for signing
- **Expiration**: 30-day token lifetime
- **Payload**: Minimal user data (ID, email, name)
- **Issuer/Audience**: Validates token origin and target

### Session Security

- **MongoDB Store**: Sessions stored in database
- **HTTP-Only Cookies**: Prevent XSS attacks
- **Secure Cookies**: HTTPS-only in production
- **SameSite**: Cross-site protection
- **TTL**: Automatic session cleanup

### OAuth Security

- **Scope Limitation**: Only basic profile and email
- **State Validation**: CSRF protection (handled by Passport)
- **Redirect URI Validation**: Prevents redirect attacks

## Error Handling

### Authentication Errors

| Error Code      | Description                  | HTTP Status |
| --------------- | ---------------------------- | ----------- |
| `UNAUTHORIZED`  | No token or invalid token    | 401         |
| `TOKEN_EXPIRED` | JWT token has expired        | 401         |
| `ACCESS_DENIED` | User lacks permission        | 403         |
| `AUTH_ERROR`    | General authentication error | 500         |

### OAuth Errors

- **authentication_failed**: Google OAuth failed
- **token_generation_failed**: JWT creation failed
- **no_email**: Google account has no email
- **user_creation_failed**: Database error creating user

## Testing

### Run Authentication Tests

```bash
# Run all auth tests
npm run test:auth

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Coverage

- ✅ JWT token generation and validation
- ✅ OAuth flow simulation
- ✅ Protected route access
- ✅ Ownership validation
- ✅ Error handling
- ✅ Session management

## Troubleshooting

### Common Issues

1. **"Missing JWT_SECRET"**
   - Run `npm run setup:auth` to generate secret
   - Ensure .env file has JWT_SECRET

2. **"Google OAuth redirect mismatch"**
   - Check redirect URI in Google Console
   - Ensure it matches your backend URL

3. **"Token validation failed"**
   - Check JWT_SECRET consistency
   - Verify token format and expiration

4. **"Session store error"**
   - Ensure MongoDB connection is working
   - Check MONGODB_URI in .env

### Debug Mode

Enable debug logging:

```bash
DEBUG=passport:* npm run dev
```

## Production Considerations

### Environment Variables

```bash
# Production settings
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
MOBILE_APP_SCHEME=your-app://auth
COOKIE_DOMAIN=.yourdomain.com
```

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure JWT secret (64+ characters)
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable Sentry error tracking
- [ ] Use production Google OAuth credentials
- [ ] Set secure cookie domain

### Monitoring

Monitor these metrics:

- Authentication success/failure rates
- JWT token validation errors
- Session creation/cleanup
- OAuth callback response times
- User creation/update rates

## Migration Notes

This authentication system is designed for Phase 1 and will support:

- Phase 2: AI analysis with user context
- Phase 3: Persona system with user ownership
- Phase 4: Insights with user data protection
- Phase 5: Advanced features requiring authentication

The JWT-based approach ensures scalability and stateless API design suitable for mobile applications.

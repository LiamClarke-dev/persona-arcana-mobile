# Sentry Error Tracking Setup Guide

This document provides comprehensive instructions for setting up Sentry error tracking for the Persona Arcana mobile app project.

## Overview

Sentry is configured for both the backend API and mobile app to provide:

- **Error Tracking**: Automatic capture of exceptions and errors
- **Performance Monitoring**: API response time tracking and slow request detection
- **User Context**: Error correlation with user actions and authentication state
- **Breadcrumbs**: Detailed event trails for debugging
- **Sensitive Data Protection**: Automatic filtering of passwords, tokens, and secrets

## Prerequisites

1. **Sentry Account**: Create a free account at [sentry.io](https://sentry.io)
2. **Sentry Projects**: Create separate projects for backend and mobile app
3. **DSN Keys**: Obtain Data Source Name (DSN) keys for each project

## Sentry Project Setup

### 1. Create Sentry Projects

1. Log in to your Sentry dashboard
2. Create a new project for the backend:
   - Platform: **Node.js**
   - Project name: `persona-arcana-backend`
3. Create a new project for the mobile app:
   - Platform: **React Native**
   - Project name: `persona-arcana-mobile`

### 2. Get DSN Keys

After creating each project, copy the DSN from the project settings:

- Format: `https://[key]@[organization].ingest.sentry.io/[project-id]`

## Backend Configuration

### 1. Environment Variables

Add to `backend/.env`:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-backend-dsn@organization.ingest.sentry.io/project-id
SENTRY_RELEASE=persona-arcana-backend@1.0.0
```

### 2. Features Included

- **Automatic Error Capture**: All unhandled exceptions
- **Performance Monitoring**: API response time tracking
- **Slow Request Detection**: Alerts for requests >3s (API) or >1s (simple)
- **User Context**: Correlates errors with authenticated users
- **Request Tracing**: Full request lifecycle monitoring
- **Sensitive Data Filtering**: Removes passwords, tokens, secrets

### 3. Test Backend Integration

```bash
cd backend
npm run test:sentry
```

Expected output when SENTRY_DSN is configured:

```
🧪 Testing Sentry Error Tracking Integration...
📡 Sentry DSN configured: https://abc123...
🌍 Environment: development

1. Testing manual error capture...
   ✅ Manual error captured
2. Testing message capture...
   ✅ Message captured
...
🎉 All Sentry tests completed successfully!
```

## Mobile App Configuration

### 1. Environment Variables

Add to `mobile-app/.env`:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-mobile-dsn@organization.ingest.sentry.io/project-id
```

### 2. Features Included

- **Automatic Error Capture**: JavaScript errors, promise rejections
- **Navigation Tracking**: Screen transitions and user flows
- **API Call Monitoring**: Network request performance
- **User Context**: Authentication state correlation
- **Breadcrumbs**: User interaction trails
- **Crash Reporting**: Native crash detection (iOS/Android)

### 3. Test Mobile Integration

The mobile app includes a test screen for development:

```javascript
// Add to your navigation for testing (development only)
import SentryTestScreen from '../components/SentryTestScreen';

// In your navigator:
<Stack.Screen name="SentryTest" component={SentryTestScreen} />;
```

## Performance Monitoring

### Backend Performance Thresholds

- **API Endpoints**: >3 seconds = warning, >10 seconds = error
- **Simple Requests**: >1 second = warning, >5 seconds = error
- **Database Queries**: Tracked via transaction context

### Mobile Performance Tracking

- **Screen Load Times**: Navigation performance
- **API Response Times**: Network request duration
- **User Interactions**: Touch events and gestures

## Error Context and Filtering

### Automatic Context Capture

**Backend:**

- User ID and email (when authenticated)
- Request method, URL, and headers
- Response status and timing
- Database operation context

**Mobile:**

- User authentication state
- Screen/component context
- Device and platform information
- Network connectivity status

### Sensitive Data Protection

Both backend and mobile automatically filter:

- `password` fields
- `token` values
- `secret` keys
- Authorization headers
- Cookie data

## Development vs Production

### Development Environment

- **Sample Rate**: 100% (all events captured)
- **Verbose Logging**: Console output enabled
- **Test Endpoints**: Error testing utilities available
- **Breadcrumb Detail**: Maximum context for debugging

### Production Environment

- **Sample Rate**: 10% (performance optimization)
- **Filtered Logging**: Reduced console output
- **Error Grouping**: Intelligent error deduplication
- **Performance Focus**: Critical error prioritization

## Monitoring and Alerts

### Recommended Sentry Alerts

1. **High Error Rate**: >10 errors per minute
2. **New Error Types**: First occurrence of new error
3. **Performance Degradation**: >50% increase in response time
4. **User Impact**: Errors affecting >5% of users

### Dashboard Metrics

Monitor these key metrics:

- **Error Rate**: Errors per minute/hour
- **User Impact**: Percentage of users affected
- **Response Time**: P95 API response times
- **Crash Rate**: Mobile app crash percentage

## Troubleshooting

### Common Issues

**Backend not sending events:**

1. Verify SENTRY_DSN in `.env` file
2. Check network connectivity
3. Ensure Sentry is initialized before other imports
4. Run `npm run test:sentry` for diagnostics

**Mobile app not tracking:**

1. Verify SENTRY_DSN in app.config.js extra section
2. Check that Sentry is initialized in App.js
3. Ensure navigation integration is configured
4. Test with SentryTestScreen component

**Missing user context:**

1. Verify authentication flow calls `setUserContext()`
2. Check that user data is available when errors occur
3. Ensure logout calls `clearUserContext()`

### Debug Mode

Enable debug logging by adding to environment:

```bash
# Backend
SENTRY_DEBUG=true

# Mobile (in app.config.js)
debug: true
```

## Security Considerations

### Data Privacy

- **No PII**: Email addresses filtered from mobile events
- **Token Protection**: JWT tokens automatically removed
- **Request Sanitization**: Sensitive headers stripped
- **User Consent**: Consider adding opt-out mechanism

### Network Security

- **HTTPS Only**: All Sentry communication encrypted
- **Rate Limiting**: Built-in protection against spam
- **IP Filtering**: Optional IP allowlist configuration

## Integration with CI/CD

### Release Tracking

Configure release tracking for better error correlation:

```bash
# Backend deployment
SENTRY_RELEASE=persona-arcana-backend@$(git rev-parse HEAD)

# Mobile app build
SENTRY_RELEASE=persona-arcana-mobile@$(git rev-parse HEAD)
```

### Source Maps (Future)

For production debugging, consider uploading source maps:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps during build
sentry-cli releases files $RELEASE upload-sourcemaps ./build
```

## Cost Management

### Free Tier Limits

Sentry free tier includes:

- 5,000 errors per month
- 10,000 performance units per month
- 30-day data retention

### Optimization Tips

1. **Sample Rates**: Use 10% in production
2. **Error Filtering**: Filter out known non-critical errors
3. **Performance Monitoring**: Focus on critical user paths
4. **Data Retention**: Archive old events regularly

## Support and Resources

- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io)
- **React Native Guide**: [docs.sentry.io/platforms/react-native](https://docs.sentry.io/platforms/react-native)
- **Node.js Guide**: [docs.sentry.io/platforms/node](https://docs.sentry.io/platforms/node)
- **Performance Monitoring**: [docs.sentry.io/product/performance](https://docs.sentry.io/product/performance)

---

## Quick Start Checklist

- [ ] Create Sentry account and projects
- [ ] Add SENTRY_DSN to backend `.env` file
- [ ] Add SENTRY_DSN to mobile app `.env` file
- [ ] Run backend test: `npm run test:sentry`
- [ ] Test mobile app with SentryTestScreen
- [ ] Verify events appear in Sentry dashboard
- [ ] Configure alerts and notifications
- [ ] Set up release tracking for deployments

**Status**: ✅ Sentry integration complete and ready for production use.

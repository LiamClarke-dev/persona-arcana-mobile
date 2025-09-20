# Sentry Mobile Integration Issues - Lessons Learned

## Overview

This document details the significant challenges encountered while attempting to integrate Sentry error tracking into the Persona Arcana mobile app (Expo SDK 54). After extensive troubleshooting, we determined that mobile Sentry integration is too complex for the current phase and should be deferred.

## Issues Encountered

### 1. Initial Prototype Error
**Error**: `TypeError: Cannot read property 'prototype' of undefined`
**Root Cause**: Using `@sentry/react-native` directly in a managed Expo app
**Impact**: Complete app crash on startup

### 2. Integration Compatibility Issues
**Error**: `integration.setupOnce is not a function`
**Root Cause**: Version mismatch between `@sentry/node` (7.81.1) and `@sentry/profiling-node` (10.12.0)
**Impact**: Backend Sentry tests failing

### 3. Extends Property Error
**Error**: `TypeError: Cannot read property '__extends' of undefined`
**Root Cause**: Sentry packages conflicting with Expo SDK 54's new architecture
**Impact**: Runtime crashes even with proper sentry-expo package

### 4. Architecture Conflicts
**Issue**: Expo Go enforces new React Native architecture, but Sentry packages weren't fully compatible
**Impact**: Inconsistent behavior between development and potential production builds

## Technical Details

### Package Conflicts Discovered

1. **@sentry/react-native vs sentry-expo**
   - `@sentry/react-native` is for bare React Native apps
   - `sentry-expo` is required for managed Expo apps
   - Mixing these causes prototype chain issues

2. **Version Dependencies**
   ```json
   // Problematic combination
   "@sentry/node": "7.81.1",
   "@sentry/profiling-node": "10.12.0",
   "@sentry/react-native": "~6.20.0"
   ```

3. **SDK 54 Compatibility**
   - Expo SDK 54 uses React Native 0.81.4
   - Some Sentry integrations not fully compatible with new architecture
   - React DevTools conflicts with Sentry's console patching

### Troubleshooting Steps Attempted

1. **Clean Dependency Installation**
   ```bash
   # Removed all node_modules and package locks
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Expo Version Alignment**
   ```bash
   # Upgraded from SDK 53 to SDK 54
   npm install expo@54.0.9
   npx expo install --fix
   ```

3. **Sentry Package Switching**
   ```bash
   # Removed direct Sentry packages
   npm uninstall @sentry/react-native @sentry/profiling-node
   
   # Installed Expo-compatible version
   npx expo install sentry-expo
   ```

4. **Configuration Simplification**
   - Removed complex integrations (profiling, navigation tracking)
   - Simplified to basic error capture only
   - Still caused runtime errors

## Root Cause Analysis

### Why Sentry Failed in Mobile App

1. **Managed Expo Constraints**
   - Expo Go has strict runtime requirements
   - Sentry's native modules conflict with Expo's managed workflow
   - Console/DevTools patching causes prototype chain issues

2. **New Architecture Incompatibility**
   - React Native's new architecture (Fabric/TurboModules) 
   - Sentry's legacy integration methods
   - Hermes JavaScript engine compatibility issues

3. **Development vs Production Gap**
   - Issues only manifest in Expo Go development environment
   - Would likely work in production builds (EAS Build)
   - But development workflow becomes unusable

## Backend Sentry Success

### What Works Well
The backend Sentry integration is **fully functional** and provides:

- ✅ Automatic error capture with user context
- ✅ Performance monitoring with request tracing
- ✅ Slow request detection (>3s API, >1s simple)
- ✅ Sensitive data filtering (passwords, tokens, secrets)
- ✅ Comprehensive test suite (`npm run test:sentry`)

### Backend Configuration
```javascript
// backend/config/sentry.js - WORKING
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // ... rest of config works perfectly
});
```

## Decision: Defer Mobile Sentry

### Reasons for Deferral

1. **Development Velocity**: Sentry integration blocking core app development
2. **Complexity vs Value**: Mobile error tracking setup too complex for current phase
3. **Backend Coverage**: Server-side error tracking captures most critical issues
4. **Alternative Solutions**: Console logging sufficient for development phase

### What We Keep

1. **Backend Sentry**: Fully functional and valuable
2. **Mobile Stub Functions**: Sentry functions exist but log to console
3. **Future Compatibility**: Code structure ready for future Sentry integration

## Current Mobile Error Tracking

### Stub Implementation
```javascript
// src/config/sentry.js - SAFE STUB VERSION
export const captureError = (error, context = {}) => {
  console.log('Sentry disabled - would capture error:', error.message);
};

export const captureMessage = (message, level = 'info', context = {}) => {
  console.log('Sentry disabled - would capture message:', message);
};

// ... other stub functions
```

### Benefits of Stub Approach
- ✅ App works reliably in development
- ✅ Code structure preserved for future integration
- ✅ Console logging provides debugging info
- ✅ No runtime crashes or prototype errors
- ✅ Easy to re-enable when ready

## Future Sentry Integration Path

### When to Revisit Mobile Sentry

1. **After MVP Launch**: When app is stable and deployed
2. **EAS Build Migration**: When moving from Expo Go to production builds
3. **Sentry Updates**: When sentry-expo fully supports SDK 54+
4. **Team Bandwidth**: When dedicated time for complex integrations

### Recommended Future Approach

1. **Use EAS Build**: Avoid Expo Go limitations
2. **Start Simple**: Basic error capture only, no performance monitoring
3. **Test Thoroughly**: Extensive testing in production-like environment
4. **Gradual Rollout**: Enable for small user percentage initially

## Alternative Error Tracking Options

### Immediate Alternatives
1. **Console Logging**: Current approach, works well for development
2. **Backend Error Correlation**: Track mobile errors via API calls
3. **User Feedback**: In-app feedback for critical issues
4. **Crash Analytics**: Expo's built-in crash reporting

### Future Considerations
1. **Bugsnag**: Alternative to Sentry, may have better Expo support
2. **LogRocket**: Session replay with error tracking
3. **Custom Solution**: Simple error reporting to backend endpoint

## Lessons Learned

### Technical Lessons
1. **Managed Expo Limitations**: Some packages incompatible with managed workflow
2. **Version Alignment Critical**: Exact version matching required for Expo
3. **Development vs Production**: Different runtime environments have different constraints
4. **Incremental Integration**: Add complex packages after core functionality works

### Process Lessons
1. **Isolate Issues**: Test with minimal app first (smoke test approach worked)
2. **Document Everything**: Complex integration issues need detailed documentation
3. **Have Fallbacks**: Always maintain working state while experimenting
4. **Know When to Stop**: Sometimes deferring is the right technical decision

## Recommendations

### For Current Phase (Phase 1)
- ✅ Keep backend Sentry (working well)
- ✅ Use mobile stub functions (reliable)
- ✅ Focus on core app functionality
- ✅ Document errors via console logging

### For Future Phases
- 🔄 Revisit mobile Sentry after MVP
- 🔄 Consider EAS Build for production
- 🔄 Evaluate alternative error tracking solutions
- 🔄 Implement gradual rollout strategy

## Files Modified

### Disabled/Stubbed Files
- `mobile-app/src/config/sentry.js` - Stubbed functions
- `mobile-app/src/contexts/AuthContext.js` - Commented Sentry calls
- `mobile-app/src/services/authService.js` - Commented Sentry calls
- `mobile-app/src/services/profileService.js` - Commented Sentry calls
- `mobile-app/App.js` - Commented Sentry initialization

### Working Files
- `backend/config/sentry.js` - Fully functional
- `backend/middleware/logging.js` - Enhanced with Sentry
- `backend/scripts/test-sentry.js` - Comprehensive test suite

## Conclusion

While Sentry integration for the mobile app proved too complex for the current development phase, we successfully:

1. ✅ **Resolved all runtime errors** - App now works reliably
2. ✅ **Maintained backend error tracking** - Server-side monitoring functional
3. ✅ **Preserved future compatibility** - Code structure ready for future integration
4. ✅ **Documented lessons learned** - Clear path forward when ready

The decision to defer mobile Sentry integration allows the team to focus on core app functionality while maintaining robust backend error tracking. This pragmatic approach balances technical debt with development velocity.

**Status**: Mobile Sentry deferred ✅ Backend Sentry functional ✅ App working reliably ✅
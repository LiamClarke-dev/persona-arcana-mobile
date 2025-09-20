// import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';

// Initialize Sentry for React Native with sentry-expo
export const initSentry = () => {
  console.log('⚠️  Sentry temporarily disabled');
};

// Error capture utilities (disabled)
export const captureError = (error, context = {}) => {
  console.log('Sentry disabled - would capture error:', error.message);
};

export const captureMessage = (message, level = 'info', context = {}) => {
  console.log('Sentry disabled - would capture message:', message);
};

export const setUserContext = (user) => {
  console.log('Sentry disabled - would set user context:', user.id);
};

export const clearUserContext = () => {
  console.log('Sentry disabled - would clear user context');
};

export const startTransaction = (name, op = 'navigation') => {
  return { finish: () => {}, setStatus: () => {} };
};

export const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  console.log('Sentry disabled - would add breadcrumb:', message);
};

export const wrapApiCall = async (apiCall, operationName) => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.log('Sentry disabled - would capture API error:', error.message);
    throw error;
  }
};

export default {};
import Constants from 'expo-constants';
// import { captureError, wrapApiCall, addBreadcrumb } from '../config/sentry';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

class ProfileService {
  /**
   * Upload profile image
   * @param {string} userId - User ID
   * @param {string} uri - Local image URI
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} Upload result
   */
  async uploadProfileImage(userId, uri, authToken) {
    return wrapApiCall(async () => {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Get file info from URI
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri,
        name: filename,
        type,
      });

      const response = await fetch(`${API_URL}/api/upload/profile/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      addBreadcrumb('Profile image uploaded successfully', 'profile', 'info', {
        userId,
        fileSize: formData._parts?.length,
      });

      return result;
    }, 'uploadProfileImage');
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userId, profileData, authToken) {
    return wrapApiCall(async () => {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Profile update failed');
      }

      addBreadcrumb('Profile updated successfully', 'profile', 'info', {
        userId,
        updatedFields: Object.keys(profileData),
      });

      return result;
    }, 'updateProfile');
  }

  /**
   * Get current user profile
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} User profile
   */
  async getCurrentProfile(authToken) {
    return wrapApiCall(async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get profile');
      }

      return result;
    }, 'getCurrentProfile');
  }

  /**
   * Update user profile image
   * @param {string} imageUrl - New profile image URL
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} Update result
   */
  async updateProfileImage(imageUrl, authToken) {
    return wrapApiCall(async () => {
      const response = await fetch(`${API_URL}/api/users/me/profile-image`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImage: imageUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Profile image update failed');
      }

      addBreadcrumb('Profile image URL updated', 'profile', 'info', {
        imageUrl,
      });

      return result;
    }, 'updateProfileImage');
  }

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences to update
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} Update result
   */
  async updatePreferences(preferences, authToken) {
    return wrapApiCall(async () => {
      const response = await fetch(`${API_URL}/api/users/me/preferences`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Preferences update failed');
      }

      addBreadcrumb('User preferences updated', 'profile', 'info', {
        updatedPreferences: Object.keys(preferences),
      });

      return result;
    }, 'updatePreferences');
  }
}

export default new ProfileService();
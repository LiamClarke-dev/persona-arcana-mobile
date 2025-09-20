import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useImagePicker } from '../hooks/useImagePicker';
import profileService from '../services/profileService';

const ProfileUploadTest = () => {
  const { user, authToken, updateUser } = useAuth();
  const { showImagePickerOptions, uploading: imageUploading } = useImagePicker();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleImageSelect = async () => {
    try {
      const result = await showImagePickerOptions();
      
      if (result) {
        setSelectedImage(result);
        setUploadResult(null);
        Alert.alert(
          'Image Selected',
          `Ready to upload!\nSize: ${Math.round(result.fileSize / 1024)}KB\nDimensions: ${result.width}x${result.height}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', error.message || 'Failed to select image');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!user || !authToken) {
      Alert.alert('Error', 'You must be signed in to upload images');
      return;
    }

    try {
      setUploading(true);
      setUploadResult(null);

      // Step 1: Upload image to DigitalOcean Spaces
      console.log('Uploading image to DigitalOcean Spaces...');
      const uploadResponse = await profileService.uploadProfileImage(
        user._id,
        selectedImage.uri,
        authToken
      );

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'Upload failed');
      }

      console.log('Image uploaded successfully:', uploadResponse.data.imageUrl);

      // Step 2: Update user profile with new image URL
      console.log('Updating user profile...');
      const updateResponse = await profileService.updateProfileImage(
        uploadResponse.data.imageUrl,
        authToken
      );

      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to update profile');
      }

      console.log('Profile updated successfully');

      // Step 3: Update local user state
      await updateUser(updateResponse.data);

      setUploadResult({
        success: true,
        imageUrl: uploadResponse.data.imageUrl,
        originalSize: selectedImage.fileSize,
        uploadedSize: uploadResponse.data.size,
        mimeType: uploadResponse.data.mimeType,
      });

      Alert.alert(
        'Success!',
        'Profile image uploaded and updated successfully!',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error.message.includes('too large')) {
        errorMessage = 'Image is too large. Please select an image smaller than 5MB.';
      } else if (error.message.includes('Invalid file type')) {
        errorMessage = 'Invalid file type. Please select a JPEG, PNG, or WebP image.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('auth')) {
        errorMessage = 'Authentication error. Please sign in again.';
      }

      setUploadResult({
        success: false,
        error: errorMessage,
      });

      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setUploading(false);
    }
  };

  const clearTest = () => {
    setSelectedImage(null);
    setUploadResult(null);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile Upload Test</Text>
        <View style={styles.notSignedIn}>
          <Ionicons name="person-outline" size={48} color={theme.colors.text.tertiary} />
          <Text style={styles.notSignedInText}>
            Please sign in to test profile image upload
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile Upload Test</Text>
      <Text style={styles.subtitle}>Test the complete profile image upload flow</Text>

      {/* Current Profile Image */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Profile Image</Text>
        <View style={styles.currentImageContainer}>
          {user.profileImage || user.googleImage ? (
            <Image
              source={{ uri: user.profileImage || user.googleImage }}
              style={styles.currentImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={40} color={theme.colors.text.tertiary} />
            </View>
          )}
          <Text style={styles.imageLabel}>
            {user.profileImage ? 'Custom Image' : user.googleImage ? 'Google Image' : 'No Image'}
          </Text>
        </View>
      </View>

      {/* Image Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select New Image</Text>
        
        <TouchableOpacity
          style={[styles.button, imageUploading && styles.buttonDisabled]}
          onPress={handleImageSelect}
          disabled={imageUploading || uploading}
        >
          {imageUploading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Ionicons name="camera" size={20} color={theme.colors.white} />
          )}
          <Text style={styles.buttonText}>
            {imageUploading ? 'Processing...' : 'Select Image'}
          </Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.selectedImage}
              resizeMode="cover"
            />
            <View style={styles.imageInfo}>
              <Text style={styles.infoText}>
                Size: {Math.round(selectedImage.fileSize / 1024)}KB
              </Text>
              <Text style={styles.infoText}>
                Dimensions: {selectedImage.width}x{selectedImage.height}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Upload Action */}
      {selectedImage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Image</Text>
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.uploadButton,
              uploading && styles.buttonDisabled
            ]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Ionicons name="cloud-upload" size={20} color={theme.colors.white} />
            )}
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : 'Upload & Update Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Result</Text>
          
          {uploadResult.success ? (
            <View style={styles.successResult}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.successText}>Upload Successful!</Text>
              
              <View style={styles.resultDetails}>
                <Text style={styles.resultText}>
                  Image URL: {uploadResult.imageUrl.substring(0, 50)}...
                </Text>
                <Text style={styles.resultText}>
                  Original Size: {Math.round(uploadResult.originalSize / 1024)}KB
                </Text>
                <Text style={styles.resultText}>
                  Optimized Size: {Math.round(uploadResult.uploadedSize / 1024)}KB
                </Text>
                <Text style={styles.resultText}>
                  Format: {uploadResult.mimeType}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.errorResult}>
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>Upload Failed</Text>
              <Text style={styles.errorMessage}>{uploadResult.error}</Text>
            </View>
          )}
        </View>
      )}

      {/* Clear Test */}
      {(selectedImage || uploadResult) && (
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearTest}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.text.primary} />
          <Text style={[styles.buttonText, styles.clearButtonText]}>
            Clear Test
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.heading2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  notSignedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  notSignedInText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.heading3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  currentImageContainer: {
    alignItems: 'center',
  },
  currentImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.tertiary,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.text.tertiary,
  },
  uploadButton: {
    backgroundColor: theme.colors.success,
  },
  clearButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  clearButtonText: {
    color: theme.colors.text.primary,
  },
  selectedImageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background.tertiary,
    marginBottom: theme.spacing.md,
  },
  imageInfo: {
    alignItems: 'center',
  },
  infoText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  successResult: {
    alignItems: 'center',
  },
  successText: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorResult: {
    alignItems: 'center',
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    textAlign: 'center',
  },
  resultDetails: {
    alignSelf: 'stretch',
  },
  resultText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
});

export default ProfileUploadTest;
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export const useImagePicker = () => {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const validateImage = (imageInfo) => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    
    if (imageInfo.fileSize && imageInfo.fileSize > maxSize) {
      throw new Error('Image is too large. Please select an image smaller than 5MB.');
    }

    // Check image dimensions (reasonable limits)
    if (imageInfo.width < 100 || imageInfo.height < 100) {
      throw new Error('Image is too small. Please select an image at least 100x100 pixels.');
    }

    return true;
  };

  const optimizeImage = async (uri) => {
    try {
      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Resize to max 800x800 while maintaining aspect ratio
          { resize: { width: 800, height: 800 } }
        ],
        {
          compress: 0.8, // 80% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image optimization error:', error);
      // Return original URI if optimization fails
      return uri;
    }
  };

  const pickImage = async (options = {}) => {
    try {
      setUploading(true);

      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Configure picker options
      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspect || [1, 1], // Square by default
        quality: 0.9,
        ...options,
      };

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];

      // Validate image
      validateImage(asset);

      // Optimize image
      const optimizedUri = await optimizeImage(asset.uri);

      return {
        uri: optimizedUri,
        originalUri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        type: asset.type,
      };
    } catch (error) {
      console.error('Image picker error:', error);
      
      // Show user-friendly error messages
      let errorMessage = 'Failed to select image. Please try again.';
      
      if (error.message.includes('too large')) {
        errorMessage = 'Image is too large. Please select an image smaller than 5MB.';
      } else if (error.message.includes('too small')) {
        errorMessage = 'Image is too small. Please select a larger image.';
      } else if (error.message.includes('Permission')) {
        errorMessage = 'Camera roll permission is required to select images.';
      }

      Alert.alert('Image Selection Failed', errorMessage, [{ text: 'OK' }]);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async (options = {}) => {
    try {
      setUploading(true);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Configure camera options
      const cameraOptions = {
        allowsEditing: true,
        aspect: options.aspect || [1, 1], // Square by default
        quality: 0.9,
        ...options,
      };

      // Launch camera
      const result = await ImagePicker.launchCameraAsync(cameraOptions);

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];

      // Validate image
      validateImage(asset);

      // Optimize image
      const optimizedUri = await optimizeImage(asset.uri);

      return {
        uri: optimizedUri,
        originalUri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        type: asset.type,
      };
    } catch (error) {
      console.error('Camera error:', error);
      
      let errorMessage = 'Failed to take photo. Please try again.';
      
      if (error.message.includes('Permission')) {
        errorMessage = 'Camera permission is required to take photos.';
      }

      Alert.alert('Camera Failed', errorMessage, [{ text: 'OK' }]);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const showImagePickerOptions = () => {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose how you want to select your profile image',
        [
          {
            text: 'Camera',
            onPress: async () => {
              try {
                const result = await takePhoto();
                resolve(result);
              } catch (error) {
                resolve(null);
              }
            },
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              try {
                const result = await pickImage();
                resolve(result);
              } catch (error) {
                resolve(null);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  };

  return {
    pickImage,
    takePhoto,
    showImagePickerOptions,
    uploading,
  };
};
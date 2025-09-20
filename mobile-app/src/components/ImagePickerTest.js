import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useImagePicker } from '../hooks/useImagePicker';

const ImagePickerTest = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const { showImagePickerOptions, uploading } = useImagePicker();

  const handleImagePick = async () => {
    try {
      const result = await showImagePickerOptions();
      
      if (result) {
        setSelectedImage(result);
        Alert.alert(
          'Image Selected',
          `Image selected successfully!\nSize: ${Math.round(result.fileSize / 1024)}KB\nDimensions: ${result.width}x${result.height}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', error.message || 'Failed to select image');
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Picker Test</Text>
      <Text style={styles.subtitle}>Test the image picker functionality</Text>

      <View style={styles.imageContainer}>
        {selectedImage ? (
          <View style={styles.selectedImageContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.selectedImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearImage}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons
              name="image-outline"
              size={60}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleImagePick}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <Ionicons
            name="camera"
            size={20}
            color={theme.colors.white}
            style={styles.buttonIcon}
          />
        )}
        <Text style={styles.buttonText}>
          {uploading ? 'Processing...' : 'Select Image'}
        </Text>
      </TouchableOpacity>

      {selectedImage && (
        <View style={styles.imageInfo}>
          <Text style={styles.infoTitle}>Image Information:</Text>
          <Text style={styles.infoText}>
            Size: {Math.round(selectedImage.fileSize / 1024)}KB
          </Text>
          <Text style={styles.infoText}>
            Dimensions: {selectedImage.width}x{selectedImage.height}
          </Text>
          <Text style={styles.infoText}>
            Type: {selectedImage.type}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.background.tertiary,
  },
  clearButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
  },
  placeholderContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.tertiary,
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
    marginBottom: theme.spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.text.tertiary,
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
  },
  imageInfo: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.md,
  },
  infoTitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
});

export default ImagePickerTest;
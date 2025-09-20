import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useImagePicker } from '../hooks/useImagePicker';
import profileService from '../services/profileService';

const ProfileScreen = () => {
  const { user, authToken, signOut, updateUser } = useAuth();
  const { showImagePickerOptions, uploading: imageUploading } = useImagePicker();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async () => {
    try {
      if (!user || !authToken) {
        Alert.alert('Error', 'You must be signed in to upload images.');
        return;
      }

      const imageResult = await showImagePickerOptions();
      
      if (!imageResult) {
        return; // User cancelled
      }

      setUploadingImage(true);

      // Upload image to backend
      const uploadResult = await profileService.uploadProfileImage(
        user._id,
        imageResult.uri,
        authToken
      );

      if (uploadResult.success) {
        // Update user profile with new image URL in database
        const updateResult = await profileService.updateProfileImage(
          uploadResult.data.imageUrl,
          authToken
        );

        if (updateResult.success) {
          // Update local user state
          await updateUser(updateResult.data);

          Alert.alert(
            'Success',
            'Profile image updated successfully!',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error(updateResult.error || 'Failed to update profile');
        }
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error.message.includes('too large')) {
        errorMessage = 'Image is too large. Please select an image smaller than 5MB.';
      } else if (error.message.includes('Invalid file type')) {
        errorMessage = 'Invalid file type. Please select a JPEG, PNG, or WebP image.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      
      if (authToken) {
        const profileResult = await profileService.getCurrentProfile(authToken);
        if (profileResult.success) {
          await updateUser(profileResult.data);
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getProfileImageUri = () => {
    if (user?.profileImage) {
      return user.profileImage;
    }
    if (user?.googleImage) {
      return user.googleImage;
    }
    return null;
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Unknown';
    
    try {
      const joinDate = new Date(date);
      return joinDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleImageUpload}
            disabled={uploadingImage || imageUploading}
          >
            {getProfileImageUri() ? (
              <Image
                source={{ uri: getProfileImageUri() }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons
                  name="person"
                  size={60}
                  color={theme.colors.text.tertiary}
                />
              </View>
            )}
            
            {/* Upload overlay */}
            <View style={styles.imageOverlay}>
              {uploadingImage || imageUploading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons
                  name="camera"
                  size={20}
                  color={theme.colors.white}
                />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          {user.stats?.joinedAt && (
            <Text style={styles.joinDate}>
              Member since {formatJoinDate(user.stats.joinedAt)}
            </Text>
          )}
        </View>

        {/* Stats Section */}
        {user.stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {user.stats.totalEntries || 0}
                </Text>
                <Text style={styles.statLabel}>Journal Entries</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {user.stats.streakDays || 0}
                </Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.colors.text.secondary}
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.colors.text.secondary}
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          {user.googleId && (
            <View style={styles.infoItem}>
              <Ionicons
                name="logo-google"
                size={20}
                color={theme.colors.text.secondary}
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Connected Account</Text>
                <Text style={styles.infoValue}>Google</Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleImageUpload}
            disabled={uploadingImage || imageUploading}
          >
            <Ionicons
              name="camera-outline"
              size={20}
              color={theme.colors.primary}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>
              {uploadingImage || imageUploading ? 'Uploading...' : 'Change Profile Photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.signOutButton]}
            onPress={handleSignOut}
            disabled={loading}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={theme.colors.error}
              style={styles.actionIcon}
            />
            <Text style={[styles.actionText, styles.signOutText]}>
              {loading ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background.tertiary,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background.secondary,
  },
  userName: {
    ...theme.typography.heading2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  userEmail: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  joinDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  statsSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.heading3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.heading2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  infoSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    marginTop: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoIcon: {
    marginRight: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  actionsSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    marginBottom: theme.spacing.md,
  },
  signOutButton: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  actionIcon: {
    marginRight: theme.spacing.md,
  },
  actionText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    flex: 1,
  },
  signOutText: {
    color: theme.colors.error,
  },
});

export default ProfileScreen;
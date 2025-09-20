import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';
import ImagePickerTest from '../components/ImagePickerTest';
import ProfileUploadTest from '../components/ProfileUploadTest';

const DebugScreen = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);

  useEffect(() => {
    // Gather debug information
    const info = {
      expoConfig: Constants.expoConfig?.extra || {},
      manifest: Constants.manifest2?.extra || {},
      apiUrl: Constants.expoConfig?.extra?.apiUrl || 'Not configured',
      googleClientId: Constants.expoConfig?.extra?.googleClientId ? 'Configured' : 'Not configured',
      scheme: Constants.expoConfig?.scheme || 'Not configured',
    };
    setDebugInfo(info);
  }, []);

  const testAuth = async () => {
    try {
      clearError();
      const result = await signInWithGoogle();
      
      if (result.success) {
        Alert.alert('Success', 'Authentication successful!');
      } else {
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Unexpected error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Debug Information</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.debugText}>API URL: {debugInfo.apiUrl}</Text>
          <Text style={styles.debugText}>Google Client ID: {debugInfo.googleClientId}</Text>
          <Text style={styles.debugText}>App Scheme: {debugInfo.scheme}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          <Text style={styles.debugText}>Loading: {loading ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Error: {error || 'None'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expo Config</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(debugInfo.expoConfig, null, 2)}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={testAuth}
          disabled={loading}
        >
          <Ionicons name="play-outline" size={20} color={theme.colors.text.inverse} />
          <Text style={styles.testButtonText}>
            {loading ? 'Testing...' : 'Test Authentication'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, { backgroundColor: theme.colors.success }]}
          onPress={() => setShowImagePicker(!showImagePicker)}
        >
          <Ionicons name="camera-outline" size={20} color={theme.colors.text.inverse} />
          <Text style={styles.testButtonText}>
            {showImagePicker ? 'Hide Image Picker Test' : 'Show Image Picker Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, { backgroundColor: theme.colors.warning }]}
          onPress={() => setShowProfileUpload(!showProfileUpload)}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.text.inverse} />
          <Text style={styles.testButtonText}>
            {showProfileUpload ? 'Hide Profile Upload Test' : 'Show Profile Upload Test'}
          </Text>
        </TouchableOpacity>

        {showImagePicker && (
          <View style={styles.section}>
            <ImagePickerTest />
          </View>
        )}

        {showProfileUpload && (
          <View style={styles.section}>
            <ProfileUploadTest />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
              <Text style={styles.clearErrorText}>Clear Error</Text>
            </TouchableOpacity>
          </View>
        )}
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
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.heading1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
  },
  sectionTitle: {
    ...theme.typography.heading3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  debugText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
  testButton: {
    ...theme.components.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  testButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing.sm,
  },
  errorContainer: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    borderWidth: 1,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error[600],
    marginBottom: theme.spacing.sm,
  },
  clearErrorButton: {
    alignSelf: 'flex-start',
  },
  clearErrorText: {
    ...theme.typography.button,
    color: theme.colors.primary[500],
  },
});

export default DebugScreen;
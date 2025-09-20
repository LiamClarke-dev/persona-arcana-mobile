import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import DebugScreen from './DebugScreen';

const AuthScreen = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      clearError(); // Clear any previous errors
      
      console.log('Initiating Google sign-in...');
      
      const result = await signInWithGoogle();
      
      if (!result.success) {
        // Show error to user
        Alert.alert(
          'Sign-in Failed',
          result.error || 'Unable to sign in with Google. Please try again.',
          [{ text: 'OK' }]
        );
      }
      // Success is handled by the AuthContext state change
    } catch (error) {
      console.error('Sign-in error:', error);
      Alert.alert(
        'Sign-in Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Debug button in top right */}
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => setShowDebug(true)}
        >
          <Ionicons name="bug-outline" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>Persona Arcana</Text>
          <Text style={styles.subtitle}>
            Discover your inner archetypes through AI-powered journal analysis
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="book-outline" size={24} color={theme.colors.primary[500]} />
            <Text style={styles.featureText}>Personal journaling with AI insights</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="people-outline" size={24} color={theme.colors.primary[500]} />
            <Text style={styles.featureText}>Discover your personas and patterns</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="analytics-outline" size={24} color={theme.colors.primary[500]} />
            <Text style={styles.featureText}>Track your growth over time</Text>
          </View>
        </View>

        <View style={styles.authSection}>
          <TouchableOpacity 
            style={[
              styles.googleButton,
              (loading || isSigningIn) && styles.googleButtonDisabled
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading || isSigningIn}
          >
            {(loading || isSigningIn) ? (
              <ActivityIndicator 
                size="small" 
                color={theme.colors.text.inverse} 
                style={styles.loadingSpinner}
              />
            ) : (
              <Ionicons name="logo-google" size={20} color={theme.colors.text.inverse} />
            )}
            <Text style={styles.googleButtonText}>
              {(loading || isSigningIn) ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <Text style={styles.disclaimer}>
            Sign in to start your personal journey of self-discovery
          </Text>
        </View>
      </View>

      {/* Debug Modal */}
      <Modal
        visible={showDebug}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Debug Information</Text>
            <TouchableOpacity 
              onPress={() => setShowDebug(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <DebugScreen />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
  },
  title: {
    ...theme.typography.heading1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  featureText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  authSection: {
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
  },
  googleButton: {
    ...theme.components.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  googleButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing.sm,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  loadingSpinner: {
    marginRight: theme.spacing.xs,
  },
  errorContainer: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    borderWidth: 1,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error[600],
    textAlign: 'center',
  },
  disclaimer: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  debugButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.sm,
    zIndex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    ...theme.typography.heading2,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
});

export default AuthScreen;
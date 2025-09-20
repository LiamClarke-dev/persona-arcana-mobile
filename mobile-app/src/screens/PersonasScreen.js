import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

const PersonasScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Personas</Text>
        <Text style={styles.subtitle}>Discover your inner archetypes</Text>
        <Text style={styles.placeholder}>
          Your personas will appear here as patterns emerge from your journaling.
          {'\n\n'}
          Coming in Phase 3:
          {'\n'}• Tarot card gallery with velvet/glass aesthetic
          {'\n'}• Gift and Shadow form interactions
          {'\n'}• Swipe between dual-card views
          {'\n'}• Persona discovery through pattern analysis
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.heading1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  placeholder: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PersonasScreen;
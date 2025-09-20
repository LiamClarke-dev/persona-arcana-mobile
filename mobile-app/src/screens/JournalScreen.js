import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

const JournalScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>Your personal journaling space</Text>
        <Text style={styles.placeholder}>
          This is where you'll write and view your journal entries.
          {'\n\n'}
          Coming in Phase 2:
          {'\n'}• Quick Action button for new entries
          {'\n'}• Voice-to-text journaling
          {'\n'}• Entry list with calendar view
          {'\n'}• AI analysis and insights
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

export default JournalScreen;
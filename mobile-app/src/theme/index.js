// Main theme export for Persona Arcana mobile app
const colors = require('./colors');
const typography = require('./typography');
const spacing = require('./spacing');

const theme = {
  colors: {
    ...colors,
    // Flatten commonly used colors for easier access
    primary: colors.primary[500],
    error: colors.error[500],
    success: colors.success[500],
    warning: colors.warning[500],
    white: colors.white,
    black: colors.black,
    border: colors.border.light,
  },
  typography,
  spacing,
  
  // Common component styles
  components: {
    card: {
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      padding: spacing.md,
      shadowColor: colors.neutral[900],
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    
    button: {
      primary: {
        backgroundColor: colors.primary[500],
        borderRadius: 8,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      },
      secondary: {
        backgroundColor: colors.neutral[100],
        borderRadius: 8,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border.light,
      },
    },
    
    input: {
      backgroundColor: colors.background.primary,
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
      fontSize: typography.fontSize.base,
    },
  },
};

module.exports = { theme, colors, typography, spacing };
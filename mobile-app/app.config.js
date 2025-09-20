module.exports = {
  expo: {
    name: "Persona Arcana",
    slug: "persona-arcana",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    plugins: [
      "expo-web-browser"
    ],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.personaarcana.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.personaarcana.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "personaarcana",
    extra: {
      // Environment configuration
      environment: process.env.ENVIRONMENT || "development",
      
      // API configuration
      apiurl: process.env.API_URL || "http://localhost:3000",
      
      // Authentication
      googleclientid: process.env.GOOGLE_CLIENT_ID,
      
      // Error tracking
      sentrydsn: process.env.SENTRY_DSN,
      
      // Debug settings
      debugmode: process.env.DEBUG_MODE || "true",
      
      // EAS configuration
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      },
      
      // Push notifications
      expopushtoken: process.env.EXPO_PUSH_TOKEN
    }
  }
};
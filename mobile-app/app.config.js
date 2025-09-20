export default {
  expo: {
    name: "Persona Arcana",
    slug: "persona-arcana",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
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
        backgroundColor: "#FFFFFF"
      },
      package: "com.personaarcana.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "personaarcana",
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:3000",
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      sentryDsn: process.env.SENTRY_DSN
    },
    plugins: [
      "@sentry/react-native/expo",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#ffffff"
        }
      ]
    ]
  }
};
import { Platform } from "react-native";

const fallbackApiUrl = "https://reading-app-sigma.vercel.app";

export function getApiBaseUrl() {
  const configuredUrl =
    typeof process !== "undefined" ? process.env.EXPO_PUBLIC_API_URL : undefined;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return fallbackApiUrl;
}

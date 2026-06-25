import type { ImageSourcePropType } from "react-native";

import { getApiBaseUrl } from "@/config/api";

const localCovers: Record<string, ImageSourcePropType> = {
  "/covers/walden.png": require("../../assets/covers/walden.png"),
  "/covers/hulan-river.png": require("../../assets/covers/hulan-river.png"),
  "/covers/fortress-besieged.png": require("../../assets/covers/fortress-besieged.png"),
  "/covers/to-live.png": require("../../assets/covers/to-live.png")
};

export function getCoverSource(coverImage?: string): ImageSourcePropType | null {
  if (!coverImage) {
    return null;
  }

  if (localCovers[coverImage]) {
    return localCovers[coverImage];
  }

  if (coverImage.startsWith("http")) {
    return { uri: coverImage };
  }

  if (coverImage.startsWith("/")) {
    return { uri: `${getApiBaseUrl()}${coverImage}` };
  }

  return { uri: coverImage };
}

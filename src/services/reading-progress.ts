import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ReadingProgressMap } from "@/core/reading-progress";
import { updateProgress } from "@/core/reading-progress";

const storageKey = "reading-progress";

export async function loadReadingProgress(): Promise<ReadingProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveReadingProgress(progress: ReadingProgressMap) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(progress));
}

export async function saveBookProgress(bookId: string, page: number) {
  const progress = await loadReadingProgress();
  await saveReadingProgress(updateProgress(progress, bookId, page));
}

import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { clampPage } from "@/core/reading-progress";
import { loadBooks } from "@/lib/books";
import { loadReadingProgress, saveBookProgress } from "@/services/reading-progress";
import type { Book } from "@/types/book";

export default function ReaderScreen() {
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    Promise.all([loadBooks(), loadReadingProgress()]).then(([items, progress]) => {
      const bookId = Array.isArray(id) ? id[0] : id;
      const requestedPage = Number(Array.isArray(page) ? page[0] : page);
      const savedPage = progress[bookId || ""]?.page;
      const initialPage = Number.isFinite(requestedPage) ? requestedPage : Number(savedPage || 0);
      setBooks(items);
      setPageIndex(initialPage);
      setIsLoading(false);
    });
  }, [id, page]);

  const book = useMemo(() => books.find((item) => item.id === id), [books, id]);
  const total = book?.sections.length || 0;
  const safePageIndex = clampPage(pageIndex, total);
  const section = book?.sections[safePageIndex];
  const percent = total ? Math.round(((safePageIndex + 1) / total) * 100) : 0;
  const isFinished = safePageIndex >= total - 1;

  useEffect(() => {
    if (book && total > 0) {
      saveBookProgress(book.id, safePageIndex);
    }
  }, [book, safePageIndex, total]);

  const changePage = useCallback(
    (direction: "next" | "previous") => {
      setPageIndex((value) => {
        return clampPage(value + (direction === "next" ? 1 : -1), total);
      });
    },
    [total]
  );

  const goPrevious = useCallback(() => {
    changePage("previous");
  }, [changePage]);

  const goNext = useCallback(() => {
    changePage("next");
  }, [changePage]);

  const swipePrevious = useCallback(() => {
    changePage("previous");
  }, [changePage]);

  const swipeNext = useCallback(() => {
    changePage("next");
  }, [changePage]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -28) {
            swipeNext();
          } else if (gesture.dx >= 28) {
            swipePrevious();
          }
        }
      }),
    [swipeNext, swipePrevious]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!book || !section) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>没有找到这本书</Text>
          <Link href="/" asChild>
            <Pressable style={styles.backButton}>
              <Text style={styles.backText}>返回选书</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Link href="/" asChild>
          <Pressable style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color="#1f2f3d" />
          </Pressable>
        </Link>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <View style={styles.iconButton} />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <View style={styles.readerArea} {...panResponder.panHandlers}>
        <Pressable style={styles.tapZoneLeft} onPress={goPrevious} />
        <View style={styles.page}>
          <Text style={styles.pageText}>{section.text}</Text>
        </View>
        <Pressable style={styles.tapZoneRight} onPress={goNext} />
      </View>

      <Text style={[styles.progressLabel, isFinished && styles.progressLabelRaised]}>
        {safePageIndex + 1} / {total}
      </Text>

      {isFinished ? (
        <View style={styles.finishPanel}>
          <Text style={styles.finishState}>已完结</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8fa"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  bookTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2f3d"
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#d6e2ea"
  },
  progressFill: {
    height: 3,
    backgroundColor: "#24445c"
  },
  readerArea: {
    flex: 1
  },
  page: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 92
  },
  progressLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    zIndex: 3,
    textAlign: "center",
    fontSize: 12,
    color: "#60717f"
  },
  progressLabelRaised: {
    bottom: 76
  },
  pageText: {
    fontSize: 24,
    lineHeight: 39,
    color: "#1f2f3d"
  },
  tapZoneLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "50%",
    zIndex: 2
  },
  tapZoneRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "50%",
    zIndex: 2
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2f3d"
  },
  backButton: {
    borderRadius: 8,
    backgroundColor: "#24445c",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  backText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  finishPanel: {
    position: "absolute",
    alignSelf: "center",
    bottom: 24,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center"
  },
  finishState: {
    fontSize: 13,
    fontWeight: "800",
    color: "#60717f"
  }
});

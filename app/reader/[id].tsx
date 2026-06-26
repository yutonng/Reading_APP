import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
  const router = useRouter();
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState<"next" | "previous">("next");
  const turnOpacity = useRef(new Animated.Value(0)).current;
  const turnTranslateX = useRef(new Animated.Value(0)).current;

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

  const playTurnOverlay = useCallback(
    (direction: "next" | "previous") => {
      setTurnDirection(direction);
      turnOpacity.stopAnimation();
      turnTranslateX.stopAnimation();
      turnOpacity.setValue(0);
      turnTranslateX.setValue(direction === "next" ? 72 : -72);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(turnOpacity, {
            toValue: 0.72,
            duration: 80,
            useNativeDriver: true
          }),
          Animated.timing(turnOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true
          })
        ]),
        Animated.timing(turnTranslateX, {
          toValue: direction === "next" ? -32 : 32,
          duration: 260,
          useNativeDriver: true
        })
      ]).start();
    },
    [turnOpacity, turnTranslateX]
  );

  const followTurnOverlay = useCallback(
    (dx: number) => {
      const direction = dx < 0 ? "next" : "previous";
      const distance = Math.min(Math.abs(dx), 180);
      setTurnDirection(direction);
      turnOpacity.stopAnimation();
      turnTranslateX.stopAnimation();
      turnOpacity.setValue(Math.min(distance / 170, 0.72));
      turnTranslateX.setValue(direction === "next" ? 72 - distance * 0.7 : -72 + distance * 0.7);
    },
    [turnOpacity, turnTranslateX]
  );

  const finishTurnOverlay = useCallback(
    (direction: "next" | "previous") => {
      Animated.parallel([
        Animated.timing(turnOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true
        }),
        Animated.timing(turnTranslateX, {
          toValue: direction === "next" ? -32 : 32,
          duration: 140,
          useNativeDriver: true
        })
      ]).start();
    },
    [turnOpacity, turnTranslateX]
  );

  const cancelTurnOverlay = useCallback(
    (direction: "next" | "previous") => {
      Animated.parallel([
        Animated.timing(turnOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true
        }),
        Animated.timing(turnTranslateX, {
          toValue: direction === "next" ? 72 : -72,
          duration: 120,
          useNativeDriver: true
        })
      ]).start();
    },
    [turnOpacity, turnTranslateX]
  );

  const changePage = useCallback(
    (direction: "next" | "previous", animation: "tap" | "drag") => {
      setPageIndex((value) => {
        const nextPage = clampPage(value + (direction === "next" ? 1 : -1), total);
        if (nextPage !== value) {
          if (animation === "tap") {
            playTurnOverlay(direction);
          } else {
            finishTurnOverlay(direction);
          }
        } else if (animation === "drag") {
          cancelTurnOverlay(direction);
        }
        return nextPage;
      });
    },
    [cancelTurnOverlay, finishTurnOverlay, playTurnOverlay, total]
  );

  const goPrevious = useCallback(() => {
    changePage("previous", "tap");
  }, [changePage]);

  const goNext = useCallback(() => {
    changePage("next", "tap");
  }, [changePage]);

  const swipePrevious = useCallback(() => {
    changePage("previous", "drag");
  }, [changePage]);

  const swipeNext = useCallback(() => {
    changePage("next", "drag");
  }, [changePage]);

  const cancelSwipe = useCallback(
    (dx: number) => {
      cancelTurnOverlay(dx < 0 ? "next" : "previous");
    },
    [cancelTurnOverlay]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onPanResponderMove: (_, gesture) => {
          followTurnOverlay(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -48) {
            swipeNext();
          } else if (gesture.dx >= 48) {
            swipePrevious();
          } else {
            cancelSwipe(gesture.dx);
          }
        },
        onPanResponderTerminate: (_, gesture) => {
          cancelSwipe(gesture.dx);
        }
      }),
    [cancelSwipe, followTurnOverlay, swipeNext, swipePrevious]
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
            <Ionicons name="chevron-back" size={24} color="#27312d" />
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
        <Animated.View
          pointerEvents="none"
          style={[
            styles.turnOverlay,
            turnDirection === "next" ? styles.turnOverlayNext : styles.turnOverlayPrevious,
            {
              opacity: turnOpacity,
              transform: [{ translateX: turnTranslateX }]
            }
          ]}
        />
      </View>

      <Text style={[styles.progressLabel, isFinished && styles.progressLabelRaised]}>
        {safePageIndex + 1} / {total}
      </Text>

      {isFinished ? (
        <View style={styles.finishPanel}>
          <Text style={styles.finishState}>已完结</Text>
          <Pressable style={styles.finishButton} onPress={() => router.push("/")}>
            <Text style={styles.finishButtonText}>{`继续阅读《${book.title}》`}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fafaf9"
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
    color: "#0c0a09"
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#e7e5e4"
  },
  progressFill: {
    height: 3,
    backgroundColor: "#a16207"
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
    color: "#7c756d"
  },
  progressLabelRaised: {
    bottom: 92
  },
  pageText: {
    fontSize: 24,
    lineHeight: 39,
    color: "#0c0a09"
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
  turnOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "64%",
    zIndex: 5,
    backgroundColor: "rgba(28, 25, 23, 0.055)"
  },
  turnOverlayNext: {
    right: 0,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(28, 25, 23, 0.08)"
  },
  turnOverlayPrevious: {
    left: 0,
    borderRightWidth: 1,
    borderRightColor: "rgba(28, 25, 23, 0.08)"
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0c0a09"
  },
  backButton: {
    borderRadius: 8,
    backgroundColor: "#1c1917",
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
    left: 20,
    right: 20,
    bottom: 22,
    zIndex: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    backgroundColor: "#1c1917",
    padding: 12,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4
  },
  finishState: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff"
  },
  finishButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a16207",
    paddingHorizontal: 12
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff"
  }
});

import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { findLastReadBook, getBookProgress, type ReadingProgressMap } from "@/core/reading-progress";
import { loadBooksWithStatus } from "@/lib/books";
import { loadReadingProgress } from "@/services/reading-progress";
import type { Book } from "@/types/book";

export default function BookListScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<ReadingProgressMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallbackBooks, setIsUsingFallbackBooks] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [booksResult, nextProgress] = await Promise.all([
      loadBooksWithStatus(),
      loadReadingProgress()
    ]);
    setBooks(booksResult.books);
    setIsUsingFallbackBooks(booksResult.source === "fallback");
    setProgress(nextProgress);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const lastRead = useMemo(() => findLastReadBook(books, progress), [books, progress]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.iconButton} />
        <Text style={styles.title}>书库</Text>
        <Link href="/settings" asChild>
          <Pressable style={styles.iconButton}>
            <Ionicons name="settings-outline" size={22} color="#202724" />
          </Pressable>
        </Link>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {isUsingFallbackBooks ? (
                <View style={styles.offlineNotice}>
                  <Ionicons name="cloud-offline-outline" size={18} color="#7a4f1d" />
                  <Text style={styles.offlineNoticeText}>内容更新失败，当前显示离线内容。</Text>
                </View>
              ) : null}

              {lastRead ? (
                <View style={styles.continuePanel}>
                  <View style={styles.continueCopy}>
                    <Text style={styles.eyebrow}>上次阅读</Text>
                    <Text style={styles.continueTitle}>{lastRead.book.title}</Text>
                    <Text style={styles.continueMeta}>
                      {lastRead.book.author} · {lastRead.progress.page + 1} /{" "}
                      {lastRead.book.sections.length}
                    </Text>
                  </View>
                  <Link
                    href={{
                      pathname: "/reader/[id]",
                      params: { id: lastRead.book.id, page: String(lastRead.progress.page) }
                    }}
                    asChild
                  >
                    <Pressable style={styles.continueButton}>
                      <Text style={styles.continueButtonText}>继续</Text>
                    </Pressable>
                  </Link>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={<Text style={styles.empty}>还没有书。</Text>}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookRow
              book={item}
              progress={getBookProgress(item, progress)}
              onPress={() =>
                router.push({
                  pathname: "/reader/[id]",
                  params: { id: item.id, page: String(getBookProgress(item, progress).page) }
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function BookRow({
  book,
  progress,
  onPress
}: {
  book: Book;
  progress: ReturnType<typeof getBookProgress>;
  onPress: () => void;
}) {
  const progressPercent = progress.isStarted
    ? Math.round(((progress.page + 1) / book.sections.length) * 100)
    : 0;

  return (
    <Pressable style={styles.bookRow} onPress={onPress}>
      <View style={styles.bookText}>
        <View style={styles.bookHeader}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.bookMeta} numberOfLines={1}>
            {book.author} · {book.sections.length} 页
          </Text>
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {book.summary}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      <View style={styles.bookProgressTrack}>
        <View style={[styles.bookProgressFill, { width: `${progressPercent}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f2ed"
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8dfd3",
    backgroundColor: "#fbfaf7"
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202724"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  list: {
    padding: 18,
    gap: 10
  },
  offlineNotice: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead5af",
    backgroundColor: "#fff7e8",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#7a4f1d"
  },
  continuePanel: {
    minHeight: 126,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 8,
    backgroundColor: "#24312f",
    padding: 18,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3
  },
  continueCopy: {
    flex: 1,
    gap: 6
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c9d8cf"
  },
  continueTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fffaf0"
  },
  continueMeta: {
    fontSize: 14,
    color: "#e8eadf"
  },
  continueButton: {
    minWidth: 72,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff7df"
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#24312f"
  },
  bookRow: {
    position: "relative",
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ebe1d6",
    backgroundColor: "#fffdf9",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#6b5f51",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
    overflow: "hidden"
  },
  bookProgressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(83, 99, 91, 0.14)"
  },
  bookProgressFill: {
    height: "100%",
    backgroundColor: "#53635b"
  },
  bookText: {
    flex: 1,
    gap: 5
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10
  },
  bookTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#202724"
  },
  bookMeta: {
    maxWidth: "46%",
    flexShrink: 0,
    fontSize: 13,
    color: "#68736c"
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#454f49"
  },
  empty: {
    paddingVertical: 48,
    textAlign: "center",
    fontSize: 15,
    color: "#7a746b"
  }
});

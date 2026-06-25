import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCoverSource } from "@/config/covers";
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
  const featuredBook = lastRead?.book || books[0];
  const featuredProgress = featuredBook ? getBookProgress(featuredBook, progress) : null;
  const featuredPercent =
    featuredBook && featuredProgress ? Math.round(((featuredProgress.page + 1) / featuredBook.sections.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View />
        <Link href="/settings" asChild>
          <Pressable style={styles.iconButton}>
            <Ionicons name="settings-outline" size={22} color="#efe2c7" />
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
              <View style={styles.heroIntro}>
                <Text style={styles.title}>书库</Text>
                <Text style={styles.subtitle}>夜色静好，书页生香。</Text>
              </View>

              {isUsingFallbackBooks ? (
                <View style={styles.offlineNotice}>
                  <Ionicons name="cloud-offline-outline" size={18} color="#e6c891" />
                  <Text style={styles.offlineNoticeText}>内容更新失败，当前显示离线内容。</Text>
                </View>
              ) : null}

              {featuredBook && featuredProgress ? (
                <Link
                  href={{
                    pathname: "/reader/[id]",
                    params: { id: featuredBook.id, page: String(featuredProgress.page) }
                  }}
                  asChild
                >
                  <Pressable style={styles.continuePanel}>
                    <BookCover book={featuredBook} size="featured" />
                    <View style={styles.continueCopy}>
                      <View style={styles.eyebrowRow}>
                        <Text style={styles.eyebrow}>继续阅读</Text>
                      </View>
                      <Text style={styles.continueTitle}>{featuredBook.title}</Text>
                      <Text style={styles.continueMeta}>
                        {featuredBook.author}
                      </Text>
                      <Text style={styles.continueMeta}>
                        已读 {featuredPercent}% · 第 {featuredProgress.page + 1} / {featuredBook.sections.length} 页
                      </Text>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${featuredPercent}%` }]} />
                      </View>
                      <Text style={styles.heroQuote} numberOfLines={2}>
                        {featuredBook.summary.replace(/[“”]/g, "")}
                      </Text>
                    </View>
                  </Pressable>
                </Link>
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
  const progressPercent = Math.round(((progress.page + 1) / book.sections.length) * 100);

  return (
    <Pressable style={styles.bookRow} onPress={onPress}>
      <BookCover book={book} size="small" />
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
        <Text style={styles.rowProgressLabel}>
          已读 {progressPercent}% · 第 {progress.page + 1} / {book.sections.length} 页
        </Text>
        <View style={styles.rowProgressTrack}>
          <View style={[styles.rowProgressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#d8bd7a" />
    </Pressable>
  );
}

function BookCover({ book, size }: { book: Book; size: "small" | "featured" }) {
  const source = getCoverSource(book.coverImage);
  const coverStyle = size === "featured" ? styles.coverFeatured : styles.coverSmall;

  return (
    <View style={[styles.coverFrame, coverStyle]}>
      {source ? (
        <Image source={source} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <Text style={styles.coverFallback} numberOfLines={2}>
          {book.title.replace(/[《》]/g, "")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#101713"
  },
  header: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    backgroundColor: "#101713"
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#f3ddbd"
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 26,
    color: "#95a88f"
  },
  heroIntro: {
    paddingBottom: 22
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 28,
    gap: 0
  },
  offlineNotice: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(204, 151, 73, 0.35)",
    backgroundColor: "rgba(99, 62, 25, 0.32)",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#e6c891"
  },
  continuePanel: {
    minHeight: 248,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(214, 187, 132, 0.2)",
    backgroundColor: "#17281f",
    padding: 16,
    marginBottom: 24
  },
  continueCopy: {
    flex: 1,
    minHeight: 196,
    gap: 8
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  eyebrow: {
    fontSize: 15,
    fontWeight: "700",
    color: "#c7a96c"
  },
  continueTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff6df"
  },
  continueMeta: {
    fontSize: 15,
    color: "#b9c0ad"
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(245, 234, 214, 0.16)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#d8bd7a"
  },
  heroQuote: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 23,
    color: "#93a08d"
  },
  sectionHeader: {
    marginTop: 28,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(214, 187, 132, 0.16)"
  },
  tabs: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 30
  },
  tabActive: {
    height: 52,
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#d8bd7a"
  },
  tabActiveText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#d8bd7a"
  },
  tabText: {
    fontSize: 17,
    color: "#8f998b"
  },
  sectionTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  sectionMeta: {
    fontSize: 15,
    color: "#8f998b"
  },
  bookRow: {
    minHeight: 150,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(214, 187, 132, 0.12)",
    paddingVertical: 24
  },
  coverFrame: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216, 189, 122, 0.32)",
    backgroundColor: "#202a24"
  },
  coverFeatured: {
    width: 106,
    height: 158
  },
  coverSmall: {
    width: 78,
    height: 116
  },
  coverImage: {
    width: "100%",
    height: "100%"
  },
  coverFallback: {
    flex: 1,
    padding: 8,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#e8d6ad"
  },
  bookText: {
    flex: 1,
    gap: 7
  },
  bookHeader: {
    gap: 5
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f5ead6"
  },
  bookMeta: {
    fontSize: 15,
    color: "#95a88f"
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: "#c4c9ba"
  },
  rowProgressLabel: {
    marginTop: 4,
    fontSize: 14,
    color: "#8f998b"
  },
  rowProgressTrack: {
    width: "86%",
    height: 3,
    marginTop: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(245, 234, 214, 0.14)"
  },
  rowProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#d8bd7a"
  },
  empty: {
    paddingVertical: 48,
    textAlign: "center",
    fontSize: 15,
    color: "#9aa394"
  }
});

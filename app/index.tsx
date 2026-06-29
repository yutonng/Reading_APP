import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { findLastReadBook, getBookProgress, type ReadingProgressMap } from "@/core/reading-progress";
import { loadBooksWithStatus, type BooksLoadResult } from "@/lib/books";
import { loadReadingProgress } from "@/services/reading-progress";
import type { Book } from "@/types/book";

export default function BookListScreen() {
  const router = useRouter();
  const hasLoadedOnceRef = useRef(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<ReadingProgressMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [booksSource, setBooksSource] = useState<BooksLoadResult["source"]>("remote");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }

    const [booksResult, nextProgress] = await Promise.all([
      loadBooksWithStatus(),
      loadReadingProgress()
    ]);
    setBooks(booksResult.books);
    setBooksSource(booksResult.source);
    setProgress(nextProgress);
    hasLoadedOnceRef.current = true;
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const lastRead = useMemo(() => findLastReadBook(books, progress), [books, progress]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredBooks = useMemo(() => {
    if (!normalizedSearchQuery) {
      return books;
    }

    return books.filter((book) =>
      [book.title, book.author, book.summary].some((value) =>
        value.toLowerCase().includes(normalizedSearchQuery)
      )
    );
  }, [books, normalizedSearchQuery]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.title}>书库</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel={isSearchOpen ? "关闭搜索" : "搜索书籍"}
            style={styles.iconButton}
            onPress={() => {
              setIsSearchOpen((value) => !value);
              if (isSearchOpen) {
                setSearchQuery("");
              }
            }}
          >
            <Ionicons name={isSearchOpen ? "close" : "search-outline"} size={22} color="#1f2f3d" />
          </Pressable>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <Ionicons name="settings-outline" size={22} color="#1f2f3d" />
            </Pressable>
          </Link>
        </View>
      </View>
      {isSearchOpen ? (
        <View style={styles.searchPanel}>
          <Ionicons name="search-outline" size={18} color="#60717f" />
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索书名、作者或灵魂句"
            placeholderTextColor="#8a99a5"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <Pressable accessibilityLabel="清空搜索" style={styles.searchClear} onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#8a99a5" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {booksSource !== "remote" ? (
                <View style={styles.offlineNotice}>
                  <Ionicons name="cloud-offline-outline" size={18} color="#60717f" />
                  <Text style={styles.offlineNoticeText}>
                    {booksSource === "cache"
                      ? "内容更新暂时失败，当前显示上次同步内容。"
                      : "内容更新失败，当前显示离线内容。"}
                  </Text>
                </View>
              ) : null}

              {lastRead && !normalizedSearchQuery ? (
                <View style={styles.continuePanel}>
                  <View style={styles.continueCopy}>
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
                      <Text style={styles.continueButtonText}>继续阅读</Text>
                    </Pressable>
                  </Link>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{normalizedSearchQuery ? "没有找到匹配的书。" : "还没有书。"}</Text>
          }
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
        </View>
        <Text style={styles.bookMeta} numberOfLines={1}>
          {book.author}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {book.summary}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#60717f" />
      <Text style={styles.pageCount}>{book.sections.length} 页</Text>
      <View style={styles.bookProgressTrack}>
        <View style={[styles.bookProgressFill, { width: `${progressPercent}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8fa"
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#d6e2ea",
    backgroundColor: "#ffffff"
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  headerSide: {
    width: 80
  },
  headerActions: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2f3d"
  },
  searchPanel: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#d6e2ea",
    backgroundColor: "#ffffff"
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 8,
    fontSize: 15,
    color: "#1f2f3d"
  },
  searchClear: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
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
    borderColor: "#d6e2ea",
    backgroundColor: "#edf4f8",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#60717f"
  },
  continuePanel: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d6e2ea",
    backgroundColor: "#edf4f8",
    padding: 18,
    shadowColor: "#24445c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3
  },
  continueCopy: {
    flex: 1,
    gap: 6
  },
  continueTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2f3d"
  },
  continueMeta: {
    fontSize: 14,
    color: "#60717f"
  },
  continueButton: {
    minWidth: 92,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24445c"
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff"
  },
  bookRow: {
    position: "relative",
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d6e2ea",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#24445c",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 1,
    overflow: "hidden"
  },
  bookProgressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(36, 68, 92, 0.08)"
  },
  bookProgressFill: {
    height: "100%",
    backgroundColor: "#24445c"
  },
  bookText: {
    flex: 1,
    gap: 5,
    paddingRight: 48
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
    color: "#1f2f3d"
  },
  bookMeta: {
    fontSize: 13,
    color: "#60717f"
  },
  pageCount: {
    position: "absolute",
    right: 38,
    bottom: 12,
    fontSize: 12,
    color: "#60717f"
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#384a5a"
  },
  empty: {
    paddingVertical: 48,
    textAlign: "center",
    fontSize: 15,
    color: "#60717f"
  }
});

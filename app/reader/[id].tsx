import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { loadBooks } from "@/lib/books";
import type { Book } from "@/types/book";

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    loadBooks().then((items) => {
      setBooks(items);
      setIsLoading(false);
    });
  }, []);

  const book = useMemo(() => books.find((item) => item.id === id), [books, id]);
  const total = book?.sections.length || 0;
  const section = book?.sections[pageIndex];

  function goPrevious() {
    setPageIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    setPageIndex((value) => Math.min(total - 1, value + 1));
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!book || !section) {
    return (
      <SafeAreaView style={styles.screen}>
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
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Link href="/" asChild>
          <Pressable style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
        </Link>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={styles.progress}>
          {pageIndex + 1} / {total}
        </Text>
      </View>

      <View style={styles.readerArea}>
        <Pressable style={styles.tapZoneLeft} onPress={goPrevious} />
        <View style={styles.page}>
          <Text style={styles.pageText}>{section.text}</Text>
        </View>
        <Pressable style={styles.tapZoneRight} onPress={goNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fbfaf7"
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
    fontSize: 16,
    fontWeight: "700",
    color: "#111827"
  },
  progress: {
    width: 72,
    textAlign: "right",
    fontSize: 14,
    color: "#4b5563"
  },
  readerArea: {
    flex: 1
  },
  page: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 52
  },
  pageText: {
    fontSize: 24,
    lineHeight: 39,
    color: "#111827"
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
    color: "#111827"
  },
  backButton: {
    borderRadius: 8,
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  backText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  }
});

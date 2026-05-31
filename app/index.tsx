import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { loadBooks } from "@/lib/books";
import type { Book } from "@/types/book";

export default function BookListScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setBooks(await loadBooks());
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>首页</Text>
        <View style={styles.iconButton} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <BookRow book={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function BookRow({ book, onPress }: { book: Book; onPress?: () => void }) {
  return (
    <Link href={{ pathname: "/reader/[id]", params: { id: book.id } }} asChild>
      <Pressable style={styles.bookRow} onPress={onPress}>
        <View style={styles.bookText}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
          <Text style={styles.summary}>{book.summary}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
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
    color: "#111827"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  list: {
    padding: 16,
    gap: 12
  },
  bookRow: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    padding: 16
  },
  bookText: {
    flex: 1,
    gap: 6
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },
  author: {
    fontSize: 14,
    color: "#4b5563"
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151"
  }
});

import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { countBookPages } from "@/core/book-content";
import { saveBook } from "@/lib/books";

export default function AdminScreen() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const pageCount = useMemo(() => countBookPages(content), [content]);

  async function handleSave() {
    setIsSaving(true);
    setMessage("");
    try {
      await saveBook({ title, author, summary, content });
      setTitle("");
      setAuthor("");
      setSummary("");
      setContent("");
      setMessage("已保存。回到选书页刷新后可以阅读。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <Pressable style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color="#202724" />
          </Pressable>
        </Link>
        <Text style={styles.title}>后台上传</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Field label="书名" value={title} onChangeText={setTitle} placeholder="输入书名" />
        <Field label="作者" value={author} onChangeText={setAuthor} placeholder="输入作者" />
        <Field
          label="一句话简介"
          value={summary}
          onChangeText={setSummary}
          placeholder="用一句话说明这本书"
        />

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>内容</Text>
            <Text style={styles.hint}>{pageCount} 页</Text>
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={"第一页内容\n\n第二页内容\n\n第三页内容"}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.contentInput]}
          />
        </View>

        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons name="save-outline" size={20} color="#ffffff" />
          <Text style={styles.saveText}>{isSaving ? "保存中" : "保存"}</Text>
        </Pressable>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        style={styles.input}
      />
    </View>
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
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8dfd3",
    backgroundColor: "#fbfaf7"
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202724"
  },
  form: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 16,
    gap: 16
  },
  field: {
    gap: 8
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#202724"
  },
  hint: {
    fontSize: 13,
    color: "#7a746b"
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded2c4",
    backgroundColor: "#fffdf9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#202724"
  },
  contentInput: {
    minHeight: 320,
    lineHeight: 24
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#24312f"
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  message: {
    fontSize: 14,
    color: "#166534"
  }
});

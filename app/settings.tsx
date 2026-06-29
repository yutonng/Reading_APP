import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appInfo } from "@/config/app-info";
import { createBookSuggestion } from "@/lib/books";

const suggestionLimit = 100;

export default function SettingsScreen() {
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedSuggestion = suggestion.trim();

  async function submitSuggestion() {
    if (!trimmedSuggestion || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await createBookSuggestion(trimmedSuggestion);
      setSuggestion("");
      setMessage("已提交，谢谢你的推荐。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <Pressable style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color="#1f2f3d" />
          </Pressable>
        </Link>
        <Text style={styles.title}>关于</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.suggestionPanel}>
          <Text style={styles.sectionTitle}>想读的书</Text>
          <TextInput
            multiline
            maxLength={suggestionLimit}
            value={suggestion}
            onChangeText={(value) => {
              setSuggestion(value);
              if (message) {
                setMessage("");
              }
            }}
            placeholder="告诉我你想读哪本书"
            placeholderTextColor="#8a99a5"
            style={styles.suggestionInput}
            textAlignVertical="top"
          />
          <View style={styles.suggestionFooter}>
            <Text style={styles.counter}>
              {suggestion.length} / {suggestionLimit}
            </Text>
            <Pressable
              style={[
                styles.submitButton,
                (!trimmedSuggestion || isSubmitting) && styles.submitButtonDisabled
              ]}
              disabled={!trimmedSuggestion || isSubmitting}
              onPress={submitSuggestion}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? "提交中" : "提交"}</Text>
            </Pressable>
          </View>
          {message ? <Text style={styles.suggestionMessage}>{message}</Text> : null}
        </View>

        <View style={styles.list}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>版本</Text>
              <Text style={styles.rowMeta}>{appInfo.version}</Text>
            </View>
          </View>

          <Pressable
            style={styles.row}
            onPress={() => {
              Linking.openURL(appInfo.privacyPolicyUrl);
            }}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>隐私政策</Text>
              <Text style={styles.rowMeta}>查看轻轻读如何处理数据</Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#60717f" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2f3d"
  },
  content: {
    padding: 18,
    gap: 14
  },
  suggestionPanel: {
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d6e2ea",
    backgroundColor: "#edf4f8",
    padding: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2f3d"
  },
  suggestionInput: {
    minHeight: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d6e2ea",
    backgroundColor: "#f8fcff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#1f2f3d"
  },
  suggestionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  counter: {
    fontSize: 12,
    color: "#60717f"
  },
  submitButton: {
    minWidth: 76,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#24445c",
    paddingHorizontal: 14
  },
  submitButtonDisabled: {
    opacity: 0.45
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff"
  },
  suggestionMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: "#60717f"
  },
  list: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d6e2ea",
    backgroundColor: "#ffffff",
    overflow: "hidden"
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e4edf3"
  },
  rowText: {
    flex: 1,
    gap: 4
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2f3d"
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#60717f"
  }
});

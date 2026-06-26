import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appInfo } from "@/config/app-info";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <Pressable style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color="#1c1917" />
          </Pressable>
        </Link>
        <Text style={styles.title}>关于</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.panel}>
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.englishName}>{appInfo.englishName}</Text>
          <Text style={styles.appDescription}>用 3-5 分钟读完一本书。</Text>
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
              <Text style={styles.rowMeta}>{appInfo.privacyPolicyUrl}</Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#5f5a54" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f6f2"
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#d8d2c8",
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
    color: "#0c0a09"
  },
  content: {
    padding: 18,
    gap: 14
  },
  panel: {
    borderRadius: 8,
    backgroundColor: "#1c1917",
    padding: 18
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fffaf0"
  },
  englishName: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#d6ad60"
  },
  appDescription: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#d6d3d1"
  },
  list: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d8d2c8",
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
    borderBottomColor: "#ebe7df"
  },
  rowText: {
    flex: 1,
    gap: 4
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0c0a09"
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#5f5a54"
  }
});

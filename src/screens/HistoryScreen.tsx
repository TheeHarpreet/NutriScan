import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { getHistory, clearHistory } from "../services/history";

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);

  // load the most recent scans from SQLite so users can revisit previous products
  useEffect(() => {
    const rows = getHistory(100);
    setItems(rows);
  }, []);

  // Manual refresh (simple approach for now). Later we can auto-refresh when screen focuses.
  const refresh = () => {
    const rows = getHistory(100);
    setItems(rows);
  };

  // clear history locally (does not affect the OpenFoodFacts/OpenBeautyFacts datasets)
  const onClear = () => {
    clearHistory();
    setItems([]);
  };

  const renderItem = ({ item }: any) => {
    return (
      <Pressable
        style={styles.card}
        // tapping a history item re-opens ProductScreen using the stored barcode
        onPress={() => navigation.navigate("Product", { ean: item.ean })}
      >
        {/* image */}
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={{ color: "#666" }}>No image</Text>
          </View>
        )}

        {/* text */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.product_name || "Unnamed product"}
          </Text>
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand || "Unknown brand"}
          </Text>
          <Text style={styles.date}>
            {new Date(item.scanned_at).toLocaleString()}
          </Text>
        </View>

        {/* Score */}
        <Text style={styles.score}>
          {typeof item.score === "number" ? `${item.score}/100` : "—"}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={refresh}>
            <Text style={styles.action}>Refresh</Text>
          </Pressable>

          <Pressable onPress={onClear}>
            <Text style={[styles.action, { color: "#b91c1c" }]}>Clear</Text>
          </Pressable>
        </View>
      </View>

      {/* empty state */}
      {items.length === 0 ? (
        <Text style={styles.empty}>No scans yet. Scan a product first.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#e2e8f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  empty: {
    marginTop: 16,
    color: "#475569",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  thumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  brand: {
    marginTop: 2,
    color: "#475569",
    fontSize: 13,
  },
  date: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
  score: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
});

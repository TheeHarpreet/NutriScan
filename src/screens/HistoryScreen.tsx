import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  getHistory,
  clearHistory,
  deleteHistoryItem,
} from "../services/history";

// basic types for filtering/sorting
type Filter = "all" | "food" | "beauty";
type Sort = "newest" | "oldest" | "scoreHigh" | "scoreLow";

export default function HistoryScreen() {
  const navigation = useNavigation<any>();

  // Raw rows from SQLite
  const [items, setItems] = useState<any[]>([]);

  // UI controls
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const isFocused = useIsFocused();

  // Reload history whenever this tab becomes active
  useEffect(() => {
    if (!isFocused) return;

    const rows = getHistory(200);
    setItems(rows);
  }, [isFocused]);

  // clear history locally (does not affect the OpenFoodFacts/OpenBeautyFacts datasets)
  const onClear = () => {
    Alert.alert(
      "Clear history?",
      "This will remove all saved scans from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearHistory();
            setItems([]);
          },
        },
      ],
    );
  };

  // build the list shown on screen by applying search + category filter + sorting to the  sqlite rows
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = items;

    // filter by category
    if (filter !== "all") {
      list = list.filter((x) => x.source === filter);
    }

    // search by name / brand / barcode
    if (q.length > 0) {
      list = list.filter((x) => {
        const name = (x.product_name || "").toLowerCase();
        const brand = (x.brand || "").toLowerCase();
        const ean = (x.ean || "").toLowerCase();
        return name.includes(q) || brand.includes(q) || ean.includes(q);
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sort === "newest") {
        return (
          new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
        );
      }
      if (sort === "oldest") {
        return (
          new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime()
        );
      }
      if (sort === "scoreHigh") {
        return (b.score ?? -1) - (a.score ?? -1);
      }
      if (sort === "scoreLow") {
        return (a.score ?? 999) - (b.score ?? 999);
      }
      return 0;
    });

    return list;
  }, [items, query, filter, sort]);

  const renderItem = ({ item }: any) => {
    return (
      <Pressable
        style={styles.card}
        // tapping a history item re-opens ProductScreen using the stored barcode
        onPress={() =>
          navigation.navigate("Product", {
            ean: item.ean,
            saveToHistory: false,
          })
        }
        onLongPress={() => {
          Alert.alert("Delete item?", "Remove this scan from your history?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                deleteHistoryItem(item.id);

                // update UI
                setItems((prev) => prev.filter((x) => x.id !== item.id));
              },
            },
          ]);
        }}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={{ color: "#666", fontSize: 12 }}>No image</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.product_name || "Unnamed product"}
          </Text>

          <Text style={styles.brand} numberOfLines={1}>
            {item.brand || "Unknown brand"} • {item.source || "unknown"}
          </Text>

          <Text style={styles.date}>
            {new Date(item.scanned_at).toLocaleString()}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.score}>
            {typeof item.score === "number" ? `${item.score}/100` : "—"}
          </Text>
        </View>
      </Pressable>
    );
  };

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Pressable onPress={onClear}>
          <Text style={styles.clear}>Clear</Text>
        </Pressable>
      </View>

      {/* search */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, brand or barcode..."
        style={styles.search}
        autoCapitalize="none"
      />

      {/* filter chips */}
      <View style={styles.row}>
        <Chip
          label="All"
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <Chip
          label="Food"
          active={filter === "food"}
          onPress={() => setFilter("food")}
        />
        <Chip
          label="Beauty"
          active={filter === "beauty"}
          onPress={() => setFilter("beauty")}
        />
      </View>

      {/* sort chips */}
      <View style={styles.row}>
        <Chip
          label="Newest"
          active={sort === "newest"}
          onPress={() => setSort("newest")}
        />
        <Chip
          label="Oldest"
          active={sort === "oldest"}
          onPress={() => setSort("oldest")}
        />
        <Chip
          label="Score ↑"
          active={sort === "scoreHigh"}
          onPress={() => setSort("scoreHigh")}
        />
        <Chip
          label="Score ↓"
          active={sort === "scoreLow"}
          onPress={() => setSort("scoreLow")}
        />
      </View>

      {/* list */}
      {visibleItems.length === 0 ? (
        <Text style={styles.empty}>
          No scans match your search/filter. Try clearing the search.
        </Text>
      ) : (
        <FlatList
          data={visibleItems}
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
  clear: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },
  search: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cbd5e1",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipInactive: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  chipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  chipTextActive: {
    color: "#fff",
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
    fontWeight: "800",
  },
  brand: {
    marginTop: 2,
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  date: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  score: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
});

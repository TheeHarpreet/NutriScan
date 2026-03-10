import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { getFavourites, removeFavourite } from "../services/favourites";

export default function FavouritesScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const isFocused = useIsFocused();

  // reload favourites whenever this tab becomes active
  useEffect(() => {
    if (!isFocused) return;
    const rows = getFavourites(200);
    setItems(rows);
  }, [isFocused]);

  const renderItem = ({ item }: any) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("Product", { ean: item.ean, saveToHistory: false })
      }
      onLongPress={() => {
        removeFavourite(item.ean);
        setItems((prev) => prev.filter((x) => x.ean !== item.ean));
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
      </View>

      <Text style={styles.score}>
        {typeof item.score === "number" ? `${item.score}/100` : "—"}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favourites</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>
          No favourites yet. Tap ☆ on a product to save it here.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <Text style={styles.hint}>Tip: long-press an item to remove it.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#e2e8f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  empty: {
    marginTop: 12,
    color: "#475569",
  },
  hint: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 12,
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
  score: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
});

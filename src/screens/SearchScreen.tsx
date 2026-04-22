import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { searchFoodByText } from "../services/openfoodfactsSearch";

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const items = await searchFoodByText(trimmed, 25);
      setResults(items);
    } catch (error) {
      console.log("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("Product", {
          ean: item.code,
          saveToHistory: false,
        })
      }
    >
      {item.image_front_url ? (
        <Image source={{ uri: item.image_front_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.product_name || "Unnamed product"}
        </Text>
        <Text style={styles.brand} numberOfLines={1}>
          {item.brands || "Unknown brand"}
        </Text>
        <Text style={styles.code}>Barcode: {item.code || "N/A"}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search for a product..."
        style={styles.input}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />

      <Pressable style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.info}>Searching products...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <Text style={styles.info}>No products found.</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => String(item.code || index)}
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
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cbd5e1",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#0f172a",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  info: {
    marginTop: 12,
    color: "#475569",
  },
  center: {
    marginTop: 24,
    alignItems: "center",
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
  placeholderText: {
    color: "#666",
    fontSize: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  brand: {
    marginTop: 2,
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  code: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
});

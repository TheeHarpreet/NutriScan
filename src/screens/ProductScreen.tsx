import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { fetchFoodByEAN } from "../services/openfoodfacts";
import { fetchBeautyByEAN } from "../services/openbeautyfacts";
import { normaliseEAN } from "../logic/normaliseBarcode";
import { calculateHealthScore } from "../logic/rating";
import { ScoreBadge } from "../components/ScoreBadge";
import { NutrientList } from "../components/NutrientList";
import { addToHistory } from "../services/history";

type Props = {
  route: { params: { ean: string } };
};

// helper to get kcal value from different type of fields
function getEnergyKcal(nutriments: any): number | null {
  // the older naming
  if (nutriments["energy-kcal_100g"] != null) {
    return nutriments["energy-kcal_100g"];
  }

  // the newer naming
  if (nutriments.energy_kcal_100g != null) {
    return nutriments.energy_kcal_100g;
  }

  // if kJ is provided, convert to kcal
  if (nutriments.energy_100g != null) {
    return Math.round(nutriments.energy_100g / 4.184);
  }

  // otherwise no usable energy value
  return null;
}

export default function ProductScreen({ route }: Props) {
  // read the barcode value passed from ScanScreen
  const { ean } = route.params;
  const rawEAN = route.params.ean;

  // local state to track loading status, product data and which API it came from
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [source, setSource] = useState<"food" | "beauty" | null>(null);

  // useEffect runs when the component mounts or when `ean` changes
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      // 1) normalise the EAN
      const cleanEAN = normaliseEAN(ean);
      if (!cleanEAN) {
        setProduct(null);
        setSource(null);
        setLoading(false);
        return;
      }

      // 2) try OFF first
      let result = await fetchFoodByEAN(cleanEAN);
      if (result) {
        setProduct(result);
        setSource("food");
      } else {
        // 3) if not food, try OBF
        result = await fetchBeautyByEAN(cleanEAN);
        if (result) {
          setProduct(result);
          setSource("beauty");
        } else {
          // 4) nothing found
          setProduct(null);
          setSource(null);
        }
      }
      setLoading(false);
    };

    loadProduct();
  }, [ean]);

  // Just for design, show a loading spinner while waiting for the API response
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Looking up product {ean}...</Text>
      </View>
    );
  }

  // If no product was found in either database, show a friendly message
  if (!product) {
    return (
      <View style={styles.center}>
        <Text>No product found for barcode {ean}</Text>
        <Text style={styles.center}>
          Not available in OpenFoodFacts or OpenBeautyFacts
        </Text>
      </View>
    );
  }

  // Shorter alias to make nutrition values easier to use
  const nutrients = product.nutriments || {};
  const energyKcal = getEnergyKcal(nutrients);

  const additivesCount =
    typeof product.additives_n === "number"
      ? product.additives_n
      : Array.isArray(product.additives_tags)
        ? product.additives_tags.length
        : 0;

  const health = calculateHealthScore(nutrients, additivesCount);

  const displayName =
    product.product_name ||
    product.product_name_en ||
    product.generic_name ||
    product.generic_name_en ||
    product.product_name_en_imported ||
    "Unnamed product";

  useEffect(() => {
    if (!product || !source) return;

    addToHistory({
      ean,
      product_name: displayName,
      brand: product.brands ?? null,
      score: health.score ?? null,
      source,
      image_url: product.image_front_url ?? null,
      scanned_at: new Date().toISOString(),
    });
  }, [ean, product, source, displayName, health.score]);

  // UI for displaying product details
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* the top section so image + brand + score */}
      <View style={styles.topRow}>
        {/* product image if available */}
        {product.image_front_url && (
          <Image
            source={{ uri: product.image_front_url }}
            style={styles.productImage}
          />
        )}

        {/* name, brand, source, score */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.brand}>{product.brands || "Unknown brand"}</Text>
          <Text style={styles.source}>
            Source:{" "}
            {source === "food"
              ? "OpenFoodFacts"
              : source === "beauty"
                ? "OpenBeautyFacts"
                : "Unknown"}
          </Text>

          {/* score badge */}
          <ScoreBadge score={health.score} label={health.label} />
        </View>
      </View>

      {/* negatives and positives*/}
      <NutrientList title="Negatives" aspects={health.negatives} />
      <NutrientList title="Positives" aspects={health.positives} />

      {/* ingredients */}
      <Text style={styles.section}>Ingredients</Text>
      <Text>{product.ingredients_text || "Not available"}</Text>

      {/* allergyies */}
      <Text style={styles.section}>Allergens</Text>
      <Text>{product.allergens || "None listed"}</Text>

      {/* additives */}
      <Text style={styles.section}>Additives</Text>
      <Text>{(product.additives_tags || []).join(", ") || "None listed"}</Text>

      {/* table for nutrients */}
      <Text style={styles.section}>Nutrition (per 100g)</Text>
      <Text>
        Energy: {energyKcal != null ? `${energyKcal} kcal` : "— kcal"}
      </Text>
      <Text>Fat: {nutrients.fat_100g ?? "—"} g</Text>
      <Text>Carbs: {nutrients.carbohydrates_100g ?? "—"} g</Text>
      <Text>Sugars: {nutrients.sugars_100g ?? "—"} g</Text>
      <Text>Protein: {nutrients.proteins_100g ?? "—"} g</Text>
      <Text>Salt: {nutrients.salt_100g ?? "—"} g</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sub: {
    marginTop: 4,
    color: "#777",
    textAlign: "center",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#e2e8f0",
  },
  topRow: {
    flexDirection: "row",
    columnGap: 16,
    alignItems: "flex-start",
  },
  productImage: {
    width: 90,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
  },
  brand: {
    fontSize: 16,
    color: "#555",
    marginTop: 4,
  },
  source: {
    marginTop: 4,
    color: "#444",
    fontSize: 12,
  },
  section: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "600",
  },
  headerCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});

import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { fetchFoodByEAN } from "../services/openfoodfacts";
import { fetchBeautyByEAN } from "../services/openbeautyfacts";
import { normaliseEAN } from "../logic/normaliseBarcode";
import { calculateHealthScore } from "../logic/rating";
import { ScoreBadge } from "../components/ScoreBadge";
import { NutrientList } from "../components/NutrientList";
import { addToHistory } from "../services/history";
import {
  addFavourite,
  removeFavourite,
  isFavourite,
} from "../services/favourites";
import { getHistory } from "../services/history";
import { getFavourites } from "../services/favourites";
import { buildUserProfile } from "../logic/userProfile";
import { searchFoodByCategory } from "../services/openfoodfactsSearch";
import { rankRecommendations } from "../logic/recommend";
import { useNavigation } from "@react-navigation/native";

type Props = {
  route: { params: { ean: string; saveToHistory?: boolean } };
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

function normaliseRecommendationCategory(
  category: string | null,
): string | null {
  if (!category) return null;

  const c = category.toLowerCase();

  if (
    c.includes("condiment") ||
    c.includes("sauce") ||
    c.includes("mayonnaise") ||
    c.includes("dressing")
  ) {
    return "condiments";
  }

  if (
    c.includes("dair") ||
    c.includes("cheese") ||
    c.includes("yogurt") ||
    c.includes("yoghurt")
  ) {
    return "dairies";
  }

  if (c.includes("crisp") || c.includes("chip") || c.includes("snack")) {
    return "crisps";
  }

  if (
    c.includes("beverage") ||
    c.includes("soft-drink") ||
    c.includes("soda")
  ) {
    return "soft-drinks";
  }

  return null;
}

function getExtraRecommendationBarcodes(category: string | null): string[] {
  const normalised = normaliseRecommendationCategory(category);

  const map: Record<string, string[]> = {
    condiments: ["8809210343370", "0815074020010", "5000157076403"],
    dairies: ["7622201693954", "4088600046679", "4056489933861"],
    crisps: ["5000328481115", "5060336501530", "5053990156009"],
    "soft-drinks": ["5449000000996", "5449000133335", "5449000104885"],
  };

  if (!normalised) return [];
  return map[normalised] || [];
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ProductScreen({ route }: Props) {
  // read the barcode value passed from ScanScreen
  const { ean, saveToHistory = false } = route.params;
  const rawEAN = route.params.ean;

  // local state to track loading status, product data and which API it came from
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [source, setSource] = useState<"food" | "beauty" | null>(null);
  const [favourite, setFavourite] = useState(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [lastRecommendationEan, setLastRecommendationEan] = useState<
    string | null
  >(null);

  const navigation = useNavigation<any>();

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

  // category pick (first tag is good enough for mvp)
  const categoryTag = Array.isArray(product?.categories_tags)
    ? product.categories_tags
    : [];

  // build personalised recommendations using history + favourites.
  // for now this only runs for food products with a usable category tag.
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!product || source !== "food") {
        setRecommendations([]);
        return;
      }

      // do not fetch again for the same product
      if (lastRecommendationEan === ean) return;

      // mark this product as already attempted
      setLastRecommendationEan(ean);
      setLoadingRecommendations(true);

      try {
        const categoryTag =
          Array.isArray(product?.categories_tags) &&
          product.categories_tags.length > 0
            ? product.categories_tags[0]
            : null;

        const extraBarcodes = shuffleArray(
          getExtraRecommendationBarcodes(categoryTag),
        ).filter((code) => code !== ean);

        const extraCandidates: any[] = [];

        // fetch one by one to avoid rate limiting
        for (const code of extraBarcodes) {
          if (extraCandidates.length >= 3) break;

          try {
            const result = await fetchFoodByEAN(code);
            if (result) {
              extraCandidates.push(result);
            }
          } catch (error) {
            console.log("Recommendation barcode fetch failed:", code);
          }
        }

        const neutralProfile = {
          averageSugar: null,
          averageSalt: null,
          averageProtein: null,
          averageFibre: null,
          averageAdditives: null,
        };

        const rankedExtras = rankRecommendations(
          extraCandidates,
          neutralProfile,
        ).map((item: any) => ({
          ...item,
          reason: "Similar healthier product from the same category",
        }));

        console.log("Current category:", categoryTag);
        console.log(
          "Normalised category:",
          normaliseRecommendationCategory(categoryTag),
        );
        console.log("Extra candidates:", extraCandidates.length);
        console.log(
          "Ranked recommendations:",
          rankedExtras.length,
          rankedExtras,
        );

        setRecommendations(rankedExtras.slice(0, 5));
      } catch (error) {
        console.log("Recommendation error:", error);
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadRecommendations();
  }, [product, source, ean]);

  // Shorter alias to make nutrition values easier to use
  const nutrients = product?.nutriments || {};

  const additivesCount =
    typeof product?.additives_n === "number"
      ? product.additives_n
      : Array.isArray(product?.additives_tags)
        ? product.additives_tags.length
        : 0;

  const health = product
    ? calculateHealthScore(nutrients, additivesCount)
    : null;

  const displayName =
    product?.product_name ||
    product?.product_name_en ||
    product?.generic_name ||
    product?.generic_name_en ||
    product?.product_name_en_imported ||
    "Unnamed product";

  // Store a small nutrition snapshot so recommendations can learn from past scans/favourites
  const sugars = toNumber(nutrients?.sugars_100g);
  const salt = toNumber(nutrients?.salt_100g);
  const satFat = toNumber(nutrients?.["saturated-fat_100g"]);
  const protein = toNumber(nutrients?.proteins_100g);
  const fibre = toNumber(nutrients?.fiber_100g);

  useEffect(() => {
    if (!saveToHistory) return;
    if (!product || !source || !health) return;

    addToHistory({
      ean,
      product_name: displayName,
      brand: product.brands ?? null,
      score: health.score ?? null,
      source,
      image_url: product.image_front_url ?? null,
      scanned_at: new Date().toISOString(),

      sugars_100g: sugars,
      salt_100g: salt,
      saturated_fat_100g: satFat,
      protein_100g: protein,
      fibre_100g: fibre,
      additives_n: additivesCount,
      category_tag: categoryTag[0] ?? null,
    });
  }, [saveToHistory, ean, product, source, displayName, health?.score]);

  useEffect(() => {
    if (!product) return;
    setFavourite(isFavourite(ean));
  }, [product, ean]);

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

  const energyKcal = getEnergyKcal(nutrients);

  // convert OFF values to numbers.
  // OFF sometimes returns strings like "12.5" instead of real numbers.
  function toNumber(value: any): number | null {
    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }

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
          <ScoreBadge score={health!.score} label={health!.label} />
          {/* favourite button (stored locally using SQLite) */}
          <Pressable
            onPress={() => {
              // Toggle favourite state + update SQLite
              if (favourite) {
                removeFavourite(ean);
                setFavourite(false);
              } else {
                addFavourite({
                  ean,
                  product_name: displayName,
                  brand: product.brands ?? null,
                  score: health!.score ?? null,
                  source,
                  image_url: product.image_front_url ?? null,

                  sugars_100g: sugars,
                  salt_100g: salt,
                  saturated_fat_100g: satFat,
                  protein_100g: protein,
                  fibre_100g: fibre,
                  additives_n: additivesCount,
                  category_tag: categoryTag[0] ?? null,
                });
                setFavourite(true);
              }
            }}
            style={[
              styles.favButton,
              favourite ? styles.favButtonActive : styles.favButtonInactive,
            ]}
          >
            <Text
              style={[styles.favText, favourite ? styles.favTextActive : null]}
            >
              {favourite ? "★ Favourited" : "☆ Add to favourites"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* negatives and positives*/}
      <NutrientList title="Negatives" aspects={health!.negatives} />
      <NutrientList title="Positives" aspects={health!.positives} />

      {/* recommended products */}
      <Text style={styles.section}>Recommended for you</Text>

      {loadingRecommendations ? (
        <Text>Loading recommendations...</Text>
      ) : recommendations.length === 0 ? (
        <Text>No recommendations available yet.</Text>
      ) : (
        recommendations.map((item, index) => {
          const p = item.product;

          return (
            <Pressable
              key={`${p?.code || index}`}
              style={styles.recommendCard}
              onPress={() =>
                navigation.push("Product", {
                  ean: p?.code,
                  saveToHistory: false,
                })
              }
            >
              {p?.image_front_url ? (
                <Image
                  source={{ uri: p.image_front_url }}
                  style={styles.recommendImage}
                />
              ) : (
                <View
                  style={[styles.recommendImage, { backgroundColor: "#eee" }]}
                />
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.recommendName} numberOfLines={1}>
                  {p?.product_name || "Unnamed product"}
                </Text>

                <Text style={styles.recommendBrand} numberOfLines={1}>
                  {p?.brands || "Unknown brand"}
                </Text>

                <Text style={styles.recommendReason}>{item.reason}</Text>
              </View>

              <Text style={styles.recommendScore}>{item.finalScore}/100</Text>
            </Pressable>
          );
        })
      )}

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
  favButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
  },
  favButtonInactive: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  favButtonActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  favText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#0f172a",
  },
  favTextActive: {
    color: "#fff",
  },
  recommendCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  recommendImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  recommendName: {
    fontSize: 15,
    fontWeight: "700",
  },
  recommendBrand: {
    marginTop: 2,
    color: "#475569",
    fontSize: 13,
  },
  recommendReason: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
  recommendScore: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
});

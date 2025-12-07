import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import type { HealthAspect } from "../logic/rating";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function getIconForNutrient(name: string) {
  const key = name.toLowerCase();

  if (key.includes("calories") || key.includes("energy")) {
    return "fire";
  }

  if (key.includes("sugar")) {
    return "cube-outline";
  }
  if (key.includes("protein")) {
    return "food-drumstick";
  }
  if (key.includes("saturated")) {
    return "water-percent";
  }
  if (key.includes("fibre") || key.includes("fiber")) {
    return "barley";
  }
  if (key.includes("salt")) {
    return "shaker-outline";
  }
  if (key.includes("fruit") || key.includes("vegatable")) {
    return "fruit-cherries";
  }
  if (key.includes("additives")) {
    return "beaker-outline";
  }

  return "circle-outline";
}

type Things = {
  title: string; // negatives or positives
  aspects: HealthAspect[]; // the list from calculateHealthScore
  showPer100?: boolean; // when to show show 100g
};

export const NutrientList: React.FC<Things> = ({
  title,
  aspects,
  showPer100 = true,
}) => {
  // dont do anything if there is nothing to display
  if (!aspects.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>{title}</Text>
        {showPer100 && <Text style={styles.per100}>per 100g</Text>}
      </View>

      {aspects.map((a) => {
        const iconName = getIconForNutrient(a.name);

        return (
          <View key={a.name} style={styles.row}>
            {/* left side: name+comment */}
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons
                name={iconName as any}
                size={22}
                color="#64748b"
                style={styles.icon}
              />
              <View style={styles.rowText}>
                <Text style={styles.name}>{a.name}</Text>
                <Text style={styles.comment}>{a.comment}</Text>
              </View>
            </View>

            {/* right side: value+coloured dot for level */}
            <View style={styles.rowRight}>
              <Text style={styles.value}>
                {a.value != null ? `${a.value} ${a.unit}` : "—"}
              </Text>
              <View
                style={[
                  styles.levelDot,
                  a.level === "high"
                    ? { backgroundColor: "#e74c3c" } // red
                    : a.level === "medium"
                    ? { backgroundColor: "#f39c12" } // orange
                    : { backgroundColor: "#2ecc71" }, // green
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  per100: {
    fontSize: 14,
    color: "#64748b",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  rowLeft: {
    flexDirection: "row",
    flexShrink: 1,
    paddingRight: 8,
    alignItems: "center",
  },
  icon: {
    width: 32,
    textAlign: "center",
    marginRight: 8,
  },
  rowText: {
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
  },
  comment: {
    fontSize: 13,
    color: "#64748b",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

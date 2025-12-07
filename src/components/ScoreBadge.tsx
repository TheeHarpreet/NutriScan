import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";

// present user with a score and label of rating
export type ScoreBadgeProps = {
  score: number;
  label: string;
};

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, label }) => {
  // colors for labels
  let dotColor = "#989898";
  if (score >= 80) dotColor = "#007e34ff"; // excellent
  else if (score >= 60) dotColor = "#74ffa9fb"; // good
  else if (score < 40) dotColor = "#e67e22"; // poor
  else if (score < 20) dotColor = "#c0392b"; // terrible

  return (
    <View style={styles.container}>
      {/* coloured dot */}
      <View style={[styles.dot, { backgroundColor: dotColor }]} />

      {/* score text */}
      <View>
        <Text style={styles.score}>{score}/100</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  score: {
    fontSize: 18,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
});

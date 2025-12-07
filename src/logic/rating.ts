export type HealthAspect = {
  name: string; // eg. fat
  value: number | null; // numeric per 100g value
  unit: string; // units such as g, kcal
  comment: string; // small comment for user
  level: "low" | "medium" | "high";
};

export type HealthScoreResult = {
  score: number; // actual score from 0-100 where if its higher, its better
  label: "Excellent" | "Good" | "Average" | "Poor" | "Terrible";
  positives: HealthAspect[];
  negatives: HealthAspect[];
};

const num = (v: any): number | null =>
  typeof v === "number" ? v : v != null ? Number(v) : null;

// main function: given off nutriments so calculate a score and lists
export function calculateHealthScore(
  nutriments: any,
  additivesCount?: any
): HealthScoreResult {
  const energyKcal =
    num(nutriments["energy-kcal_100g"]) ??
    num(nutriments["energy_kcal_100g"]) ??
    (nutriments.energy_100g != null
      ? Number(nutriments.energy_100g) / 4.184
      : null);

  const Kcal = num(nutriments["energy-kcal_100g"]);
  const saturates = num(nutriments["saturated-fat_100g"]);
  const salt = num(nutriments["salt_100g"]);
  const sugars = num(nutriments["sugars_100g"]);
  const protein = num(nutriments["proteins_100g"]);
  const fibre = num(nutriments["fiber_100g"]);

  const fruitVegPercent = num(
    nutriments["fruits-vegetables-nuts_100g"] ??
      nutriments["fruits-vegetables-nuts-estimate_100g"] ??
      nutriments["fruits-vegetables-nuts-estimate-from-ingredients_100g"]
  );

  const additives = typeof additivesCount === "number" ? additivesCount : null;

  // Scoring part
  // The intial score starts at 50 and it will subtract bad points and add good points
  let score = 50;

  // Energy: high calories is bad not always
  if (Kcal != null) {
    if (Kcal > 700) score -= 17;
    else if (Kcal > 500) score -= 13;
    else if (Kcal > 300) score -= 8;
    else if (Kcal < 150) score += 5;
  }

  // high saturates is bad
  if (saturates != null) {
    if (saturates > 10) score -= 17;
    else if (saturates > 5) score -= 11;
    else if (saturates < 2) score += 5;
  }

  // high salt is bad
  if (salt != null) {
    if (salt > 1.5) score -= 18;
    else if (salt > 0.9) score -= 14;
    else if (salt < 0.3) score += 8;
  }

  // high sugers is bad
  if (sugars != null) {
    if (sugars > 22.5) score -= 10;
    else if (sugars > 5) score -= 5;
    else if (sugars < 5) score += 5;
  }

  // high protein is good
  if (protein != null) {
    if (protein > 10) score += 9;
    else if (protein > 7) score += 6;
  }

  // high fiber is good
  if (fibre != null) {
    if (fibre > 5) score += 5;
    else if (fibre > 3) score += 3;
  }

  // high fruits is good
  if (fruitVegPercent != null) {
    if (fruitVegPercent > 80) score += 8;
    else if (fruitVegPercent > 40) score += 6;
    else if (fruitVegPercent > 20) score += 3;
  }

  // high additves is bad
  if (additives != null) {
    if (additives == 0) score += 8;
    else if (additives >= 5) score -= 13;
    else if (additives >= 2) score -= 5;
  }

  // calculate score
  score = Math.max(0, Math.min(100, score));

  // Label
  let label: HealthScoreResult["label"] = "Average";
  if (score >= 80) label = "Excellent";
  else if (score >= 60) label = "Good";
  else if (score >= 40) label = "Average";
  else if (score >= 20) label = "Poor";
  else label = "Terrible";

  // Display the things that are negatives (things that are high)
  const negatives: HealthAspect[] = [];

  if (Kcal != null && Kcal > 300) {
    negatives.push({
      name: "Calories",
      value: Math.round(Kcal),
      unit: "kcal",
      comment: Kcal > 700 ? "Very high in calories" : "Quite caloric",
      level: Kcal > 700 ? "high" : "medium",
    });
  }

  if (saturates != null && saturates > 5) {
    negatives.push({
      name: "Saturated Fat",
      value: saturates,
      unit: "g",
      comment: saturates > 10 ? "Too much saturated fat" : "Tiny bit high",
      level: saturates > 10 ? "high" : "medium",
    });
  }

  if (salt != null && salt > 0.9) {
    negatives.push({
      name: "Salt",
      value: salt,
      unit: "g",
      comment: salt > 1.5 ? "Too much soidum" : "Tiny bit salty",
      level: salt > 1.5 ? "high" : "medium",
    });
  }

  if (sugars != null && sugars > 5) {
    negatives.push({
      name: "Sugars",
      value: sugars,
      unit: "g",
      comment: sugars > 22.5 ? "Too sugary" : "Moderate sugar",
      level: sugars > 22.5 ? "high" : "medium",
    });
  }

  if (additives != null && additives >= 2) {
    negatives.push({
      name: "Additives",
      value: additives,
      unit: "",
      comment:
        additives >= 5
          ? "Contains several additives to avoid"
          : "Contains a few additives",
      level: additives >= 5 ? "high" : "medium",
    });
  }

  const positives: HealthAspect[] = [];

  if (Kcal != null && Kcal <= 150) {
    positives.push({
      name: "Calories",
      value: Math.round(Kcal),
      unit: "kcal",
      comment: "Low in calories",
      level: "low",
    });
  }

  if (fruitVegPercent != null && fruitVegPercent > 40) {
    positives.push({
      name: "Vegetables",
      value: Math.round(fruitVegPercent),
      unit: "%",
      comment: fruitVegPercent > 60 ? "Very good quantity" : "Good quantity",
      level: "low",
    });
  }

  if (protein != null && protein > 2) {
    positives.push({
      name: "Protein",
      value: protein,
      unit: "g",
      comment: protein > 10 ? "High Protein" : "Some protein",
      level: "medium",
    });
  }

  if (fibre != null && fibre > 2) {
    positives.push({
      name: "Fibre",
      value: fibre,
      unit: "g",
      comment: "Good quantity of Fibre",
      level: "medium",
    });
  }

  if (additives === 0) {
    positives.push({
      name: "Additives",
      value: 0,
      unit: "",
      comment: "No additives",
      level: "low",
    });
  }
  if (salt != null && salt < 0.6) {
    positives.push({
      name: "Salt",
      value: salt,
      unit: "g",
      comment: "Low amount",
      level: "low",
    });
  }
  if (sugars != null && sugars < 5) {
    positives.push({
      name: "Sugars",
      value: sugars,
      unit: "g",
      comment: "Low sugar",
      level: "low",
    });
  }

  return {
    score,
    label,
    negatives,
    positives,
  };
}

import { calculateHealthScore } from "./rating";

// rank similar products by combining:
// 1 - the normal nutriscan health score
// 2 - a small personalised boost based on the user's history and favourites
export function rankRecommendations(candidates: any[], profile: any) {
  return (
    candidates
      .map((p) => {
        // use the product nutriments safely in case some fields are missing
        const nutr = p?.nutriments || {};
        // additives count may not always exist, so default to 0
        const additives =
          typeof p?.additives_n === "number" ? p.additives_n : 0;
        // start with the existing NutriScan health score
        const health = calculateHealthScore(nutr, additives);

        // personalisation boost:
        // if this product is better aligned with the user's usual preferences,
        // it gets extra points and ranks higher
        let boost = 0;

        const sugar =
          typeof nutr?.sugars_100g === "number" ? nutr.sugars_100g : null;
        const salt =
          typeof nutr?.salt_100g === "number" ? nutr.salt_100g : null;

        // lower sugar / salt / additives than the user's average = better match
        if (
          profile.avgSugar != null &&
          sugar != null &&
          sugar < profile.avgSugar
        )
          boost += 4;
        if (profile.avgSalt != null && salt != null && salt < profile.avgSalt)
          boost += 4;
        if (profile.avgAdditives != null && additives < profile.avgAdditives)
          boost += 3;

        // higher protein/fibre than your average = positive preference
        const protein =
          typeof nutr?.proteins_100g === "number" ? nutr.proteins_100g : null;
        const fibre =
          typeof nutr?.fiber_100g === "number" ? nutr.fiber_100g : null;

        if (
          profile.avgProtein != null &&
          protein != null &&
          protein > profile.avgProtein
        )
          boost += 2;
        if (
          profile.avgFibre != null &&
          fibre != null &&
          fibre > profile.avgFibre
        )
          boost += 2;

        // return a ranked recommendation object that the UI can display
        return {
          product: p,
          healthScore: health.score,
          finalScore: health.score + boost,
          // reason on why the item was recommended
          reason:
            boost >= 7
              ? "Matches your preferences"
              : boost >= 4
                ? "Better fit for you"
                : "Good alternative",
        };
      })
      // highest combined score first
      .sort((a, b) => b.finalScore - a.finalScore)
      // only show the top 5 recommendations
      .slice(0, 5)
  );
}

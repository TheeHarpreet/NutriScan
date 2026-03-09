// builds simple averages from favourites and history.
export function buildUserProfile(history: any[], favourites: any[]) {
  // give favourites more influence than normal scans
  const weighted: any[] = [
    ...history,
    ...favourites,
    ...favourites, // favourites counted twice as its stuff user likes
  ];

  // function to calculate the average value of one nutrition field.
  // example: avg("sugars_100g") gives the user's average sugar preference.
  const avg = (key: string) => {
    const nums = weighted
      // pull the requested field from every saved item
      .map((x) => x[key])
      // ignore anything that is missing or not a real number
      .filter((v) => typeof v === "number") as number[];

    // if no valid values exist, return null so the recommender can skip it
    if (nums.length === 0) return null;
    // average = total / count
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  // return the final profile object.
  // these averages will later be used to personalise recommendations.
  return {
    avgSugar: avg("sugars_100g"),
    avgSalt: avg("salt_100g"),
    avgSatFat: avg("saturated_fat_100g"),
    avgAdditives: avg("additives_n"),
    avgProtein: avg("protein_100g"),
    avgFibre: avg("fibre_100g"),
  };
}

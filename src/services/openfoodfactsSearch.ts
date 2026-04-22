import axios from "axios";

// search OpenFoodFacts for products in the same category.
// used to find similar products for the "Recommended for you" section.
export async function searchFoodByCategory(categoryTag: string, pageSize = 20) {
  try {
    const url =
      "https://world.openfoodfacts.org/api/v2/search" +
      `?categories_tags=${encodeURIComponent(categoryTag)}` +
      `&page_size=${pageSize}` +
      `&fields=code,product_name,brands,image_front_url,nutriments,additives_n,categories_tags`;

    const response = await axios.get(url);
    const data = response.data;

    // if OFF returns a valid products array, use it and if not return an empty list.
    if (Array.isArray(data?.products)) {
      return data.products;
    }

    return [];
  } catch (error) {
    console.error("OpenFoodFacts search error", error);
    return [];
  }
}

export async function searchFoodByText(query: string, pageSize = 20) {
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url =
      "https://world.openfoodfacts.org/api/v2/search" +
      `?search_terms=${encodeURIComponent(trimmed)}` +
      `&page_size=${pageSize}` +
      `&fields=code,product_name,brands,image_front_url`;

    const response = await axios.get(url);
    const data = response.data;

    console.log("Search response:", data);

    if (Array.isArray(data?.products)) {
      return data.products;
    }

    return [];
  } catch (error: any) {
    if (error?.response?.status === 503 || error?.response?.status === 429) {
      console.log(
        "OpenFoodFacts search temporarily unavailable:",
        error.response.status,
      );
    } else {
      console.error("OpenFoodFacts search error", error);
    }
    return [];
  }
}

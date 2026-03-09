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

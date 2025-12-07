import axios from "axios";

// fetch a food product by its barcode (EAN)
export async function fetchFoodByEAN(ean: string) {
  try {
    // build the full URL
    const url = `https://world.openfoodfacts.org/api/v2/product/${ean}.json`;

    // make HTTP GET request
    const response = await axios.get(url);

    const data = response.data;

    // accept product even if status === 0
    if (data.product) {
      console.log("Product found:", data.product.product_name);
      return data.product;
    }

    console.warn("No product found:", data.status_verbose);
    return null;
  } catch (error) {
    console.error("OpenFoodFacts error", error);
    return null;
  }
}

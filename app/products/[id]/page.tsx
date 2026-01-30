import { algoliasearch } from "algoliasearch";
import ProductPage from "@/components/ProductPage";
import { Product } from "@/lib/types/product";
import { notFound } from "next/navigation";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
interface ProductPageParams {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(objectID: string): Promise<Product | null> {
  if (!ALGOLIA_CONFIG.APP_ID || !ALGOLIA_CONFIG.SEARCH_API_KEY) {
    console.error("Algolia credentials are missing");
    return null;
  }

  if (!objectID) {
    console.error("objectID is required");
    return null;
  }

  try {
    const searchClient = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);

    const result = await searchClient.getObject({
      indexName: ALGOLIA_CONFIG.INDEX_NAME,
      objectID: objectID,
    });
    return result as unknown as Product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductPageParams) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductPage product={product} />;
}


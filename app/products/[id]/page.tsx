import { algoliasearch } from "algoliasearch";
import { redirect } from "next/navigation";
import { Product } from "@/lib/types/product";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

interface ProductPageParams {
  params: Promise<{ id: string }>;
}

async function getPage(objectID: string): Promise<Product | null> {
  if (!ALGOLIA_CONFIG.APP_ID || !ALGOLIA_CONFIG.SEARCH_API_KEY || !objectID) {
    return null;
  }

  try {
    const searchClient = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);
    const result = await searchClient.getObject({
      indexName: ALGOLIA_CONFIG.INDEX_NAME,
      objectID,
    });
    return result as unknown as Product;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductPageParams) {
  const { id } = await params;
  const page = await getPage(id);

  if (page?.url) {
    redirect(page.url);
  }

  // Fallback: redirect to home
  redirect("/");
}

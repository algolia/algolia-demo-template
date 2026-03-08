import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "./algolia-config";
export async function getObjectsByIds<Product>(
  objectIDs: string[],
  indexName: string
): Promise<Product[]> {
  const client = algoliasearch(
    ALGOLIA_CONFIG.APP_ID,
    ALGOLIA_CONFIG.SEARCH_API_KEY
  );
  const res = await client.getObjects({
    requests: objectIDs.map((objectID) => ({
      indexName,
      objectID,
    })),
  });

  return res.results as Product[];
}


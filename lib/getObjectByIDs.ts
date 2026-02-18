import { algoliasearch } from "algoliasearch";

export async function getObjectsByIds<Product>(
  objectIDs: string[],
  indexName: string
): Promise<Product[]> {
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "",
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY ?? ""
  );
  const res = await client.getObjects({
    requests: objectIDs.map((objectID) => ({
      indexName,
      objectID,
    })),
  });

  return res.results as Product[];
}


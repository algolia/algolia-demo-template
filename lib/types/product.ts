export interface Page {
  objectID: string;
  title: string;
  url: string;
  body: string;
  snippet?: string;
  ambito: string[];
  ambitoLabel?: string;
  lang: string;
  // gencat_content uses "domain", gencat_pages uses "siteDomain"
  domain?: string;
  siteDomain?: string;
  siteLabel?: string;
  site?: string[];
  h1: string;
  h2: string;
  h3?: string;
  mimeType: string;
  lastIndexed: number;
  chunks?: number;
  order?: number;
  langValue?: number;
  categoryPageId?: string[];
  hierarchical_categories: {
    lvl0: string;
    lvl1?: string;
  };

  // Algolia search response fields
  _highlightResult?: Record<string, unknown>;
  _snippetResult?: Record<string, unknown>;
  _rankingInfo?: Record<string, unknown>;
}

// Alias for gradual migration — existing imports still compile
export type Product = Page;

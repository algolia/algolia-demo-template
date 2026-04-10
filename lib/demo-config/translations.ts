/**
 * UI translations — English only (single language)
 */
const strings: Record<string, string> = {
  // Search page
  "search.loadingSuggestions": "Loading suggestions...",
  "search.noResults": "No results found",
  "search.adjustTerms": "Try adjusting your search terms",
  "search.resultsFor": "Results for:",
  "search.hideFilters": "Hide filters",
  "search.showFilters": "Filters",
  "search.placeholder": "Search products...",

  // Filters
  "filters.forYou": "For you",
  "filters.topic": "Category",
  "filters.language": "Language",
  "filters.website": "Website",
  "filters.fileType": "File type",
  "filters.search": "Search...",
  "filters.searchWebsite": "Search website...",
  "filters.clearAll": "Clear all",
  "filters.apply": "Apply",
  "filters.filters": "Filters",

  // Inline AI Summary
  "ai.generating": "Generating AI summary...",
  "ai.response": "AI Response",
  "ai.sources": "Sources",
  "ai.continueConversation": "Continue the conversation with the assistant \u2192",

  // Toolbar
  "toolbar.gridView": "Grid view",
  "toolbar.listView": "List view",
  "toolbar.results": "results",

  // Product card
  "card.personalizedForYou": "Personalized for you",
  "card.noTitle": "Untitled",

  // Navbar
  "navbar.openAssistant": "Open AI assistant",
  "navbar.askAnything": "Ask me anything...",

  // Brand
  "brand.tagline": "Your one-stop shop",
};

export const translations = strings;

export function t(key: string): string {
  return strings[key] ?? key;
}

export function getExampleQueries(): string[] {
  return [
    "Michael Kors bag",
    "Summer dress",
    "Men's leather shoes",
    "Polo Ralph Lauren",
    "Guess accessories",
  ];
}

export function getFallbackSuggestions(): string[] {
  return [
    "What are the best deals today?",
    "Show me new arrivals",
    "Help me find a gift",
    "What's trending right now?",
    "Compare products for me",
  ];
}

export function getInlineSummaryPrompt(query: string): string {
  return `[CONTEXT]{"requestType":"inlineSummary","query":"${query}","language":"en"}[/CONTEXT]\n\nThe user searched for: "${query}"\n\nSearch the index and use the showSummary tool to display a structured summary in English.`;
}

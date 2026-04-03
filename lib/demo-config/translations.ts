export type Language = string;

export const translations: Record<string, Record<string, string>> = {
  it: {
    "filters.topic": "Categoria",
    "filters.website": "Sito web",
    "filters.searchWebsite": "Cerca sito web...",
    "filters.fileType": "Tipo di file",
    "filters.forYou": "Per te",
    "filters.filters": "Filtri",
    "filters.clearAll": "Cancella tutto",
    "toolbar.results": "risultati",
    "toolbar.gridView": "Vista griglia",
    "toolbar.listView": "Vista lista",
    "search.noResults": "Nessun risultato trovato",
    "search.adjustTerms": "Prova a modificare i termini di ricerca",
    "ai.continueConversation": "Continua la conversazione",
  },
};

export function getInlineSummaryPrompt(_lang: Language, query: string): string {
  return `[CONTEXT]{"requestType":"inlineSummary","query":"${query}","language":"it"}[/CONTEXT]\n\nL'utente ha cercato: "${query}"\n\nCerca nell'indice e usa lo strumento showSummary per mostrare un riepilogo strutturato in italiano.`;
}

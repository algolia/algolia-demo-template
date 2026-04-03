export type Language = string;

export const translations: Record<string, Record<string, string>> = {
  it: {},
};

export function getInlineSummaryPrompt(_lang: Language, query: string): string {
  return `[CONTEXT]{"requestType":"inlineSummary","query":"${query}","language":"it"}[/CONTEXT]\n\nL'utente ha cercato: "${query}"\n\nCerca nell'indice e usa lo strumento showSummary per mostrare un riepilogo strutturato in italiano.`;
}

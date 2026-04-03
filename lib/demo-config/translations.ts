export type Language = "ca" | "es";

const strings: Record<Language, Record<string, string>> = {
  ca: {
    // Search page
    "search.loadingSuggestions": "Carregant suggeriments...",
    "search.noResults": "No s'han trobat resultats",
    "search.adjustTerms": "Prova d'ajustar els termes de cerca",
    "search.resultsFor": "Resultats per:",
    "search.hideFilters": "Amagar filtres",
    "search.showFilters": "Filtres",
    "search.placeholder": "Cercar continguts i serveis...",

    // Filters
    "filters.forYou": "Per a tu",
    "filters.topic": "Tema",
    "filters.language": "Idioma",
    "filters.website": "Lloc web",
    "filters.fileType": "Tipus de fitxer",
    "filters.search": "Cercar...",
    "filters.searchWebsite": "Cercar lloc web...",
    "filters.clearAll": "Esborrar tot",
    "filters.apply": "Aplicar",
    "filters.filters": "Filtres",

    // Inline AI Summary
    "ai.generating": "Generant resum IA...",
    "ai.response": "Resposta IA",
    "ai.sources": "Fonts",
    "ai.continueConversation": "Continuar la conversa amb l'assistent →",

    // Toolbar
    "toolbar.gridView": "Vista graella",
    "toolbar.listView": "Vista llista",
    "toolbar.results": "resultats",

    // Product card
    "card.personalizedForYou": "Personalitzat per a tu",
    "card.noTitle": "Sense títol",

    // Navbar
    "navbar.openAssistant": "Obrir assistent IA",
    "navbar.askAnything": "Pregunta'm qualsevol cosa...",

    // Brand
    "brand.tagline": "Cercador de continguts i serveis",
  },
  es: {
    // Search page
    "search.loadingSuggestions": "Cargando sugerencias...",
    "search.noResults": "No se han encontrado resultados",
    "search.adjustTerms": "Intenta ajustar los términos de búsqueda",
    "search.resultsFor": "Resultados para:",
    "search.hideFilters": "Ocultar filtros",
    "search.showFilters": "Filtros",
    "search.placeholder": "Buscar contenidos y servicios...",

    // Filters
    "filters.forYou": "Para ti",
    "filters.topic": "Tema",
    "filters.language": "Idioma",
    "filters.website": "Sitio web",
    "filters.fileType": "Tipo de archivo",
    "filters.search": "Buscar...",
    "filters.searchWebsite": "Buscar sitio web...",
    "filters.clearAll": "Borrar todo",
    "filters.apply": "Aplicar",
    "filters.filters": "Filtros",

    // Inline AI Summary
    "ai.generating": "Generando resumen IA...",
    "ai.response": "Respuesta IA",
    "ai.sources": "Fuentes",
    "ai.continueConversation": "Continuar la conversación con el asistente →",

    // Toolbar
    "toolbar.gridView": "Vista cuadrícula",
    "toolbar.listView": "Vista lista",
    "toolbar.results": "resultados",

    // Product card
    "card.personalizedForYou": "Personalizado para ti",
    "card.noTitle": "Sin título",

    // Navbar
    "navbar.openAssistant": "Abrir asistente IA",
    "navbar.askAnything": "Pregúntame lo que quieras...",

    // Brand
    "brand.tagline": "Buscador de contenidos y servicios",
  },
};

export const translations = strings;

export function getExampleQueries(lang: Language): string[] {
  if (lang === "es") {
    return [
      "Ayudas para pagar el alquiler",
      "Preinscripción escolar 2026",
      "Oposiciones a la administración",
      "Trámites para empadronarme",
      "Teletrabajo en la función pública",
    ];
  }
  return [
    "Ajuts per pagar el lloguer",
    "Preinscripció escolar 2026",
    "Oposicions a l'administració",
    "Tràmits per empadronar-me",
    "Teletreball a la funció pública",
  ];
}

export function getFallbackSuggestions(lang: Language): string[] {
  if (lang === "es") {
    return [
      "¿Qué ayudas hay para la vivienda?",
      "¿Cómo hacer la preinscripción escolar?",
      "Oposiciones abiertas en la Generalitat",
      "Trámites para empadronarme",
      "Ayudas para emprendedores",
    ];
  }
  return [
    "Quins ajuts hi ha per a l'habitatge?",
    "Com fer la preinscripció escolar?",
    "Oposicions obertes a la Generalitat",
    "Tràmits per empadronar-me",
    "Ajudes per a emprenedors",
  ];
}

export function getInlineSummaryPrompt(lang: Language, query: string): string {
  if (lang === "es") {
    return `[CONTEXT]{"requestType":"inlineSummary","query":"${query}","language":"es"}[/CONTEXT]\n\nEl usuario ha buscado: "${query}"\n\nBusca en el índice y usa la herramienta showSummary para mostrar un resumen estructurado en español.`;
  }
  return `[CONTEXT]{"requestType":"inlineSummary","query":"${query}","language":"ca"}[/CONTEXT]\n\nL'usuari ha cercat: "${query}"\n\nCerca a l'índex i utilitza l'eina showSummary per mostrar un resum estructurat en català.`;
}

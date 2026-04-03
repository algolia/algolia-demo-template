/**
 * Agent Studio configuration for GenCat citizen assistant
 */
import { ALGOLIA_CONFIG } from "../algolia-config";
import { DEMO_CONFIG } from "./index";

export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "title",
  "url",
  "snippet",
  "ambitoLabel",
  "siteDomain",
  "siteLabel",
  "lang",
  "h1",
  "h2",
  "lastIndexed",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.agentName}`,
    instructions: `**ROL DE L'AGENT**
Ets l'Assistent GenCat, un assistent intel·ligent del portal de la Generalitat de Catalunya. Ajudes els ciutadans a trobar informació sobre serveis, tràmits, ajudes i procediments del govern català.

**ESTIL DE RESPOSTA**
- Respon sempre en català per defecte
- Sigues concís, clar i útil
- Quan el context té "isFirstMessage": true, respon amb una frase curta (màx 15 paraules) — sense cerques, només una benvinguda breu
- Cita sempre les fonts amb les URLs completes dels resultats
- Quan presentis informació, organitza-la amb punts clau i enllaços rellevants
- Format de cites: [Títol de la pàgina](URL)

**EINES**
- algolia_search_index — Cerca al contingut del portal GenCat
- showItems — Mostra pàgines rellevants als ciutadans
- showSummary — Mostra un resum estructurat (NOMÉS per a consultes amb requestType "inlineSummary")

**COMPORTAMENT**
1. Entén la pregunta del ciutadà
2. Cerca contingut rellevant amb algolia_search_index
3. Resumeix la informació clau en 3-5 frases
4. Inclou sempre enllaços a les fonts originals
5. Ofereix accions de seguiment (tràmits relacionats, més informació, oficines)

**RESUM INLINE**
Quan rebis una consulta amb [CONTEXT] que contingui "requestType":"inlineSummary":
1. Cerca primer amb algolia_search_index
2. Crida l'eina showSummary amb el resum i les fonts trobades
3. NO respondis amb text pla per a resums inline — utilitza SEMPRE showSummary

**FILTRATGE**
- Usa filtres per ambitoLabel per acotar per àmbit temàtic
- Usa filtres per lang per assegurar resultats en català
- Per tràmits, filtra per siteDomain: "tramits.gencat.cat"

**IDIOMA**
- Respon en l'idioma que utilitza el ciutadà, per defecte en català
- Entén consultes en català, castellà i anglès`,

    indexDescription: `Contingut del portal web de la Generalitat de Catalunya. Cada registre és una pàgina web amb informació sobre serveis, tràmits, ajudes i procediments.

**Camps cercables:**
- title: Títol de la pàgina
- h1, h2: Encapçalaments
- snippet: Resum del contingut
- body: Contingut complet de la pàgina

**Camps filtrables:**
- ambitoLabel: Àmbit temàtic (Ensenyament, Salut, Treball, Empresa, Cultura, Medi Ambient, Justícia, etc.)
- lang: Idioma (ca, es, en)
- siteLabel: Lloc web (GenCat, Tràmits, Habitatge, Educació, Salut, etc.)
- siteDomain: Domini del lloc web
- mimeType: Tipus de fitxer (text/html, application/pdf)
- hierarchical_categories.lvl0: Categoria principal

**IMPORTANT:** Utilitza els valors exactes dels filtres que existeixen a l'índex.`,

    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Contingut del portal GenCat",
            enhancedDescription: `Contingut del portal web de la Generalitat de Catalunya.

**IMPORTANT:**
- Only use exact category values that exist in your index for filtering.
- Search for one topic at a time. If the user asks for multiple topics, run separate searches for each rather than combining them into one query.`,
            searchParameters: {
              attributesToRetrieve: AGENT_PRODUCT_ATTRIBUTES,
            },
          },
        ],
      },
      {
        name: "showItems",
        type: "client_side",
        description:
          "Mostra pàgines rellevants al ciutadà amb un títol i explicació. Utilitza-ho per presentar resultats de cerca o recomanacions.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array d'objectIDs de les pàgines a mostrar",
            },
            title: {
              type: "string",
              description: "Títol curt per a la secció de resultats",
            },
            explanation: {
              type: "string",
              description: "Breu explicació de per què es mostren aquestes pàgines",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
      {
        name: "showSummary",
        type: "client_side",
        description:
          "Mostra un resum estructurat. Utilitza SEMPRE per a consultes amb requestType 'inlineSummary' després de cercar.",
        inputSchema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description:
                "Resum concís (3-5 frases) en la llengua de l'usuari. Pot contenir markdown (negreta, llistes).",
            },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Títol de la font" },
                  url: { type: "string", description: "URL de la pàgina font" },
                  domain: {
                    type: "string",
                    description: "Domini (e.g. habitatge.gencat.cat)",
                  },
                },
                required: ["title", "url"],
              },
              description: "Fonts rellevants trobades a l'índex (màxim 5)",
            },
          },
          required: ["summary", "sources"],
        },
      },
    ],
  },

  summary: {
    name: "GenCat Summary",
    instructions: `Ets un agent de resum per al portal de la Generalitat de Catalunya.

**COMPORTAMENT**
1. Rep una consulta de cerca d'un ciutadà
2. Cerca contingut rellevant amb algolia_search_index
3. Crida SEMPRE l'eina showSummary amb un resum estructurat i les fonts trobades
4. NO respondis mai amb text pla — utilitza SEMPRE showSummary

**ESTIL**
- Resum concís de 3-5 frases
- Respon en l'idioma indicat al context (per defecte català)
- Inclou fets concrets (dates, imports, requisits) quan els trobis
- Les fonts han de ser les URLs exactes dels resultats de cerca

**FILTRATGE**
- Usa filtres per lang per assegurar resultats en l'idioma de l'usuari
- Per tràmits, filtra per siteDomain: "tramits.gencat.cat"`,

    indexDescription: `Contingut del portal web de la Generalitat de Catalunya. Cada registre és una pàgina web amb informació sobre serveis, tràmits, ajudes i procediments.

**Camps cercables:**
- title: Títol de la pàgina
- h1, h2: Encapçalaments
- snippet: Resum del contingut
- body: Contingut complet de la pàgina

**Camps filtrables:**
- ambitoLabel: Àmbit temàtic (Ensenyament, Salut, Treball, Empresa, Cultura, etc.)
- lang: Idioma (ca, es)
- siteLabel: Lloc web
- siteDomain: Domini del lloc web`,

    tools: [
      {
        name: "showSummary",
        type: "client_side",
        description:
          "Mostra un resum estructurat a la pàgina de resultats. Crida SEMPRE aquesta eina després de cercar amb algolia_search_index.",
        inputSchema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description:
                "Resum concís (3-5 frases) en la llengua de l'usuari. Pot contenir markdown (negreta, llistes).",
            },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Títol de la font" },
                  url: { type: "string", description: "URL de la pàgina font" },
                  domain: {
                    type: "string",
                    description: "Domini (e.g. habitatge.gencat.cat)",
                  },
                },
                required: ["title", "url"],
              },
              description: "Fonts rellevants trobades a l'índex (màxim 5)",
            },
          },
          required: ["summary", "sources"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "Quins ajuts hi ha per a l'habitatge?",
    "Com fer la preinscripció escolar?",
    "Oposicions obertes a la Generalitat",
    "Tràmits per empadronar-me",
    "Ajudes per a emprenedors",
  ] as string[],
};

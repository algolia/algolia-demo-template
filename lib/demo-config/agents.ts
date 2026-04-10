/**
 * Agent Studio configuration
 *
 * Edit this file to customize AI agent instructions, tools, and metadata.
 * These are used by scripts/setup-agent.ts to configure agents in Algolia.
 */
import { ALGOLIA_CONFIG } from "../algolia-config";
import { DEMO_CONFIG } from "./index";

/**
 * Product attributes exposed to the agent API key.
 * Keep this list minimal — only what the agent needs to answer questions.
 */
export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "name",
  "brand",
  "price",
  "description",
  "hierarchical_categories",
  "primary_image",
  "età",
  "razza",
  "taglia",
  "gusto",
  "funzione",
  "formato",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Shopping Assistant`,
    instructions: `**AGENT ROLE**
Sei il Personal Shopper di ${DEMO_CONFIG.brand.name}. Guidi i clienti in un'esperienza di acquisto personalizzata per i loro animali domestici — come un commesso esperto in negozio.

**RESPONSE STYLE**
- When context has "isFirstMessage": true, give a warm one-liner greeting (max 15 words) based on the current page context. No product searches, no lists — just a friendly welcome that shows you understand what they're browsing.
- From the second message onwards, jump straight into helping — no greetings, no pleasantries, just action.
- Risposte brevi e conversazionali (2-3 frasi max per messaggio)
- Usa emoji degli animali con moderazione (🐕 🐈 🐰) per dare personalità
- Mai elenchi lunghi o muri di testo — preferisci showItems per mostrare prodotti

**Tools**
- algolia_search_index — Cerca nel catalogo prodotti E negli articoli del magazine (2 indici disponibili)
- recommend_related_products — Prodotti correlati (dato un objectID)
- addToCart — Aggiungi prodotti al carrello
- showItems — Mostra prodotti consigliati con titolo e motivazione
- showArticles — Mostra articoli educativi con titolo e link

**CRITICAL: MULTI-SEARCH RULE**
When the user asks for multiple product types in one message, you MUST run separate searches for each type. Never combine different categories into a single query.
Example: "ho bisogno di crocchette e giochi per il mio cane"
→ Search 1: "crocchette cane" (category: Cane > Cibo Secco)
→ Search 2: "giochi cane" (category: Cane > Giochi)
→ Present results from each search separately using showItems

**EDUCATIONAL CONTENT**
- Hai accesso agli articoli del magazine Arcaplanet tramite algolia_search_index (indice arcaplanet_articles)
- Quando un cliente chiede consigli su salute, comportamento, alimentazione → cerca articoli pertinenti
- Dopo una raccomandazione di prodotto, se esiste un articolo correlato, condividilo usando showArticles
- Per nuovi proprietari di cuccioli/gattini, suggerisci proattivamente articoli come "I primi 30 giorni con il tuo cucciolo"
- SEMPRE usa showArticles per mostrare gli articoli — non inserirli come testo nel messaggio
- Non limitarti ai prodotti — il valore è anche nella consulenza

**GUIDED PURCHASE FLOW**
Segui questo flusso multi-turno per guidare l'acquisto:

1. **Profila l'animale** — Se il contesto utente non ha già i dettagli, chiedi in modo naturale:
   - "Che animale hai?" (cane/gatto/altro)
   - "Quanti anni ha?" / "È cucciolo o adulto?"
   - "Di che taglia è?" (per i cani)
   - "Ha esigenze particolari?" (allergie, peso, pelo, digestione)
   NON chiedere tutto insieme — una domanda alla volta, in modo conversazionale.

2. **Cerca con filtri mirati** — Usa le informazioni raccolte per filtrare:
   - Combina età + taglia + categoria per risultati precisi
   - Es: cane cucciolo taglia media → filtra età.value:PUPPY + hierarchical_categories.lvl1:"Cane > Cibo Secco"

3. **Presenta opzioni** — Usa showItems con 2-3 prodotti, spiegando le differenze:
   - "Ecco 3 opzioni per cuccioli di taglia media:"
   - Spiega brevemente perché ogni prodotto è adatto
   - Evidenzia differenze di prezzo/qualità/marca

4. **Cross-sell intelligente** — Dopo la scelta principale, suggerisci complementi:
   - Cibo → Snack della stessa linea/marca
   - Cibo cucciolo → Giochi per cuccioli
   - Antiparassitari → Integratori
   - Sempre con contesto: "Visto che hai scelto Royal Canin Puppy, potrebbe interessarti..."

5. **Chiudi la vendita** — Offri di aggiungere al carrello e suggerisci se c'è altro.

**USING CONTEXT**
- Se il contesto include un profilo utente con preferenze, USALE per personalizzare i risultati
- Se il cliente sta guardando un prodotto specifico, parti da quello come riferimento
- Se la ricerca mostra dei filtri attivi, rispetta quelli come punto di partenza
- Se il carrello ha già prodotti, suggerisci complementi coerenti

**KNOWLEDGE — PET PRODUCT ATTRIBUTES**
Filterable fields for search:
- età.value: PUPPY, ADULTO, ANZIANO, KITTEN, STERILIZZATO
- razza.value: nomi specifici di razze
- taglia.value: TUTTE LE TAGLIE, PICCOLA, MEDIA, GRANDE, TOY
- gusto.value: POLLO, MANZO, SALMONE, AGNELLO, etc.
- funzione.value: CONTROLLO DEL PESO, DIGESTIONE, STERILIZZATO, SENSIBILITA', INTESTINALE, etc.
- formato.value: MULTIPACK, LATTINA, BUSTA, SINGOLA, etc.
- brand: ROYAL CANIN, MONGE, HILL'S, PURINA, FARMINA, ALMO NATURE, etc.

**TONE**
- Amichevole ma competente — come parlare con un esperto in negozio
- Mostra passione per gli animali
- Se il cliente chiede qualcosa fuori ambito, riporta gentilmente la conversazione sui prodotti

**Language**
- Rispondi nella lingua del cliente, default italiano`,

    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Catalogo prodotti per animali domestici",
            enhancedDescription: `Catalogo prodotti ${DEMO_CONFIG.brand.name} — negozio per animali domestici (cani, gatti, piccoli animali).

**Key filterable fields:**
- price.value: Prezzo prodotto (numeric)
- brand: Marca (es. ROYAL CANIN, MONGE, HILL'S, PURINA, FARMINA)
- hierarchical_categories.lvl0: Animale principale — Cane, Gatto, Piccoli Animali, Persona e Casa
- hierarchical_categories.lvl1: Tipo prodotto — es. "Cane > Cibo Secco", "Gatto > Snack", "Cane > Giochi"
- hierarchical_categories.lvl2: Sottocategoria — es. "Cane > Snack > Masticativi"
- età.value: Età animale — PUPPY, ADULTO, ANZIANO, KITTEN, STERILIZZATO
- funzione.value: Funzione prodotto — CONTROLLO DEL PESO, DIGESTIONE, etc.
- formato.value: Formato/packaging prodotto
- razza.value: Razza dell'animale

**IMPORTANT:**
- Only use exact category values that exist in your index for filtering.
- Search for one product category at a time. If the user asks for multiple types of products (e.g. "cibo e giochi"), run separate searches for each rather than combining them into one query.
- Category values are in Italian. Use exact Italian names for filtering.`,
            searchParameters: {
              attributesToRetrieve: AGENT_PRODUCT_ATTRIBUTES,
            },
          },
          {
            index: ALGOLIA_CONFIG.ARTICLES_INDEX,
            description: "Articoli e guide del magazine Arcaplanet su cura degli animali",
            enhancedDescription: `Magazine Arcaplanet — articoli educativi su cura, salute, alimentazione e comportamento degli animali domestici.

**Categories:** Cane, Gatto, Altri animali, Alimentazione, Benessere e salute, Comportamento e gioco, Puppy, Kitten
**Tags:** Include breed-specific, health, seasonal, behavioral topics

**Use this index when:**
- The customer asks for advice or educational content (not product search)
- You want to support a product recommendation with an article
- The customer asks about health, behavior, training, nutrition topics
- Example: "come abituare il cucciolo al guinzaglio", "alimentazione gatto sterilizzato"

**Returns:** title, summary, url, categories, tags`,
            searchParameters: {
              hitsPerPage: 3,
            },
          },
        ],
      },
      {
        name: "addToCart",
        type: "client_side",
        description:
          "Add products to the customer's shopping cart. Use this when the customer wants to buy or add items to their cart.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of product objectIDs to add to cart",
            },
          },
          required: ["objectIDs"],
        },
      },
      {
        name: "recommend_related_products",
        type: "algolia_recommend",
        description: "Algolia Recommend tool. Given a product objectID, returns related products. Use when the customer is viewing a product and wants alternatives or complementary items.",
        allowedConfigs: [
          {
            modelName: "related-products",
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Returns related products based on the given product objectID",
          },
        ],
      },
      {
        name: "showItems",
        type: "client_side",
        description:
          "Display product recommendations to the customer with a title and explanation. Use this to present products you want to recommend.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array of product objectIDs to display",
            },
            title: {
              type: "string",
              description: "A short title for the recommendation section",
            },
            explanation: {
              type: "string",
              description:
                "Brief explanation of why these products are being recommended",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
      {
        name: "showArticles",
        type: "client_side",
        description:
          "Display educational articles to the customer with titles and links. Use this when you find relevant articles from the arcaplanet_articles index.",
        inputSchema: {
          type: "object",
          properties: {
            articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Article title" },
                  summary: { type: "string", description: "Brief summary of the article" },
                  url: { type: "string", description: "URL to the full article" },
                  category: { type: "string", description: "Article category (e.g. Cane, Gatto, Alimentazione)" },
                },
                required: ["title", "summary"],
              },
              description: "Array of articles to display",
            },
            title: {
              type: "string",
              description: "A short title for the articles section",
            },
          },
          required: ["articles", "title"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "Ho adottato un cucciolo, cosa mi serve?",
    "Consigli per i primi giorni con un gattino",
    "Quale cibo è migliore per un Golden Retriever cucciolo?",
    "Il mio cane ha problemi digestivi, cosa posso dargli?",
    "Cerca antiparassitari per cani di taglia media",
  ] as string[],
};

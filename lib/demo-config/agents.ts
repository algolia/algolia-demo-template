/**
 * Agent Studio configuration for HOMYCASA demo
 */
import { ALGOLIA_CONFIG } from "../algolia-config";
import { DEMO_CONFIG } from "./index";

export const AGENT_PRODUCT_ATTRIBUTES = [
  "objectID",
  "name",
  "brand",
  "price",
  "description",
  "hierarchical_categories",
  "stock",
  "color",
  "primary_image",
  "url",
  "specs",
  "material",
  "warranty",
];

export const AGENT_CONFIG = {
  main: {
    name: `${DEMO_CONFIG.brand.name} Assistente de Compras`,
    instructions: `**PAPEL DO AGENTE**
Você é um Assistente de Compras para ${DEMO_CONFIG.brand.name}, uma loja de móveis e decoração portuguesa. Ajuda os clientes a encontrar móveis, decoração e soluções para o lar.

**ESTILO DE RESPOSTA**
- Respostas concisas e úteis em português
- Quando o contexto tiver "isFirstMessage": true, responda com uma frase curta (máx 15 palavras) — sem pesquisas de produtos, apenas uma saudação breve
- Ofereça sempre próximas ações claras (adicionar ao carrinho, saber mais, comparar)
- Use um tom acolhedor e profissional que reflita a marca HOMYCASA

**Ferramentas**
- algolia_search_index - Pesquisar o catálogo de produtos HOMYCASA
- addToCart - Adicionar produtos ao carrinho do cliente
- showItems - Apresentar recomendações de produtos

**Comportamento**
1. Entender as necessidades de decoração e espaço do cliente
2. Pesquisar produtos relevantes para a divisão (sala, quarto, escritório, etc.)
3. Usar showItems para apresentar 2-4 opções
4. Oferecer próximos passos claros
5. Considerar estilo (moderno, clássico, minimalista), cor e orçamento nas recomendações

**Idioma**
- Responder em português (Portugal) por defeito
- Adaptar ao idioma que o cliente usar`,

    tools: [
      {
        name: "algolia_search_index",
        type: "algolia_search_index",
        indices: [
          {
            index: ALGOLIA_CONFIG.INDEX_NAME,
            description: "Catálogo de produtos",
            enhancedDescription: `Catálogo de produtos ${DEMO_CONFIG.brand.name} — móveis e decoração para o lar, mercado português.

**Campos filtráveis principais:**
- price.value: Preço do produto (numérico, em EUR)
- brand: Marca (tipicamente "HOMYCASA")
- hierarchical_categories.lvl0: Categoria principal (ex: "Sofás", "Salas", "Quartos", "Cadeiras", "Arrumação", "Decoração", "Colchões", "Escritório")
- hierarchical_categories.lvl1: Subcategoria como "Pai > Filho" (ex: "Sofás > Sofás com Chaise Longue", "Sofás > Sofás Cama", "Salas > Mesas de Jantar", "Quartos > Camas de Casal", "Cadeiras > Cadeirões e Poltronas", "Decoração > Tapetes", "Decoração > Candeeiros de Mesa")
- stock.in_stock: Booleano, true se disponível
- color.filter_group: Grupo de cor (ex: "cinzento", "branco", "bege", "verde", "azul")
- material: Material de revestimento (ex: "Tecido", "Pele sintética", "Madeira")
- converts_to_bed: "Sim" ou "Não" - se o sofá converte em cama

**IMPORTANTE:**
- Pesquisar em português — os produtos têm nomes e categorias em PT
- Pesquisar uma categoria de produto por vez
- Para sofás com cama: usar filtro converts_to_bed = "Sim"
- Quando o utilizador menciona divisões (sala, quarto, escritório), mapear para as categorias corretas`,
            searchParameters: {
              attributesToRetrieve: AGENT_PRODUCT_ATTRIBUTES,
            },
          },
        ],
      },
      {
        name: "addToCart",
        type: "client_side",
        description:
          "Adicionar produtos ao carrinho do cliente. Usar quando o cliente quer comprar ou adicionar ao carrinho.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array de objectIDs de produtos a adicionar",
            },
          },
          required: ["objectIDs"],
        },
      },
      {
        name: "showItems",
        type: "client_side",
        description:
          "Apresentar recomendações de produtos ao cliente com título e explicação.",
        inputSchema: {
          type: "object",
          properties: {
            objectIDs: {
              type: "array",
              items: { type: "string" },
              description: "Array de objectIDs de produtos a apresentar",
            },
            title: {
              type: "string",
              description: "Título curto para a secção de recomendações",
            },
            explanation: {
              type: "string",
              description: "Breve explicação de por que estes produtos são recomendados",
            },
          },
          required: ["objectIDs", "title", "explanation"],
        },
      },
    ],
  },

  fallbackSuggestions: [
    "Mostrar sofás com chaise longue",
    "Encontrar camas de casal",
    "Ver mesas de jantar",
    "Mostrar cadeirões e poltronas",
    "Encontrar decoração para sala",
  ] as string[],
};

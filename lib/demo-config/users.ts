import type { User, PreferenceKey, PreferenceMetadata } from "@/lib/types/user";

export const users: User[] = [
  {
    id: "1",
    description: "Sala de Estar",
    slug: "sala_de_estar",
    preferences: {
      "hierarchical_categories.lvl0": { "Sofás": 20, "Salas": 18 },
      "hierarchical_categories.lvl1": {
        "Sofás > Sofás com Chaise Longue": 20,
        "Salas > Mesas de Jantar": 16,
        "Salas > Aparadores": 14,
      },
    },
  },
  {
    id: "2",
    description: "Quarto",
    slug: "quarto",
    preferences: {
      "hierarchical_categories.lvl0": { "Quartos": 20, "Colchões": 15 },
      "hierarchical_categories.lvl1": {
        "Quartos > Camas de Casal": 20,
        "Quartos > Mesas de Cabeceira": 16,
        "Quartos > Coleções de Quartos": 14,
      },
    },
  },
  {
    id: "3",
    description: "Decoração",
    slug: "decoracao",
    preferences: {
      "hierarchical_categories.lvl0": { "Decoração": 20, "Cadeiras": 15 },
      "hierarchical_categories.lvl1": {
        "Decoração > Tapetes": 20,
        "Decoração > Candeeiros de Mesa": 18,
        "Decoração > Candeeiros de Teto": 16,
      },
    },
  },
  {
    id: "4",
    description: "Visitante",
    slug: "visitante",
    preferences: {},
  },
];

export const PREFERENCE_METADATA: Record<PreferenceKey, PreferenceMetadata> = {
  "categories.lvl0": { title: "Categorias Principais", icon: "layers" },
  "categories.lvl1": { title: "Subcategorias", icon: "tag" },
  "categories.lvl2": { title: "Categorias Específicas", icon: "tag" },
  "hierarchical_categories.lvl0": { title: "Categorias Principais", icon: "layers" },
  "hierarchical_categories.lvl1": { title: "Subcategorias", icon: "layers" },
  "hierarchical_categories.lvl2": { title: "Subcategorias", icon: "layers" },
  "hierarchical_categories.lvl3": { title: "Subcategorias", icon: "layers" },
  brand: { title: "Marcas", icon: "tag" },
  characteristics: { title: "Características", icon: "target" },
  format: { title: "Formato", icon: "package" },
};

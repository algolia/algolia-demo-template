import {
  Sofa,
  Bed,
  UtensilsCrossed,
  Package,
  Armchair,
  Lamp,
} from "lucide-react";

export type CategoryNode = {
  name: string;
  slug: string;
  count?: number;
  children?: Record<string, CategoryNode>;
};

export type RootCategory = CategoryNode & {
  icon: React.ComponentType<{ className?: string }>;
};

export const HIERARCHICAL_CATEGORIES: Record<string, RootCategory> = {
  sofas: {
    name: "Sofás",
    slug: "sofas",
    count: 134,
    icon: Sofa,
    children: {
      "sofas-com-chaise-longue": { name: "Sofás com Chaise Longue", slug: "sofas-com-chaise-longue", count: 40 },
      "sofas-de-3-lugares": { name: "Sofás de 3 lugares", slug: "sofas-de-3-lugares", count: 26 },
      "sofas-cama": { name: "Sofás Cama", slug: "sofas-cama", count: 20 },
      "sofas-de-canto": { name: "Sofás de Canto", slug: "sofas-de-canto", count: 15 },
      "sofas-de-2-lugares": { name: "Sofás de 2 lugares", slug: "sofas-de-2-lugares", count: 12 },
    },
  },
  salas: {
    name: "Salas",
    slug: "salas",
    count: 414,
    icon: UtensilsCrossed,
    children: {
      "colecoes-de-salas": { name: "Coleções de Salas", slug: "colecoes-de-salas", count: 97 },
      "mesas-de-jantar": { name: "Mesas de Jantar", slug: "mesas-de-jantar", count: 69 },
      "aparadores": { name: "Aparadores", slug: "aparadores", count: 67 },
      "mesas-de-centro": { name: "Mesas de Centro", slug: "mesas-de-centro", count: 59 },
      "moveis-de-tv": { name: "Móveis de TV", slug: "moveis-de-tv", count: 36 },
      "estantes": { name: "Estantes", slug: "estantes", count: 35 },
    },
  },
  quartos: {
    name: "Quartos",
    slug: "quartos",
    count: 294,
    icon: Bed,
    children: {
      "camas-de-casal": { name: "Camas de Casal", slug: "camas-de-casal", count: 48 },
      "mesas-de-cabeceira": { name: "Mesas de Cabeceira", slug: "mesas-de-cabeceira", count: 43 },
      "colecoes-de-quartos": { name: "Coleções de Quartos", slug: "colecoes-de-quartos", count: 33 },
      "packs-camas-de-casal": { name: "Packs Camas de Casal", slug: "packs-camas-de-casal", count: 63 },
    },
  },
  cadeiras: {
    name: "Cadeiras",
    slug: "cadeiras",
    count: 235,
    icon: Armchair,
    children: {
      "cadeiras": { name: "Cadeiras", slug: "cadeiras", count: 74 },
      "packs-de-cadeiras": { name: "Packs de Cadeiras", slug: "packs-de-cadeiras", count: 68 },
      "cadeiroes-e-poltronas": { name: "Cadeirões e Poltronas", slug: "cadeiroes-e-poltronas", count: 42 },
    },
  },
  arrumacao: {
    name: "Arrumação",
    slug: "arrumacao",
    count: 158,
    icon: Package,
    children: {
      "comodos-e-camiseiros": { name: "Cómodas e Camiseiros", slug: "comodos-e-camiseiros", count: 38 },
      "consolas-de-entrada": { name: "Consolas de Entrada", slug: "consolas-de-entrada", count: 29 },
      "roupeiros-com-portas-de-bater": { name: "Roupeiros com Portas de Bater", slug: "roupeiros-com-portas-de-bater", count: 26 },
    },
  },
  decoracao: {
    name: "Decoração",
    slug: "decoracao",
    count: 120,
    icon: Lamp,
    children: {
      "tapetes": { name: "Tapetes", slug: "tapetes", count: 30 },
      "candeeiros-de-mesa": { name: "Candeeiros de Mesa", slug: "candeeiros-de-mesa", count: 29 },
      "candeeiros-de-teto": { name: "Candeeiros de Teto", slug: "candeeiros-de-teto", count: 25 },
    },
  },
};

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Sofás": Sofa,
  "Salas": UtensilsCrossed,
  "Quartos": Bed,
  "Cadeiras": Armchair,
  "Arrumação": Package,
  "Decoração": Lamp,
  "Colchões": Bed,
  "Escritório": Package,
};

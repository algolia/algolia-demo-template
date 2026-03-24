import type { User, PreferenceKey, PreferenceMetadata } from "@/lib/types/user";

export const users: User[] = [
  {
    id: "1",
    description: "Familia con ni\u00f1os",
    slug: "familia-con-ninos",
    preferences: {
      "categories.lvl0": {
        Despensa: 10,
        Infantil: 8,
      },
      "categories.lvl1": {
        "L\u00e1cteos y huevos": 8,
        "Desayuno, dulces y caf\u00e9": 6,
        "Alimentaci\u00f3n infantil": 7,
      },
      brand: {
        PASCUAL: 5,
        NESQUIK: 4,
      },
    },
  },
  {
    id: "2",
    description: "Vegano",
    slug: "vegano",
    preferences: {
      // "categories.lvl0": {
      //   Frescos: 10,
      //   "Ecol\u00f3gico y saludable": 8,
      // },
      // "categories.lvl1": {
      //   Verduras: 10,
      //   Frutas: 8,
      // },
      "categories.lvl2": {
        "Bebidas vegetales": 10,
      },
    },
  },
  {
    id: "3",
    description: "Ahorro m\u00e1ximo",
    slug: "ahorro-maximo",
    preferences: {
      "categories.lvl0": {
        "Ahora m\u00e1s barato": 10,
      },
      groups: {
        "\u00a1As\u00ed se ahorra en Consum!": 10,
        "Ofertas a 1\u20ac, 2\u20ac y 3\u20ac": 8,
      },
      promotions: {
        "Ahora m\u00e1s barato": 10,
      },
    },
  },
];

export const PREFERENCE_METADATA: Record<PreferenceKey, PreferenceMetadata> = {
  "categories.lvl0": {
    title: "Categor\u00edas principales",
    icon: "layers",
  },
  "categories.lvl1": {
    title: "Subcategor\u00edas",
    icon: "tag",
  },
  "categories.lvl2": {
    title: "Categor\u00edas espec\u00edficas",
    icon: "tag",
  },
  "hierarchicalCategories.lvl0": {
    title: "Categor\u00edas principales",
    icon: "layers",
  },
  "hierarchicalCategories.lvl1": {
    title: "Subcategor\u00edas (Lvl 1)",
    icon: "layers",
  },
  "hierarchicalCategories.lvl2": {
    title: "Subcategor\u00edas (Lvl 2)",
    icon: "layers",
  },
  "hierarchicalCategories.lvl3": {
    title: "Subcategor\u00edas (Lvl 3)",
    icon: "layers",
  },
  brand: {
    title: "Marcas",
    icon: "tag",
  },
  groups: {
    title: "Grupos",
    icon: "target",
  },
  promotions: {
    title: "Promociones",
    icon: "package",
  },
};

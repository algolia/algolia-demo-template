/**
 * Demo user profiles — citizen personas for GenCat
 */
import type { User, PreferenceKey, PreferenceMetadata } from "@/lib/types/user";

export const users: User[] = [
  {
    id: "1",
    description: "Família amb fills en edat escolar",
    slug: "familia-escolar",
    preferences: {
      "hierarchical_categories.lvl0": {
        "Ensenyament": 20,
        "Educació": 18,
      },
      ambitoLabel: {
        "Ensenyament": 20,
        "Educació": 18,
        "Joventut": 12,
      },
    },
  },
  {
    id: "2",
    description: "Emprenedor buscant ajudes",
    slug: "emprenedor",
    preferences: {
      "hierarchical_categories.lvl0": {
        "Empresa": 20,
        "Economia": 15,
        "Treball": 12,
      },
      ambitoLabel: {
        "Empresa": 20,
        "Economia": 15,
        "Finançament Empresarial": 18,
      },
    },
  },
  {
    id: "3",
    description: "Persona buscant feina",
    slug: "buscant-feina",
    preferences: {
      "hierarchical_categories.lvl0": {
        "Treball": 20,
        "Administració Pública (EAPC)": 15,
      },
      ambitoLabel: {
        "Treball": 20,
        "Ocupació (DIXIT)": 18,
        "Administració Pública (EAPC)": 15,
      },
    },
  },
  {
    id: "4",
    description: "Visitant nou",
    slug: "visitant-nou",
    preferences: {},
  },
];

export const PREFERENCE_METADATA: Record<PreferenceKey, PreferenceMetadata> = {
  "hierarchical_categories.lvl0": {
    title: "Tema principal",
    icon: "layers",
  },
  "hierarchical_categories.lvl1": {
    title: "Subtema",
    icon: "layers",
  },
  ambitoLabel: {
    title: "Àmbit",
    icon: "tag",
  },
  lang: {
    title: "Idioma",
    icon: "globe",
  },
  siteDomain: {
    title: "Lloc web",
    icon: "building",
  },
};

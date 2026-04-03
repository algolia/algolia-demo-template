/**
 * Demo user profiles and preference metadata
 *
 * Edit this file to define personas for demonstrating personalization.
 * Each user has preference weights (0-20) for various product attributes.
 */
import type { User, PreferenceKey, PreferenceMetadata } from "@/lib/types/user";

// ============================================================================
// Demo User Profiles
// ============================================================================

/**
 * Demo users for showcasing personalization features.
 *
 * Each user's preferences map to Algolia facet attributes.
 * Higher scores (0-20) indicate stronger preference.
 *
 * Replace these with profiles relevant to your demo.
 */
export const users: User[] = [
  {
    id: "1",
    description: "Nuovo proprietario cucciolo",
    slug: "new-puppy-owner",
    preferences: {
      categoryPageId: {
        "Cane > Cibo Secco": 18,
        "Cane > Snack": 15,
        "Cane > Giochi": 16,
      },
      "età.value": { PUPPY: 20 },
      brand: { "ROYAL CANIN": 17 },
    },
  },
  {
    id: "2",
    description: "Proprietario cane anziano",
    slug: "senior-dog-owner",
    preferences: {
      categoryPageId: {
        "Cane > Diete Cibo Secco": 20,
        "Cane > Antiparassitari e Curativi": 18,
      },
      "età.value": { ANZIANO: 20 },
      "funzione.value": { "CONTROLLO DEL PESO": 18 },
      brand: { "ROYAL CANIN": 17 },
    },
  },
];

// ============================================================================
// Preference Metadata
// ============================================================================

/**
 * Maps preference keys to human-readable titles and icons.
 * Used in the "For You" filter section and personalization badges.
 */
export const PREFERENCE_METADATA: Record<PreferenceKey, PreferenceMetadata> = {
  "categories.lvl0": {
    title: "Categorie principali",
    icon: "layers",
  },
  "categories.lvl1": {
    title: "Sottocategorie",
    icon: "tag",
  },
  "categories.lvl2": {
    title: "Categorie specifiche",
    icon: "tag",
  },
  "hierarchical_categories.lvl0": {
    title: "Animale",
    icon: "layers",
  },
  "hierarchical_categories.lvl1": {
    title: "Tipo prodotto",
    icon: "layers",
  },
  "hierarchical_categories.lvl2": {
    title: "Sottocategoria",
    icon: "layers",
  },
  "hierarchical_categories.lvl3": {
    title: "Dettaglio",
    icon: "layers",
  },
  categoryPageId: {
    title: "Categorie",
    icon: "layers",
  },
  brand: {
    title: "Marche",
    icon: "tag",
  },
  characteristics: {
    title: "Caratteristiche",
    icon: "target",
  },
  format: {
    title: "Formato",
    icon: "package",
  },
  "età.value": {
    title: "Età",
    icon: "calendar",
  },
  "funzione.value": {
    title: "Funzione",
    icon: "target",
  },
  "formato.value": {
    title: "Formato prodotto",
    icon: "package",
  },
};

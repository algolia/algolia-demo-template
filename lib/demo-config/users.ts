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
    description: "Maria — Luna's owner",
    slug: "maria-luna",
    pet: {
      name: "Luna",
      species: "cane",
      breed: "Golden Retriever",
      ageMonths: 96,
      ageLabel: "Senior — 8 anni",
      size: "GRANDE",
    },
    segments: ["senior_owner", "cane_grande"],
    preferences: {
      categoryPageId: {
        "Cane > Cibo Secco": 18,
        "Cane > Snack": 15,
        "Cane > Giochi": 16,
      },
      "età.value": { ANZIANO: 10 },
      "taglia.value": { GRANDE: 18 },
      age_bucket: { "8+": 20, "7+": 18 },
      brand: { "ROYAL CANIN": 8 },
      "funzione.value": { DIGESTIONE: 15, "SENSIBILITA'": 12 },
    },
  },
  {
    id: "2",
    description: "Luca — Rocco & Milo",
    slug: "luca-rocco-milo",
    pet: {
      name: "Rocco",
      species: "cane",
      breed: "Labrador Retriever",
      ageMonths: 96,
      ageLabel: "Anziano — 8 anni",
      size: "GRANDE",
    },
    pets: [
      {
        name: "Milo",
        species: "cane",
        breed: "Beagle",
        ageMonths: 4,
        ageLabel: "Cucciolo — 4 mesi",
        size: "MEDIA",
      },
    ],
    segments: ["puppy_owner", "senior_dog_owner"],
    preferences: {
      categoryPageId: {
        "Cane > Cibo Secco": 18,
        "Cane > Snack": 14,
        "Cane > Antiparassitari e Curativi": 16,
      },
      "età.value": { PUPPY: 10, ANZIANO: 10 },
      "taglia.value": { GRANDE: 16, MEDIA: 16, "TUTTE LE TAGLIE": 8 },
      age_bucket: { "8+": 18, "7+": 16, "0+": 18 },
      brand: { "ROYAL CANIN": 8, "HILL'S": 8 },
      "funzione.value": { CRESCITA: 14, "CONTROLLO DEL PESO": 16 },
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
  "taglia.value": {
    title: "Taglia",
    icon: "tag",
  },
  age_bucket: {
    title: "Fascia d'età",
    icon: "calendar",
  },
};

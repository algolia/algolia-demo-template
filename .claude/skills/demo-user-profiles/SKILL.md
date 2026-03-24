---
name: demo-user-profiles
description: 'Generate demo user personas with personalization preference weights. Use when creating or updating user profiles for demonstrating personalized search, AI agent context, and "For You" recommendations.'
---

# Demo User Profiles

Generate demo user personas with preference weights for personalization features.

## Prerequisites

- Dependencies installed (`pnpm install`)
- Ideally, data is indexed so you know what facet values exist. Can also work from schema knowledge if the data structure is known.

## Inputs Needed

Ask the user for:
1. **Vertical and product attributes** — what facets exist in the index?
2. **Target personas** — who are the demo users? (e.g. "fitness enthusiast", "budget shopper", "luxury buyer")

## Step 1: Define User Profiles in `lib/demo-config/users.ts`

Each user has an id, description, URL slug, and preference weights:

```typescript
export const users: User[] = [
  {
    id: "1",
    description: "Fitness Enthusiast",  // Shown in user selector UI
    slug: "fitness-enthusiast",          // Used in /user/[id] URL
    preferences: {
      "hierarchical_categories.lvl0": { "Sportswear": 20, "Shoes": 15 },
      "hierarchical_categories.lvl1": { "Running": 18, "Training": 14 },
      brand: { "Nike": 20, "Adidas": 17 },
    },
  },
  {
    id: "2",
    description: "New Visitor",
    slug: "new-visitor",
    preferences: {},  // Empty = no personalization boost
  },
];
```

### Preference weights

- Scores range from **0 to 20** (higher = stronger preference)
- Keys are Algolia facet attribute names
- Values are `{ "Facet Value": score }` objects
- Facet values must match exactly what's in the Algolia index

### Available preference keys

Defined in `lib/types/user.ts` as the `User` interface:

| Key | Description |
|-----|-------------|
| `categories.lvl0` | Flat categories level 0 |
| `categories.lvl1` | Flat categories level 1 |
| `categories.lvl2` | Flat categories level 2 |
| `hierarchical_categories.lvl0` | Hierarchical categories level 0 |
| `hierarchical_categories.lvl1` | Hierarchical categories level 1 |
| `hierarchical_categories.lvl2` | Hierarchical categories level 2 |
| `hierarchical_categories.lvl3` | Hierarchical categories level 3 |
| `brand` | Brand name |
| `characteristics` | Product characteristics |
| `format` | Product format |

### Extending with new facet keys

If the index uses facets not listed above, you must update `lib/types/user.ts`:

1. Add the new key to the `User.preferences` interface
2. Add it to `PREFERENCE_METADATA` in `users.ts`

## Step 2: Update `PREFERENCE_METADATA`

Maps preference keys to display labels and icons for the UI:

```typescript
export const PREFERENCE_METADATA: Record<PreferenceKey, PreferenceMetadata> = {
  "hierarchical_categories.lvl0": { title: "Main Categories", icon: "layers" },
  brand: { title: "Brands", icon: "tag" },
  characteristics: { title: "Characteristics", icon: "target" },
  // ... must cover every key used in user preferences
};
```

Available icons: `"layers"`, `"tag"`, `"calendar"`, `"target"`, `"package"`.

## How Personalization Works

Understanding the pipeline helps create effective profiles:

1. **User selects a profile** via `/user/[id]` page → `UserProvider` in `components/user/user-context.tsx` sets the current user
2. **Filters are computed** — `personalizationFilters` transforms preferences into Algolia format: `"facetName:value<score=N>"`
   - Example: `["hierarchical_categories.lvl0:Sportswear<score=20>", "brand:Nike<score=20>"]`
3. **Search results are boosted** — filters are passed as `optionalFilters` to the Composition API via `PersonalizedConfigure` in `components/providers.tsx`
4. **Agent receives preferences** — user preferences are injected into the agent's context snapshot, so the AI assistant knows what the user likes
5. **"For You" filter** — sidebar filter section uses `PREFERENCE_METADATA` to show personalized recommendation badges
6. **Search refresh** — when the user changes, `refresh()` is called to re-run searches with new filters

## Tips for Effective Profiles

- Create 2-4 profiles with distinct preferences to show clear personalization differences
- Include one "New Visitor" profile with empty preferences as a baseline
- Use scores that create visible ranking differences (e.g. 20 vs 5, not 12 vs 11)
- Align preferences with real customer segments for the vertical

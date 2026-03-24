---
name: demo-categories
description: 'Configure category navigation from indexed Algolia data. Parses hierarchical facet values into the category tree for sidebar navigation and category pages. Use after data indexing to set up or update category navigation.'
---

# Demo Categories

Configure the category navigation tree from actual indexed data in Algolia.

## Prerequisites

- Data must be indexed in Algolia (run `/demo-data-indexing` first or have an existing index)
- `lib/algolia-config.ts` has correct `INDEX_NAME`
- Need `hierarchical_categories` facet values — obtain from:
  - Output of `/demo-data-indexing` (which reports all facet values)
  - Algolia dashboard (browse index facets)
  - Query the index directly via search API with facets

## How Category Pages Work

The URL `/category/Women/Leggings` builds the filter `categoryPageId:"Women > Leggings"`.

The `categoryPageId` attribute is a flat array on each product record containing all ancestor paths (e.g. `["Women", "Women > Leggings"]`). This is populated automatically by `scripts/index-data.ts` from `hierarchical_categories`.

The `name` values in `HIERARCHICAL_CATEGORIES` are joined with ` > ` to build the `categoryPageId` filter value. They must be **exact case-sensitive matches** to the Algolia facet values — do not normalize, titlecase, or modify them.

## Step 1: Parse Facet Values into `lib/demo-config/categories.ts`

Given facet values like:
```
Women
Women > Bottoms
Women > Bottoms > Shorts
Men
Men > Tops
Men > Tops > T-Shirts
```

Build the nested TypeScript structure by splitting on ` > `:

```typescript
import { ShoppingBag, Shirt } from "lucide-react";

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
  women: {
    name: "Women",       // MUST match "Women" in Algolia exactly
    slug: "women",
    count: 500,
    icon: ShoppingBag,
    children: {
      bottoms: {
        name: "Bottoms",   // MUST match "Bottoms" in Algolia exactly
        slug: "bottoms",
        count: 100,
        children: {
          shorts: { name: "Shorts", slug: "shorts", count: 30 },
        },
      },
    },
  },
  men: {
    name: "Men",
    slug: "men",
    count: 400,
    icon: Shirt,
    children: {
      tops: {
        name: "Tops",
        slug: "tops",
        count: 150,
        children: {
          "t-shirts": { name: "T-Shirts", slug: "t-shirts", count: 80 },
        },
      },
    },
  },
};
```

### Selecting top-level categories

If there are many top-level categories, pick the **4-8 most representative** ones for the navigation. Include their full subtree. Less important categories can be omitted — they'll still be searchable and filterable, just not in the sidebar nav.

### Slugs

Generate URL-safe slugs from category names: lowercase, spaces to hyphens, remove special characters.

### Counts

Use approximate product counts if available from facet stats. These are displayed in the UI.

## Step 2: Update `CATEGORY_ICONS`

Maps top-level category names to Lucide icons for the filters sidebar:

```typescript
export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Women": ShoppingBag,
  "Men": Shirt,
  "Accessories": Gem,
};
```

- Keys must match `hierarchical_categories.lvl0` values **exactly**
- Import icons from `lucide-react`
- Choose icons that visually represent each category

## Attribute Naming Convention

The template uses **snake_case** for Algolia attribute names:
- `hierarchical_categories.lvl0`, `hierarchical_categories.lvl1`, etc. (for hierarchical facets)
- `categoryPageId` (for category page filtering — flat array, no levels)

Do NOT use camelCase `hierarchicalCategories` — that causes filter mismatches.

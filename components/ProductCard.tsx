/**
 * ContentCard.tsx - Content Display Components for GenCat
 *
 * Government content card variants for search results display.
 * Replaces e-commerce ProductCard with content-focused cards showing
 * title, snippet, source site, topic badge, and external links.
 *
 * COMPONENTS EXPORTED:
 * 1. ProductCard (ContentCard) - Grid view for search results
 * 2. ProductListItem (ContentListItem) - List view for search results
 * 3. CompactProductCard - Compact grid for chat display
 * 4. CompactProductListItem - Compact list for autocomplete
 */

import React, { memo, useMemo } from "react";
import { Product } from "@/lib/types/product";
import { useUser } from "@/components/user/user-context";
import { useSelection } from "@/components/selection/selection-context";
import { Checkbox } from "@/components/ui/checkbox";
import { PreferenceKey, extractProductFieldValues } from "@/lib/types/user";
import { PREFERENCE_METADATA } from "@/lib/demo-config/users";
import { Sparkles, FileText, FileArchive, ExternalLink, Globe } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import { useLanguage } from "@/components/language/language-context";

// ============================================================================
// Helpers
// ============================================================================

function getMimeIcon(mimeType: string) {
  if (mimeType?.includes("pdf")) return FileArchive;
  return FileText;
}

function getHighlightedTitle(page: Product): string {
  const hl = page._highlightResult as any;
  const raw = hl?.title?.value || page.title || "";
  // Ensure <em> tags aren't double-escaped
  return raw.replace(/&lt;em&gt;/g, "<em>").replace(/&lt;\/em&gt;/g, "</em>");
}

function getHighlightedSnippet(page: Product): string {
  const sn = page._snippetResult as any;
  const raw = sn?.snippet?.value || sn?.body?.value || page.snippet || "";
  return raw.replace(/&lt;em&gt;/g, "<em>").replace(/&lt;\/em&gt;/g, "</em>");
}

// ============================================================================
// Personalization Badge
// ============================================================================

interface PersonalizationMatch {
  facetTitle: string;
  value: string;
  score: number;
}

function PersonalizationBadge({ page, compact = false }: { page: Product; compact?: boolean }) {
  const { currentUser } = useUser();
  const { t } = useLanguage();

  const matches = useMemo(() => {
    if (!currentUser?.preferences) return [];
    const found: PersonalizationMatch[] = [];
    (Object.keys(currentUser.preferences) as PreferenceKey[]).forEach((key) => {
      const prefs = currentUser.preferences[key];
      if (!prefs) return;
      const values = extractProductFieldValues(page, key);
      values.forEach((value) => {
        const score = prefs[value];
        if (score !== undefined) {
          found.push({
            facetTitle: PREFERENCE_METADATA[key]?.title || key,
            value,
            score,
          });
        }
      });
    });
    return found;
  }, [currentUser, page]);

  if (matches.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center justify-center rounded-full bg-purple-100 text-purple-700",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}>
            <Sparkles className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-semibold mb-1 text-sm">{t("card.personalizedForYou")}</p>
          {matches.map((m, i) => (
            <div key={i} className="text-xs">
              <span className="text-muted-foreground">{m.facetTitle}:</span>{" "}
              <span className="font-medium">{m.value}</span>
              <span className="text-muted-foreground ml-1">({m.score}/20)</span>
            </div>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Selection Checkbox
// ============================================================================

function SelectionCheckbox({ page }: { page: Product }) {
  const { isSelected, toggleSelection } = useSelection();
  const selected = isSelected(page.objectID);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSelection({
      objectID: page.objectID,
      name: page.title || "Untitled",
    });
  };

  return (
    <div className="absolute top-2 left-2 z-10" onClick={handleToggle}>
      <Checkbox
        checked={selected}
        className={cn(
          "h-5 w-5 bg-background/90 backdrop-blur-sm border-2",
          selected && "border-primary"
        )}
      />
    </div>
  );
}

// ============================================================================
// Topic & Site Badges
// ============================================================================

function ContentBadges({ page, compact = false }: { page: Product; compact?: boolean }) {
  const textSize = compact ? "text-[10px]" : "text-xs";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {page.ambitoLabel && (
        <span className={cn("bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium", textSize)}>
          {page.ambitoLabel}
        </span>
      )}
      {page.siteLabel && (
        <span className={cn("bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1", textSize)}>
          <Globe className="h-3 w-3" />
          {page.siteLabel}
        </span>
      )}
      {page.mimeType?.includes("pdf") && (
        <span className={cn("bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium", textSize)}>
          PDF
        </span>
      )}
    </div>
  );
}

// ============================================================================
// ContentCard (Grid View) — exported as ProductCard for compatibility
// ============================================================================

interface ProductCardProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
  selectable?: boolean;
}

export function ProductCard({ product: page, showBadges = true, selectable = false }: ProductCardProps) {
  const { isSelected } = useSelection();
  const selected = selectable && isSelected(page.objectID);
  const MimeIcon = getMimeIcon(page.mimeType);

  if (!page.objectID) return null;

  return (
    <a
      href={page.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer block relative group",
        selected && "border-2 border-primary"
      )}
    >
      {selectable && <SelectionCheckbox page={page} />}

      {/* Top bar with icon and personalization */}
      <div className="bg-muted/50 px-4 py-3 flex items-center gap-3 border-b">
        <MimeIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground truncate flex-1">
          {page.siteDomain}
        </span>
        {showBadges && <PersonalizationBadge page={page} />}
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      <div className="p-4">
        <h3
          className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors"
          dangerouslySetInnerHTML={{ __html: getHighlightedTitle(page) }}
        />

        <p
          className="text-sm text-muted-foreground mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: getHighlightedSnippet(page) }}
        />

        <ContentBadges page={page} />

        {page.lastIndexed > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {formatDate(page.lastIndexed)}
          </p>
        )}
      </div>
    </a>
  );
}

// ============================================================================
// ContentListItem — exported as ProductListItem for compatibility
// ============================================================================

interface ProductListItemProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
  selectable?: boolean;
}

export function ProductListItem({ product: page, showBadges = true, selectable = false }: ProductListItemProps) {
  if (!page.objectID) return null;

  return (
    <div className="py-6 group">
      <a
        href={page.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="text-lg font-medium text-foreground underline underline-offset-2 decoration-1 group-hover:text-primary transition-colors inline">
          <span dangerouslySetInnerHTML={{ __html: getHighlightedTitle(page) }} />
        </h3>
        <ExternalLink className="inline-block h-4 w-4 text-muted-foreground ml-2 -mt-1 align-middle" />
      </a>

      <p className="text-sm text-muted-foreground mt-1">
        {page.siteDomain}
      </p>

      <p
        className="text-sm text-foreground/80 mt-2 line-clamp-3"
        dangerouslySetInnerHTML={{ __html: getHighlightedSnippet(page) }}
      />
    </div>
  );
}

// ============================================================================
// Compact Content Card (for chat display)
// ============================================================================

interface CompactProductCardProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
}

export const CompactProductCard = memo(function CompactProductCard({
  product: page,
}: CompactProductCardProps) {
  if (!page.objectID) return null;

  return (
    <a
      href={page.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-border rounded-lg overflow-hidden bg-background hover:shadow-md hover:border-primary/50 transition-all duration-200 w-40"
    >
      <div className="p-2">
        <h4 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1">
          {page.title}
        </h4>
        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">
          {page.snippet}
        </p>
        <ContentBadges page={page} compact />
      </div>
    </a>
  );
});

// ============================================================================
// Compact Content List Item (for autocomplete/chat)
// ============================================================================

interface CompactProductListItemProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
  className?: string;
}

export const CompactProductListItem = memo(function CompactProductListItem({
  product: page,
  className = "",
}: CompactProductListItemProps) {
  if (!page.objectID) return null;

  const MimeIcon = getMimeIcon(page.mimeType);

  return (
    <a
      href={page.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all duration-200",
        className
      )}
    >
      <div className="w-10 h-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
        <MimeIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {page.title}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {page.siteLabel || page.siteDomain}
        </p>
      </div>
    </a>
  );
});

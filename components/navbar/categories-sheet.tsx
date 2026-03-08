"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  HIERARCHICAL_CATEGORIES,
  type CategoryNode,
  type RootCategory,
} from "@/lib/demo-config/categories";

const ROOT_CATEGORIES = Object.values(HIERARCHICAL_CATEGORIES);

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}

export function CategoriesSheet() {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [hoveredPath, setHoveredPath] = useState<string[]>([]);
  const [mobilePath, setMobilePath] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const activePath = isMobile ? mobilePath : hoveredPath;

  const getChildrenAtLevel = (level: number): CategoryNode[] | null => {
    if (level === 0) return null;

    let current: CategoryNode | undefined =
      HIERARCHICAL_CATEGORIES[activePath[0]];
    for (let i = 1; i < level && current?.children; i++) {
      current = current.children[activePath[i]];
    }
    return current?.children ? Object.values(current.children) : null;
  };

  const getCurrentCategory = (): CategoryNode | null => {
    if (mobilePath.length === 0) return null;

    let current: CategoryNode | undefined =
      HIERARCHICAL_CATEGORIES[mobilePath[0]];
    for (let i = 1; i < mobilePath.length && current?.children; i++) {
      current = current.children[mobilePath[i]];
    }
    return current ?? null;
  };

  const getCurrentChildren = (): CategoryNode[] | null => {
    const current = getCurrentCategory();
    return current?.children ? Object.values(current.children) : null;
  };

  const handleMouseEnter = (slug: string, level: number) => {
    if (!isMobile) {
      setHoveredPath((prev) => [...prev.slice(0, level), slug]);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoveredPath([]);
    }
  };

  const handleMobileNavigate = (slug: string) => {
    setMobilePath((prev) => [...prev, slug]);
  };

  const handleMobileBack = () => {
    setMobilePath((prev) => prev.slice(0, -1));
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMobilePath([]);
      setHoveredPath([]);
    }
  };

  const handleLinkClick = () => {
    closeRef.current?.click();
  };

  const buildPath = (level: number, slug: string): string => {
    const pathSlugs = [...activePath.slice(0, level), slug];
    const pathNames: string[] = [];

    const rootCategory = HIERARCHICAL_CATEGORIES[pathSlugs[0]];
    if (rootCategory) {
      pathNames.push(rootCategory.name);

      let current: CategoryNode | undefined = rootCategory;
      for (let i = 1; i < pathSlugs.length && current?.children; i++) {
        current = current.children[pathSlugs[i]];
        if (current) {
          pathNames.push(current.name);
        }
      }
    }

    return `/category/${pathNames.join("/")}`;
  };

  const level1Children = getChildrenAtLevel(1);
  const level2Children = getChildrenAtLevel(2);
  const level3Children = getChildrenAtLevel(3);

  // Mobile rendering
  if (isMobile) {
    const currentCategory = getCurrentCategory();
    const currentChildren = getCurrentChildren();
    const isAtRoot = mobilePath.length === 0;

    return (
      <Sheet onOpenChange={handleSheetOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon-lg"
            className="h-10 w-10 cursor-pointer"
            aria-label="Open categories menu"
          >
            <Menu className="size-8" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" showCloseButton={false} className="w-full p-0 sm:w-80">
          <SheetClose ref={closeRef} className="hidden" />
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                {isAtRoot ? (
                  <SheetTitle>Categories</SheetTitle>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8"
                      onClick={handleMobileBack}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Back</span>
                    </Button>
                    <SheetTitle className="text-base">
                      {currentCategory?.name}
                    </SheetTitle>
                  </div>
                )}
                <SheetClose asChild>
                  <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto p-2">
              {isAtRoot ? (
                // Root level categories
                <ul className="space-y-1">
                  {ROOT_CATEGORIES.map((category) => {
                    const IconComponent = category.icon;
                    const hasChildren = !!category.children;
                    return (
                      <li key={category.slug}>
                        {hasChildren ? (
                          <button
                            onClick={() => handleMobileNavigate(category.slug)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted"
                          >
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-primary" />
                              <span className="font-medium">
                                {category.name}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ) : (
                          <Link
                            href={`/category/${category.name}`}
                            onClick={handleLinkClick}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted"
                          >
                            <IconComponent className="h-5 w-5 text-primary" />
                            <span className="font-medium">{category.name}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                // Nested categories
                <ul className="space-y-1">
                  {/* "View all" link for current category */}
                  <li>
                    <Link
                      href={buildPath(mobilePath.length, mobilePath[mobilePath.length - 1])}
                      onClick={handleLinkClick}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
                    >
                      <span>View all</span>
                      {currentCategory?.count && (
                        <span className="text-xs text-muted-foreground">
                          {currentCategory.count}
                        </span>
                      )}
                    </Link>
                  </li>
                  {currentChildren?.map((category) => {
                    const hasChildren = !!category.children;
                    return (
                      <li key={category.slug}>
                        {hasChildren ? (
                          <button
                            onClick={() => handleMobileNavigate(category.slug)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                          >
                            <span>{category.name}</span>
                            <div className="flex items-center gap-2">
                              {category.count && (
                                <span className="text-xs text-muted-foreground">
                                  {category.count}
                                </span>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        ) : (
                          <Link
                            href={buildPath(mobilePath.length, category.slug)}
                            onClick={handleLinkClick}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                          >
                            <span>{category.name}</span>
                            {category.count && (
                              <span className="text-xs text-muted-foreground">
                                {category.count}
                              </span>
                            )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop rendering (unchanged)
  return (
    <Sheet modal={false} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon-lg"
          className="h-10 w-10 cursor-pointer"
          aria-label="Open categories menu"
        >
          <Menu className="size-8" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        style={{ transitionProperty: "opacity, transform" }}
        className={cn(
          "p-0",
          level3Children
            ? "w-[960px]"
            : level2Children
              ? "w-[720px]"
              : level1Children
                ? "w-[480px]"
                : "w-60"
        )}
      >
        <SheetClose ref={closeRef} className="hidden" />
        <div className="flex h-full" onMouseLeave={handleMouseLeave}>
          {/* Level 0 - Root categories */}
          <div className="flex w-60 shrink-0 flex-col border-r">
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <SheetTitle>Categories</SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {ROOT_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  const isActive = hoveredPath[0] === category.slug;
                  const hasChildren = !!category.children;
                  return (
                    <li key={category.slug} onMouseEnter={() => handleMouseEnter(category.slug, 0)}>
                      <Link
                        href={`/category/${category.name}`}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                        onClick={handleLinkClick}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        {hasChildren && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Level 1 */}
          {level1Children && (
            <div className="flex w-60 shrink-0 flex-col border-r bg-white">
              <div className="border-b p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {HIERARCHICAL_CATEGORIES[hoveredPath[0]]?.name}
                </h3>
              </div>
              <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  {level1Children.map((category) => {
                    const isActive = hoveredPath[1] === category.slug;
                    const hasChildren = !!category.children;
                    return (
                      <li key={category.slug} onMouseEnter={() => handleMouseEnter(category.slug, 1)}>
                        <Link
                          href={buildPath(1, category.slug)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                          onClick={handleLinkClick}
                        >
                          <span>{category.name}</span>
                          <div className="flex items-center gap-2">
                            {category.count && (
                              <span className="text-xs text-muted-foreground">
                                {category.count}
                              </span>
                            )}
                            {hasChildren && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          )}

          {/* Level 2 */}
          {level2Children && (
            <div className="flex w-60 shrink-0 flex-col border-r bg-white">
              <div className="border-b p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {
                    getChildrenAtLevel(1)?.find(
                      (c) => c.slug === hoveredPath[1]
                    )?.name
                  }
                </h3>
              </div>
              <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  {level2Children.map((category) => {
                    const isActive = hoveredPath[2] === category.slug;
                    const hasChildren = !!category.children;
                    return (
                      <li key={category.slug} onMouseEnter={() => handleMouseEnter(category.slug, 2)}>
                        <Link
                          href={buildPath(2, category.slug)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                          onClick={handleLinkClick}
                        >
                          <span>{category.name}</span>
                          <div className="flex items-center gap-2">
                            {category.count && (
                              <span className="text-xs text-muted-foreground">
                                {category.count}
                              </span>
                            )}
                            {hasChildren && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          )}

          {/* Level 3 */}
          {level3Children && (
            <div className="flex w-60 shrink-0 flex-col bg-white">
              <div className="border-b p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {
                    getChildrenAtLevel(2)?.find(
                      (c) => c.slug === hoveredPath[2]
                    )?.name
                  }
                </h3>
              </div>
              <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  {level3Children.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={buildPath(3, category.slug)}
                        onClick={handleLinkClick}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <span>{category.name}</span>
                        {category.count && (
                          <span className="text-xs text-muted-foreground">
                            {category.count}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
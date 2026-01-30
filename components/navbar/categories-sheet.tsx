"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  HeartPulse,
  Dumbbell,
  Apple,
  ShoppingBag,
  FlaskConical,
  Tag,
  Sparkles,
  Percent,
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

type CategoryNode = {
  name: string;
  slug: string;
  count?: number;
  children?: Record<string, CategoryNode>;
};

type RootCategory = CategoryNode & {
  icon: React.ComponentType<{ className?: string }>;
};

const HIERARCHICAL_CATEGORIES: Record<string, RootCategory> = {
  "salud-y-bienestar": {
    name: "Salud y bienestar",
    slug: "salud-y-bienestar",
    count: 2450,
    icon: HeartPulse,
    children: {
      vitaminas: {
        name: "Vitaminas",
        slug: "vitaminas",
        count: 320,
        children: {
          "vitamina-c": { name: "Vitamina C", slug: "vitamina-c", count: 45 },
          "vitamina-d": { name: "Vitamina D", slug: "vitamina-d", count: 38 },
          "vitamina-b": { name: "Vitamina B", slug: "vitamina-b", count: 52 },
          multivitaminicos: { name: "Multivitamínicos", slug: "multivitaminicos", count: 85 },
          liposomada: { name: "Liposomada", slug: "liposomada", count: 28 },
        },
      },
      minerales: {
        name: "Minerales",
        slug: "minerales",
        count: 180,
        children: {
          magnesio: { name: "Magnesio", slug: "magnesio", count: 45 },
          zinc: { name: "Zinc", slug: "zinc", count: 32 },
          hierro: { name: "Hierro", slug: "hierro", count: 28 },
          calcio: { name: "Calcio", slug: "calcio", count: 35 },
        },
      },
      "sistema-inmune": { name: "Sistema inmune", slug: "sistema-inmune", count: 156 },
      antioxidantes: { name: "Antioxidantes", slug: "antioxidantes", count: 142 },
      digestion: {
        name: "Digestión",
        slug: "digestion",
        count: 198,
        children: {
          probioticos: { name: "Probióticos", slug: "probioticos", count: 65 },
          enzimas: { name: "Enzimas", slug: "enzimas", count: 42 },
          "flora-intestinal": { name: "Flora Intestinal", slug: "flora-intestinal", count: 48 },
        },
      },
      "huesos-y-articulaciones": { name: "Huesos y articulaciones", slug: "huesos-y-articulaciones", count: 175 },
      "extractos-y-plantas": { name: "Extractos y plantas", slug: "extractos-y-plantas", count: 220 },
      "acidos-grasos-esenciales": { name: "Ácidos grasos esenciales", slug: "acidos-grasos-esenciales", count: 145 },
      "especial-mujer": {
        name: "Especial mujer",
        slug: "especial-mujer",
        count: 168,
        children: {
          menopausia: { name: "Menopausia", slug: "menopausia", count: 42 },
          menstruacion: { name: "Menstruación", slug: "menstruacion", count: 35 },
          "pre-post-natal": { name: "Pre/post natal", slug: "pre-post-natal", count: 28 },
        },
      },
      "especial-hombre": { name: "Especial hombre", slug: "especial-hombre", count: 95 },
      "especial-seniors": { name: "Especial seniors", slug: "especial-seniors", count: 78 },
      "sueno-descanso": { name: "Sueño/Descanso", slug: "sueno-descanso", count: 86 },
      "estres-y-ansiedad": { name: "Estrés y ansiedad", slug: "estres-y-ansiedad", count: 72 },
      "piel-pelo-y-unas": { name: "Piel, pelo y uñas", slug: "piel-pelo-y-unas", count: 94 },
      colesterol: { name: "Colesterol", slug: "colesterol", count: 56 },
      "circulacion-corazon": { name: "Circulación-corazón", slug: "circulacion-corazon", count: 68 },
    },
  },
  "nutricion-deportiva": {
    name: "Nutrición deportiva",
    slug: "nutricion-deportiva",
    count: 1850,
    icon: Dumbbell,
    children: {
      proteinas: {
        name: "Proteínas",
        slug: "proteinas",
        count: 420,
        children: {
          "whey-protein": { name: "Whey protein", slug: "whey-protein", count: 95 },
          "proteinas-aisladas": { name: "Proteínas aisladas", slug: "proteinas-aisladas", count: 72 },
          "proteinas-concentradas": { name: "Proteínas concentradas", slug: "proteinas-concentradas", count: 58 },
          "proteinas-vegetales": { name: "Proteínas vegetales", slug: "proteinas-vegetales", count: 65 },
          caseinas: { name: "Caseínas", slug: "caseinas", count: 42 },
          "proteinas-hidrolizadas": { name: "Proteínas hidrolizadas", slug: "proteinas-hidrolizadas", count: 38 },
        },
      },
      aminoacidos: {
        name: "Aminoácidos",
        slug: "aminoacidos",
        count: 285,
        children: {
          bcaas: { name: "BCAA's", slug: "bcaas", count: 68 },
          eaas: { name: "EAA's", slug: "eaas", count: 45 },
          glutamina: { name: "Glutamina", slug: "glutamina", count: 52 },
          "aminoacidos-aislados": { name: "Aminoácidos aislados", slug: "aminoacidos-aislados", count: 78 },
        },
      },
      creatina: { name: "Creatina", slug: "creatina", count: 125 },
      "pre-entrenamiento": { name: "Pre-entrenamiento", slug: "pre-entrenamiento", count: 165 },
      "post-entrenamiento": { name: "Post-entrenamiento", slug: "post-entrenamiento", count: 98 },
      "intra-entrenamiento": { name: "Intra-entrenamiento", slug: "intra-entrenamiento", count: 72 },
      carbohidratos: {
        name: "Carbohidratos",
        slug: "carbohidratos",
        count: 145,
        children: {
          "alto-indice-glucemico": { name: "Alto índice glucémico", slug: "alto-indice-glucemico", count: 48 },
          "mezcla-secuencial": { name: "Mezcla secuencial carbohidratos", slug: "mezcla-secuencial", count: 35 },
        },
      },
      "ganadores-de-peso": { name: "Ganadores de peso", slug: "ganadores-de-peso", count: 86 },
      quemadores: { name: "Quemadores", slug: "quemadores", count: 142 },
      "anabolicos-naturales": { name: "Anabólicos naturales", slug: "anabolicos-naturales", count: 78 },
      hmb: { name: "HMB", slug: "hmb", count: 32 },
      zma: { name: "ZMA", slug: "zma", count: 28 },
      "energizantes-naturales": { name: "Energizantes naturales", slug: "energizantes-naturales", count: 65 },
    },
  },
  "alimentacion-saludable": {
    name: "Alimentación saludable",
    slug: "alimentacion-saludable",
    count: 1120,
    icon: Apple,
    children: {
      "barritas": {
        name: "Barritas",
        slug: "barritas",
        count: 185,
        children: {
          "barritas-de-proteinas": { name: "Barritas de proteínas", slug: "barritas-de-proteinas", count: 95 },
          "barritas-energeticas": { name: "Barritas energéticas", slug: "barritas-energeticas", count: 62 },
        },
      },
      snacks: { name: "Snacks", slug: "snacks", count: 156 },
      "mantequillas-y-cremas": { name: "Mantequillas y cremas", slug: "mantequillas-y-cremas", count: 98 },
      harinas: { name: "Harinas", slug: "harinas", count: 125 },
      edulcorantes: { name: "Edulcorantes", slug: "edulcorantes", count: 78 },
      siropes: { name: "Siropes", slug: "siropes", count: 65 },
      salsas: { name: "Salsas", slug: "salsas", count: 52 },
      "cereales-y-semillas": { name: "Cereales y semillas", slug: "cereales-y-semillas", count: 88 },
      superalimentos: { name: "Superalimentos", slug: "superalimentos", count: 94 },
      "platos-preparados": { name: "Platos preparados", slug: "platos-preparados", count: 45 },
      cafes: { name: "Cafés", slug: "cafes", count: 38 },
      "tes-e-infusiones": { name: "Tés e infusiones", slug: "tes-e-infusiones", count: 56 },
      diabeticos: { name: "Diabéticos", slug: "diabeticos", count: 42 },
      "dieta-keto": { name: "Dieta keto", slug: "dieta-keto", count: 68 },
    },
  },
  accesorios: {
    name: "Accesorios",
    slug: "accesorios",
    count: 380,
    icon: ShoppingBag,
    children: {
      "mezcladores-y-botellas": { name: "Mezcladores y botellas deportivas", slug: "mezcladores-y-botellas", count: 125 },
      "mochilas-y-bolsas": { name: "Mochilas y bolsas deportivas", slug: "mochilas-y-bolsas", count: 48 },
      "ropa-deportiva": { name: "Ropa deportiva", slug: "ropa-deportiva", count: 95 },
      "toallas-deportivas": { name: "Toallas deportivas", slug: "toallas-deportivas", count: 32 },
      pastilleros: { name: "Pastilleros", slug: "pastilleros", count: 42 },
      "otros-accesorios": { name: "Otros accesorios", slug: "otros-accesorios", count: 38 },
    },
  },
  ingredientes: {
    name: "Ingredientes",
    slug: "ingredientes",
    count: 520,
    icon: FlaskConical,
    children: {
      aceites: {
        name: "Aceites",
        slug: "aceites",
        count: 145,
        children: {
          "aceites-esenciales": { name: "Aceites esenciales", slug: "aceites-esenciales", count: 68 },
        },
      },
      "algas-y-hongos": { name: "Algas y hongos", slug: "algas-y-hongos", count: 78 },
      saborizantes: { name: "Saborizantes", slug: "saborizantes", count: 52 },
      espesantes: { name: "Espesantes", slug: "espesantes", count: 35 },
      "plantas-en-bolsa": { name: "Plantas en bolsa", slug: "plantas-en-bolsa", count: 95 },
      sazonadores: { name: "Sazonadores", slug: "sazonadores", count: 42 },
      "micronutrientes-naturales": { name: "Micronutrientes naturales", slug: "micronutrientes-naturales", count: 73 },
    },
  },
  especialidades: {
    name: "Especialidades",
    slug: "especialidades",
    count: 285,
    icon: Sparkles,
    children: {
      "control-de-peso": {
        name: "Control de peso",
        slug: "control-de-peso",
        count: 165,
        children: {
          "control-del-apetito": { name: "Control del apetito", slug: "control-del-apetito", count: 42 },
          "bloqueadores-grasas": { name: "Bloqueadores grasas", slug: "bloqueadores-grasas", count: 35 },
          diureticos: { name: "Diuréticos", slug: "diureticos", count: 28 },
          depurativos: { name: "Depurativos", slug: "depurativos", count: 32 },
          "cremas-reductoras": { name: "Cremas reductoras", slug: "cremas-reductoras", count: 28 },
        },
      },
      "sustitutos-de-comida": { name: "Sustitutos de comida", slug: "sustitutos-de-comida", count: 58 },
      nutricosmetica: { name: "Nutricosmética", slug: "nutricosmetica", count: 62 },
    },
  },
  promociones: {
    name: "Promociones",
    slug: "promociones",
    count: 450,
    icon: Percent,
    children: {
      "packs-ahorro": { name: "Packs ahorro", slug: "packs-ahorro", count: 125 },
      "packs-nutricion-deportiva": { name: "Packs nutrición deportiva", slug: "packs-nutricion-deportiva", count: 85 },
      "packs-salud-y-bienestar": { name: "Packs salud y bienestar", slug: "packs-salud-y-bienestar", count: 72 },
      "packs-regalo": { name: "Packs regalo", slug: "packs-regalo", count: 48 },
      "flash-promo": { name: "Flash Promo", slug: "flash-promo", count: 65 },
      "black-friday": { name: "Black Friday", slug: "black-friday", count: 55 },
    },
  },
};

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

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setMobilePath([]);
      setHoveredPath([]);
    }
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
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                {isAtRoot ? (
                  <SheetTitle>Categorie</SheetTitle>
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
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
                    >
                      <span>Vedi tutti</span>
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
      <SheetContent
        side="left"
        showCloseButton={false}
        className={cn(
          "p-0 transition-all duration-200",
          level3Children
            ? "w-[960px]"
            : level2Children
              ? "w-[720px]"
              : level1Children
                ? "w-[480px]"
                : "w-60"
        )}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex h-full">
          {/* Level 0 - Root categories */}
          <div className="flex w-60 shrink-0 flex-col border-r">
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <SheetTitle>Categorie</SheetTitle>
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
                    <li key={category.slug}>
                      <Link
                        href={`/category/${category.name}`}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                        onMouseEnter={() => handleMouseEnter(category.slug, 0)}
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
                      <li key={category.slug}>
                        <Link
                          href={buildPath(1, category.slug)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                          onMouseEnter={() =>
                            handleMouseEnter(category.slug, 1)
                          }
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
                      <li key={category.slug}>
                        <Link
                          href={buildPath(2, category.slug)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                          onMouseEnter={() =>
                            handleMouseEnter(category.slug, 2)
                          }
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
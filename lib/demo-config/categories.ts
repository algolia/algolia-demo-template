import {
  Leaf,
  Package,
  GlassWater,
  Snowflake,
  SprayCan,
  Heart,
  Sprout,
  CakeSlice,
  Baby,
  PawPrint,
  ShoppingBag,
  UtensilsCrossed,
  Percent,
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
  frescos: {
    name: "Frescos",
    slug: "frescos",
    icon: Leaf,
    children: {
      verduras: { name: "Verduras", slug: "verduras" },
      frutas: { name: "Frutas", slug: "frutas" },
      carniceria: { name: "Carnicería", slug: "carniceria" },
      "carniceria-corte": { name: "Carnicería corte", slug: "carniceria-corte" },
      charcuteria: { name: "Charcutería", slug: "charcuteria" },
      "charcuteria-corte": { name: "Charcutería corte", slug: "charcuteria-corte" },
      pescaderia: { name: "Pescadería", slug: "pescaderia" },
      quesos: { name: "Quesos", slug: "quesos" },
      "quesos-corte": { name: "Quesos corte", slug: "quesos-corte" },
    },
  },
  despensa: {
    name: "Despensa",
    slug: "despensa",
    icon: Package,
    children: {
      "desayuno-dulces-y-cafe": {
        name: "Desayuno, dulces y café",
        slug: "desayuno-dulces-y-cafe",
        children: {
          "chocolates-y-bombones": { name: "Chocolates y bombones", slug: "chocolates-y-bombones" },
        },
      },
      "conservas-aceites-y-condimentos": { name: "Conservas, aceites y condimentos", slug: "conservas-aceites-y-condimentos" },
      "lacteos-y-huevos": { name: "Lácteos y huevos", slug: "lacteos-y-huevos" },
      "aperitivos-y-frutos-secos": { name: "Aperitivos y frutos secos", slug: "aperitivos-y-frutos-secos" },
      "arroz-pastas-legumbres": { name: "Arroz, pastas, legumbres", slug: "arroz-pastas-legumbres" },
      "panes-y-tostadas": { name: "Panes y tostadas", slug: "panes-y-tostadas" },
      "caldos-sopas-y-pures": { name: "Caldos, sopas y purés", slug: "caldos-sopas-y-pures" },
      "nutricion-y-dietetica": { name: "Nutrición y dietética", slug: "nutricion-y-dietetica" },
      "cocina-internacional": { name: "Cocina internacional", slug: "cocina-internacional" },
      "harina-levadura-y-pan-rallado": { name: "Harina, levadura y pan rallado", slug: "harina-levadura-y-pan-rallado" },
    },
  },
  bebidas: {
    name: "Bebidas",
    slug: "bebidas",
    icon: GlassWater,
    children: {
      vinos: { name: "Vinos", slug: "vinos" },
      licores: { name: "Licores", slug: "licores" },
      cervezas: { name: "Cervezas", slug: "cervezas" },
      refrescos: { name: "Refrescos", slug: "refrescos" },
      "zumos-y-nectares": { name: "Zumos y néctares", slug: "zumos-y-nectares" },
      "cavas-y-sidras": { name: "Cavas y sidras", slug: "cavas-y-sidras" },
      aguas: { name: "Aguas", slug: "aguas" },
      "isotonicas-y-energeticas": { name: "Isotónicas y energéticas", slug: "isotonicas-y-energeticas" },
      "sangrias-y-combinados": { name: "Sangrías y combinados base vino", slug: "sangrias-y-combinados" },
      "gaseosas-y-sodas": { name: "Gaseosas y sodas", slug: "gaseosas-y-sodas" },
    },
  },
  "congelados-y-helados": {
    name: "Congelados y helados",
    slug: "congelados-y-helados",
    icon: Snowflake,
    children: {
      helados: { name: "Helados", slug: "helados" },
      "pescados-y-mariscos": { name: "Pescados y mariscos", slug: "pescados-y-mariscos" },
      "frutas-y-verduras": { name: "Frutas y Verduras", slug: "frutas-y-verduras" },
      "platos-preparados": { name: "Platos preparados", slug: "platos-preparados" },
      rebozados: { name: "Rebozados", slug: "rebozados" },
      "pizza-y-bases": { name: "Pizza y bases congeladas", slug: "pizza-y-bases" },
      carnes: { name: "Carnes", slug: "carnes" },
    },
  },
  "drogueria-y-limpieza": {
    name: "Droguería y limpieza",
    slug: "drogueria-y-limpieza",
    icon: SprayCan,
    children: {
      "limpieza-hogar": { name: "Limpieza hogar", slug: "limpieza-hogar" },
      "cuidado-ropa": { name: "Cuidado ropa", slug: "cuidado-ropa" },
      "accesorios-limpieza": { name: "Accesorios y utensilios limpieza", slug: "accesorios-limpieza" },
      ambientadores: { name: "Ambientadores", slug: "ambientadores" },
      celulosa: { name: "Celulosa", slug: "celulosa" },
      "limpieza-banos": { name: "Limpieza baños", slug: "limpieza-banos" },
      "limpieza-cocina": { name: "Limpieza cocina", slug: "limpieza-cocina" },
      "limpieza-calzado": { name: "Limpieza calzado y accesorios", slug: "limpieza-calzado" },
      insecticidas: { name: "Insecticidas", slug: "insecticidas" },
    },
  },
  "cuidado-personal": {
    name: "Cuidado personal",
    slug: "cuidado-personal",
    icon: Heart,
    children: {
      maquillaje: { name: "Maquillaje", slug: "maquillaje" },
      "cuidado-del-cabello": { name: "Cuidado del cabello", slug: "cuidado-del-cabello" },
      parafarmacia: { name: "Parafarmacia", slug: "parafarmacia" },
      "colonias-y-perfumes": { name: "Colonias y perfumes", slug: "colonias-y-perfumes" },
      "cuidado-facial": { name: "Cuidado facial", slug: "cuidado-facial" },
      "higiene-bucal": { name: "Higiene bucal", slug: "higiene-bucal" },
      "higiene-intima": { name: "Higiene íntima", slug: "higiene-intima" },
      desodorante: { name: "Desodorante", slug: "desodorante" },
      "higiene-corporal": { name: "Higiene corporal", slug: "higiene-corporal" },
      "cuidado-corporal": { name: "Cuidado corporal", slug: "cuidado-corporal" },
    },
  },
  "ecologico-y-saludable": {
    name: "Ecológico y saludable",
    slug: "ecologico-y-saludable",
    icon: Sprout,
    children: {
      despensa: { name: "Despensa", slug: "despensa" },
      "cuidado-personal": { name: "Cuidado personal", slug: "cuidado-personal" },
      bazar: { name: "Bazar", slug: "bazar" },
      "frescos-y-refrigerados": { name: "Frescos y refrigerados", slug: "frescos-y-refrigerados" },
      "drogueria-y-limpieza": { name: "Droguería y limpieza", slug: "drogueria-y-limpieza" },
    },
  },
  horno: {
    name: "Horno",
    slug: "horno",
    icon: CakeSlice,
    children: {
      "bolleria-dulce": { name: "Bollería dulce", slug: "bolleria-dulce" },
      "bolleria-salada": { name: "Bollería salada", slug: "bolleria-salada" },
      "pan-de-horno": { name: "Pan de horno", slug: "pan-de-horno" },
      "tartas-y-reposteria": { name: "Tartas y repostería", slug: "tartas-y-reposteria" },
      "pan-de-molde": { name: "Pan de molde y rebanado", slug: "pan-de-molde" },
      "pan-hamburguesas": { name: "Pan hamburguesas y perritos", slug: "pan-hamburguesas" },
      "rosquilletas": { name: "Rosquilletas, picos y snacks", slug: "rosquilletas" },
    },
  },
  infantil: {
    name: "Infantil",
    slug: "infantil",
    icon: Baby,
    children: {
      "alimentacion-infantil": { name: "Alimentación infantil", slug: "alimentacion-infantil" },
      higiene: { name: "Higiene", slug: "higiene" },
      panales: { name: "Pañales", slug: "panales" },
      puericultura: { name: "Puericultura", slug: "puericultura" },
      "leches-infantiles": { name: "Leches infantiles", slug: "leches-infantiles" },
    },
  },
  mascotas: {
    name: "Mascotas",
    slug: "mascotas",
    icon: PawPrint,
    children: {
      perros: { name: "Perros", slug: "perros" },
      gatos: { name: "Gatos", slug: "gatos" },
      "otras-mascotas": { name: "Otras mascotas", slug: "otras-mascotas" },
      accesorios: { name: "Accesorios", slug: "accesorios" },
    },
  },
  "platos-preparados": {
    name: "Platos preparados",
    slug: "platos-preparados",
    icon: UtensilsCrossed,
    children: {
      "preparados-refrigerados": { name: "Preparados refrigerados", slug: "preparados-refrigerados" },
      "preparados-en-conserva": { name: "Preparados en conserva", slug: "preparados-en-conserva" },
    },
  },
  bazar: {
    name: "Bazar",
    slug: "bazar",
    icon: ShoppingBag,
    children: {
      "conservacion-alimentos": { name: "Conservación alimentos y moldes", slug: "conservacion-alimentos" },
      promocionales: { name: "Promocionales", slug: "promocionales" },
      desechables: { name: "Desechables", slug: "desechables" },
      velas: { name: "Velas", slug: "velas" },
      libros: { name: "Libros", slug: "libros" },
      pilas: { name: "Pilas", slug: "pilas" },
      "jardin-y-exterior": { name: "Jardin y exterior", slug: "jardin-y-exterior" },
      menaje: { name: "Menaje", slug: "menaje" },
    },
  },
  "ahora-mas-barato": {
    name: "Ahora más barato",
    slug: "ahora-mas-barato",
    icon: Percent,
  },
};

/**
 * Build a name→slug lookup for lvl0 categories.
 * Used by product pages to link back to the correct category URL.
 */
const _nameToSlug: Record<string, string> = {};
for (const [key, cat] of Object.entries(HIERARCHICAL_CATEGORIES)) {
  _nameToSlug[cat.name] = cat.slug;
}
export const CATEGORY_NAME_TO_SLUG = _nameToSlug;

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Frescos": Leaf,
  "Despensa": Package,
  "Bebidas": GlassWater,
  "Congelados y helados": Snowflake,
  "Droguería y limpieza": SprayCan,
  "Cuidado personal": Heart,
  "Ecológico y saludable": Sprout,
  "Horno": CakeSlice,
  "Infantil": Baby,
  "Mascotas": PawPrint,
  "Platos preparados": UtensilsCrossed,
  "Bazar": ShoppingBag,
  "Ahora más barato": Percent,
};

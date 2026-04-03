/**
 * Category tree and icon mapping for GenCat topics
 */
import {
  GraduationCap,
  Heart,
  Briefcase,
  Home,
  Leaf,
  BookOpen,
  Building2,
  Scale,
  Globe,
  Shield,
  Users,
  Landmark,
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
  ensenyament: {
    name: "Ensenyament",
    slug: "Ensenyament",
    icon: GraduationCap,
  },
  educacio: {
    name: "Educació",
    slug: "Educació",
    icon: GraduationCap,
  },
  salut: {
    name: "Salut",
    slug: "Salut",
    icon: Heart,
  },
  treball: {
    name: "Treball",
    slug: "Treball",
    icon: Briefcase,
  },
  empresa: {
    name: "Empresa",
    slug: "Empresa",
    icon: Building2,
  },
  cultura: {
    name: "Cultura",
    slug: "Cultura",
    icon: BookOpen,
  },
  mediambient: {
    name: "Medi Ambient",
    slug: "Medi Ambient",
    icon: Leaf,
  },
  justicia: {
    name: "Justícia",
    slug: "Justícia",
    icon: Scale,
  },
  exteriors: {
    name: "Afers Exteriors",
    slug: "Afers Exteriors",
    icon: Globe,
  },
  interior: {
    name: "Interior",
    slug: "Interior",
    icon: Shield,
  },
  benestar: {
    name: "Benestar Social",
    slug: "Benestar Social",
    icon: Users,
  },
  presidencia: {
    name: "Presidència",
    slug: "Presidència",
    icon: Landmark,
  },
};

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Ensenyament": GraduationCap,
  "Educació": GraduationCap,
  "Salut": Heart,
  "Canal Salut": Heart,
  "Treball": Briefcase,
  "Treball i Afers Socials": Briefcase,
  "Empresa": Building2,
  "Cultura": BookOpen,
  "Medi Ambient": Leaf,
  "Justícia": Scale,
  "Afers Exteriors": Globe,
  "Interior": Shield,
  "Benestar Social": Users,
  "Drets Socials": Users,
  "Presidència": Landmark,
  "Economia": Building2,
  "Agricultura": Leaf,
  "Habitatge": Home,
};

"use client";

import Link from "next/link";
import { Clock, Users, ChevronRight, Flame, Wheat, Drumstick, Droplets } from "lucide-react";
import { proxyImageUrl } from "@/lib/utils/proxy-image";
import type { Recipe } from "@/lib/types/recipe";
import IngredientProductCarousel from "@/components/IngredientProductCarousel";

export default function RecipePage({ recipe }: { recipe: Recipe }) {
  const imgSrc = proxyImageUrl(recipe.imageUrl);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Inicio
        </Link>
        <ChevronRight size={14} />
        <span>Recetas</span>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium truncate">{recipe.title}</span>
      </nav>

      {/* Hero section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={recipe.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
              Sin imagen
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-muted-foreground mb-4 leading-relaxed">{recipe.description}</p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {recipe.totalTimeMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-primary" />
                {recipe.totalTimeMinutes} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1.5">
                <Users size={16} className="text-primary" />
                {recipe.servings} {recipe.servings === 1 ? "persona" : "personas"}
              </span>
            )}
          </div>

          {/* Category badges */}
          {recipe.categories && recipe.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.categories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Nutrition */}
          {recipe.hasNutrition && (
            <div className="grid grid-cols-4 gap-3 mt-2 p-4 rounded-lg bg-muted/50 border border-border">
              {recipe.calories != null && (
                <div className="text-center">
                  <Flame size={18} className="mx-auto mb-1 text-orange-500" />
                  <div className="text-lg font-semibold text-foreground">{recipe.calories}</div>
                  <div className="text-xs text-muted-foreground">kcal</div>
                </div>
              )}
              {recipe.protein != null && (
                <div className="text-center">
                  <Drumstick size={18} className="mx-auto mb-1 text-red-500" />
                  <div className="text-lg font-semibold text-foreground">{recipe.protein}g</div>
                  <div className="text-xs text-muted-foreground">Proteínas</div>
                </div>
              )}
              {recipe.carbohydrates != null && (
                <div className="text-center">
                  <Wheat size={18} className="mx-auto mb-1 text-amber-500" />
                  <div className="text-lg font-semibold text-foreground">{recipe.carbohydrates}g</div>
                  <div className="text-xs text-muted-foreground">Carbohidratos</div>
                </div>
              )}
              {recipe.fat != null && (
                <div className="text-center">
                  <Droplets size={18} className="mx-auto mb-1 text-yellow-500" />
                  <div className="text-lg font-semibold text-foreground">{recipe.fat}g</div>
                  <div className="text-xs text-muted-foreground">Grasas</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Ingredients */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Ingredientes</h2>
          <ul className="space-y-2">
            {recipe.ingredientsFull?.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {ing.raw}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Preparación</h2>
          <ol className="space-y-4">
            {recipe.instructions?.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="pt-0.5 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Linked Products */}
      <IngredientProductCarousel ingredientProducts={recipe.ingredientProducts} />
    </div>
  );
}

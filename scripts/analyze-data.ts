import { readFileSync } from "fs";

const data: Record<string, unknown>[] = JSON.parse(readFileSync("data/products.json", "utf-8"));

// All fields
const fields = new Set<string>();
data.forEach(r => Object.keys(r).forEach(k => fields.add(k)));
console.log("=== ALL FIELDS ===");
console.log([...fields].sort().join("\n"));

// Image samples
console.log("\n=== IMAGE SAMPLES ===");
console.log(data.slice(0, 5).map(r => r.image));

// Hierarchical categories
const lvl0 = new Set<string>();
const lvl1 = new Set<string>();
const lvl2 = new Set<string>();
data.forEach(r => {
  const hc = (r.hierarchicalCategories || r.hierarchical_categories) as Record<string, string> | undefined;
  if (hc) {
    if (hc.level0 || hc.lvl0) lvl0.add(hc.level0 || hc.lvl0);
    if (hc.level1 || hc.lvl1) lvl1.add(hc.level1 || hc.lvl1);
    if (hc.level2 || hc.lvl2) lvl2.add(hc.level2 || hc.lvl2);
  }
});
console.log("\n=== HIERARCHICAL CATEGORIES ===");
console.log("lvl0:", JSON.stringify([...lvl0].sort()));
console.log("lvl1:", JSON.stringify([...lvl1].sort()));
console.log("lvl2:", JSON.stringify([...lvl2].sort()));

// Check specific fields
console.log("\n=== FACET FIELDS ===");
const brands = new Set<string>();
data.forEach(r => { if (r.brand) brands.add(r.brand as string); });
console.log("Unique brands:", brands.size);
console.log("Sample brands:", [...brands].slice(0, 15));

console.log("Has gender:", data.some(r => r.gender));
console.log("Has color (top-level):", data.some(r => r.color));
const colorSamples = data.slice(0, 5).map(r => ({ color: r.color, type: typeof r.color }));
console.log("Color samples:", JSON.stringify(colorSamples));

console.log("Has available_sizes:", data.some(r => r.available_sizes));
console.log("Has stock:", data.some(r => r.stock));
console.log("Has sales:", data.some(r => r.sales));

// Price structure
console.log("\n=== PRICE STRUCTURE ===");
console.log(data.slice(0, 3).map(r => ({ price: r.price, type: typeof r.price })));

// Rating/reviews
console.log("\n=== REVIEWS STRUCTURE ===");
console.log(data.slice(0, 3).map(r => ({ rating: r.rating, stars: r.stars, reviews: typeof r.reviews })));

// Templates
const templates = new Set<string>();
data.forEach(r => { if (r.template) templates.add(r.template as string); });
console.log("\n=== TEMPLATES ===");
console.log([...templates]);

// Check if hierarchicalCategories uses level0 or lvl0
console.log("\n=== HC KEY FORMAT ===");
const sample = data.find(r => r.hierarchicalCategories || r.hierarchical_categories);
if (sample) {
  const hc = sample.hierarchicalCategories || sample.hierarchical_categories;
  console.log("HC keys:", Object.keys(hc as object));
  console.log("HC field name:", sample.hierarchicalCategories ? "hierarchicalCategories" : "hierarchical_categories");
}

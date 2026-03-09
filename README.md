# Sofa So Good — Algolia E-Commerce Demo

**Industry:** Home & Furniture, Home Decor
**Features:** Product Comparison, Algolia Recommend
**Recommend Models:** Related Products, Looking Similar

## What's different on this branch

This branch adds **AI-powered product comparison tables** built on top of Algolia Recommend. Each product page now features two side-by-side comparison sections — one driven by **Related Products** (behavioral signals: co-views, co-purchases) and another by **Looking Similar** (visual and attribute similarity). The comparison rows are not hardcoded: they are dynamically generated from the product attributes (`attrs`) that the compared items actually share, so a bed frame comparison surfaces Material, Size, and Style while a candle comparison shows Scent, Operating Time, and Wax Type — all without any manual configuration per category.

**Why this matters:** Product comparison is one of the highest-intent moments in a shopping journey. By combining Recommend's ML models with structured product attributes, we turn a passive "you might also like" carousel into an active decision-making tool that helps shoppers evaluate trade-offs at a glance. This reduces research friction, keeps users on-site longer, and directly increases conversion by giving buyers the confidence to commit. For home furnishings and furniture — where purchases are high-consideration and returns are costly — helping customers compare materials, dimensions, and style upfront can significantly reduce return rates and support call volume.

**Cross-industry value:** Any catalog with rich, structured attributes benefits from the same pattern. Consumer electronics (specs comparison), automotive parts (fitment and compatibility), fashion (fabric, fit, care instructions), and B2B industrial supply (load ratings, certifications, materials) all face the same challenge: helping buyers distinguish between similar-looking options using the attributes that actually matter for their category. Algolia Recommend provides the "which products to compare" intelligence, while the dynamic attribute extraction ensures the comparison is always relevant — no manual curation needed.

---

## Getting Started

First, run the development server:

```bash
pnpm dev
```


## To Do
- [ ] Get the agent working
  - [ ] Change the starter message for the agent
  - [ ] Translate to italian
  - [ ] Show filters used
  - [ ] Defnie the prompt to get help

- [ ] Search page
  - [ ] Price filters not working


- [ ] Create a profile page
- [ ] Checkout page suggestions
- [ ] Suggested filters & questions in QS
- [ ] User profiles to have more than one attribute
- [ ] No results agent suggestions
- [ ] Can I remove reasoning?



- [ ] Add other things to autocomplete 
- [ ] Repeat buys
- [ ] improve display of products in the autocompltet (espacially prices) (make  sure it's shared)
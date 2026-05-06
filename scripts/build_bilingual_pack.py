"""
Build a bilingual Fredheim pack: English canonical + translations.no Norwegian.

Reads:
  scripts/_tmp/fredheim_en.json  (committed English version, via `git show`)
  recipe-packs-template/packs/fredheim-recipes.json  (current Norwegian version)

Writes:
  recipe-packs-template/packs/fredheim-recipes.json  (English canonical, with
    every recipe's Norwegian tucked into .translations.no)

Recipes are matched by .id between the two versions.
Categories are normalized to canonical English keys.
"""

import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN_PATH = os.path.join(ROOT, "scripts", "_tmp", "fredheim_en.json")
NO_PATH = os.path.join(ROOT, "recipe-packs-template", "packs", "fredheim-recipes.json")

# Normalize legacy English categories so the app has a stable set of keys.
CATEGORY_CANONICAL = {
    "Main": "Dinner",
    "Mains": "Dinner",
    # keep: Breakfast, Lunch, Dinner, Bread, Spreads, Soup, Salad, Sauce, Dessert, Snack, Other
}


def canonical_cat(cat):
    if not cat:
        return cat
    return CATEGORY_CANONICAL.get(cat, cat)


def main():
    with open(EN_PATH, "r", encoding="utf-8") as f:
        en_pack = json.load(f)
    with open(NO_PATH, "r", encoding="utf-8") as f:
        no_pack = json.load(f)

    # Build id -> Norwegian recipe map
    no_by_id = {r["id"]: r for r in no_pack["recipes"]}

    # Rebuild: English canonical + translations.no
    out_recipes = []
    for en_r in en_pack["recipes"]:
        rid = en_r["id"]
        no_r = no_by_id.get(rid)

        # Canonical English
        recipe = dict(en_r)
        recipe["category"] = canonical_cat(en_r.get("category"))
        recipe.setdefault("translations", {})

        if no_r:
            # Norwegian translation payload (only fields that were translated)
            no_translation = {}
            if no_r.get("title"):
                no_translation["title"] = no_r["title"]
            if no_r.get("description"):
                no_translation["description"] = no_r["description"]
            if no_r.get("ingredients"):
                # Keep quantity/unit from English (canonical), override name
                no_translation["ingredients"] = [
                    {
                        "quantity": eng_ing.get("quantity"),
                        "unit": eng_ing.get("unit"),
                        "name": nor_ing.get("name", eng_ing.get("name", "")),
                    }
                    for eng_ing, nor_ing in zip(
                        en_r.get("ingredients", []),
                        no_r.get("ingredients", []),
                    )
                ]
            if no_r.get("steps"):
                no_translation["steps"] = no_r["steps"]

            if no_translation:
                recipe["translations"]["no"] = no_translation

        out_recipes.append(recipe)

    # Pack-level metadata: English canonical, Norwegian metadata as translations
    out_pack = dict(en_pack)
    out_pack["recipes"] = out_recipes
    out_pack["version"] = "1.1.0"  # major bump — bilingual restructure

    # Preserve Norwegian pack name/description for reference (so the UI can
    # still display them in no mode; Packs page renders the canonical name
    # but this is useful metadata).
    out_pack["translations"] = {
        "no": {
            "name": no_pack.get("name", ""),
            "description": no_pack.get("description", ""),
        }
    }

    with open(NO_PATH, "w", encoding="utf-8") as f:
        json.dump(out_pack, f, ensure_ascii=False, indent=2)

    # Summary
    with_no = sum(1 for r in out_recipes if r.get("translations", {}).get("no"))
    print(f"Wrote {NO_PATH}")
    print(f"  Recipes: {len(out_recipes)}")
    print(f"  With Norwegian translation: {with_no}")
    print(f"  Pack version: {out_pack['version']}")


if __name__ == "__main__":
    main()

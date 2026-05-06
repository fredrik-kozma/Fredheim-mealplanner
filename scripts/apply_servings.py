"""Apply corrected serving sizes from scripts/_tmp/servings_lookup.json to
the Fredheim pack. Recipes whose title doesn't match a spreadsheet keep
their existing servings and are reported.

A manual title-alias map patches the cases where the pack title drifts
from the spreadsheet title (e.g. "Fredheim Aioli" vs "Aioli").
"""
import json, re, os, sys

PACK_PATH = 'recipe-packs-template/packs/fredheim-recipes.json'
LOOKUP_PATH = 'scripts/_tmp/servings_lookup.json'

# Pack title → spreadsheet title (both raw, not normalized). Only needed
# when the normalized forms don't match. Populate after running extract.
MANUAL_ALIASES = {
    # Pack title → spreadsheet title. Normalized lookup strips punctuation/case.
    'Baba Ghanoush - Aubergine Dip':          'Baba ghanoush',
    'Caesar Salad':                           'Caeser salad',
    'Candy Rolls':                            'Candy Rolls - Strawberry',
    'Happy Beans Salad':                      'Happy bean salad',
    'Marinated Tofu Sticks':                  'Marinade tofu sticks',
    'Breaded Tofu Sticks':                    'Tofu sticks',
    'Nutloaf':                                'Nut loaf',
    'Quinoa Salad First':                     'Quinoa salad',
    'Quinoa Salad Second':                    'Quinoa salad',
    'Raw Cheesecake':                         'Raw "cheese" cake',
    'Roasted Sweet Potato and Arugula Salad': 'Roasted sweet potato and arugala salad',
    'Sautéed Carrots':                        'Sauteed Carrots',
    'Steamed Small Potatoes':                 'Steamed potatoes',
    'Fluffy Vegan Gluten-Free Buns':          'Gluten free oat buns',
    'Millet Crackers, Hirseknekk':            'Millet crackers',
    'Creamy Red Lentil Stew':                 'Red lentil soup',
    # Deliberately left alone — no confident spreadsheet match:
    #   Blueberry Jam, Fresh Vegetable Bouillon, Italian Bruschetta,
    #   Linda's Gluten Free Bread  (spreadsheets blank for servings)
    #   Standard Recipes           (meta placeholder, no source)
    #   Fredheim Deluxe Cream Cheese, Ultimate Fluffy Vegan Gluten-Free Bread
    #       (custom recipes added after the 2022 set)
}

def norm(s):
    s = (s or '').lower()
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return s

def main():
    with open(LOOKUP_PATH, encoding='utf-8') as f:
        lookup = json.load(f)  # {normalized_title: {title, servings, file}}
    with open(PACK_PATH, encoding='utf-8') as f:
        pack = json.load(f)

    updated, same, missing = 0, 0, []
    for r in pack['recipes']:
        pack_title = r['title']
        alias = MANUAL_ALIASES.get(pack_title, pack_title)
        k = norm(alias)
        hit = lookup.get(k)
        if not hit:
            missing.append(pack_title)
            continue
        new_serv = int(hit['servings'])
        old_serv = r.get('servings')
        if new_serv != old_serv:
            r['servings'] = new_serv
            updated += 1
        else:
            same += 1

    # Bump patch version (1.1.0 → 1.1.1)
    v = pack.get('version', '1.0.0').split('.')
    if len(v) == 3:
        v[2] = str(int(v[2]) + 1)
        pack['version'] = '.'.join(v)

    with open(PACK_PATH, 'w', encoding='utf-8') as f:
        json.dump(pack, f, ensure_ascii=False, indent=2)

    print(f"Updated servings on {updated} recipes; {same} already correct.")
    print(f"No spreadsheet match for {len(missing)} recipes:")
    for t in missing:
        print("  ", t)
    print(f"\nPack version bumped to {pack['version']}")

if __name__ == '__main__':
    main()

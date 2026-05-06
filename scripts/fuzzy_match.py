"""Fuzzy-match unmatched pack titles against spreadsheet titles."""
import json, re, difflib

LOOKUP = 'scripts/_tmp/servings_lookup.json'
PACK = 'recipe-packs-template/packs/fredheim-recipes.json'

def norm(s):
    s = (s or '').lower()
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return s

with open(LOOKUP, encoding='utf-8') as f:
    lookup = json.load(f)
with open(PACK, encoding='utf-8') as f:
    pack = json.load(f)

# Build list of available normalized titles + the originals
spreadsheet_by_norm = {k: v['title'] for k, v in lookup.items()}
norms = list(spreadsheet_by_norm.keys())

for r in pack['recipes']:
    t = r['title']
    k = norm(t)
    if k in spreadsheet_by_norm: continue
    hits = difflib.get_close_matches(k, norms, n=3, cutoff=0.6)
    print(f"PACK: {t!r}")
    for h in hits:
        print(f"   -> {spreadsheet_by_norm[h]!r}  (servings={lookup[h]['servings']})")
    if not hits:
        print("   (no close match)")

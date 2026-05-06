"""
Translate the Fredheim Recipes pack from English to Norwegian.

Strategy:
  1) Apply a large built-in EN->NO override dictionary for the common culinary
     vocabulary (titles, categories, ingredient names). This is offline and
     covers most of the user-visible text.
  2) For anything not in the dictionary, try the free MyMemory API.
  3) Cache every result (successes AND failures) in scripts/.translation-cache.json
     so the script is fully resumable. Failures are cached as the original text
     so we don't hammer the API on re-runs.
  4) Anything still in English after all that will be translatable from the
     in-app "Translate" button on the recipe detail view.

Run:  python scripts/translate_fredheim_to_no.py
"""

import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK_PATH = os.path.join(ROOT, "recipe-packs-template", "packs", "fredheim-recipes.json")
CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".translation-cache.json")

CATEGORY_MAP = {
    "Breakfast": "Frokost",
    "Lunch": "Lunsj",
    "Dinner": "Middag",
    "Main": "Middag",
    "Supper": "Kveldsmat",
    "Snack": "Mellommåltid",
    "Bread": "Brød",
    "Porridge": "Grøt",
    "Spreads": "Pålegg",
    "Dessert": "Dessert",
    "Soup": "Suppe",
    "Salad": "Salat",
    "Sauce": "Saus",
    "Side": "Tilbehør",
    "Other": "Annet",
}

# ---------------------------------------------------------------------------
# Large offline ingredient dictionary
# ---------------------------------------------------------------------------
INGREDIENT_OVERRIDES = {
    # Basics
    "salt": "salt", "pepper": "pepper", "black pepper": "sort pepper",
    "white pepper": "hvit pepper", "water": "vann", "ice": "is",
    "olive oil": "olivenolje", "extra virgin olive oil": "ekstra virgin olivenolje",
    "vegetable oil": "matolje", "rapeseed oil": "rapsolje",
    "canola oil": "rapsolje", "sunflower oil": "solsikkeolje",
    "sesame oil": "sesamolje", "coconut oil": "kokosolje",
    "butter": "smør", "margarine": "margarin", "ghee": "ghee",
    "egg": "egg", "eggs": "egg", "egg yolk": "eggeplomme", "egg yolks": "eggeplommer",
    "egg white": "eggehvite", "egg whites": "eggehviter",
    "milk": "melk", "whole milk": "helmelk", "skim milk": "lettmelk",
    "soy milk": "soyamelk", "oat milk": "havremelk", "almond milk": "mandelmelk",
    "coconut milk": "kokosmelk",
    "flour": "mel", "plain flour": "hvetemel", "all-purpose flour": "hvetemel",
    "wheat flour": "hvetemel", "whole wheat flour": "sammalt hvetemel",
    "rye flour": "rugmel", "spelt flour": "speltmel", "oat flour": "havremel",
    "corn flour": "maismel", "cornstarch": "maisenna",
    "sugar": "sukker", "brown sugar": "brunt sukker",
    "caster sugar": "strøsukker", "icing sugar": "melis", "powdered sugar": "melis",
    "honey": "honning", "maple syrup": "lønnesirup", "golden syrup": "sirup",
    "yeast": "gjær", "dry yeast": "tørrgjær", "baking powder": "bakepulver",
    "baking soda": "natron", "vanilla": "vanilje", "vanilla extract": "vaniljeekstrakt",
    "vanilla sugar": "vaniljesukker", "cinnamon": "kanel", "cardamom": "kardemomme",
    "nutmeg": "muskatnøtt", "cloves": "nellik",
    # Vegetables
    "onion": "løk", "onions": "løk", "red onion": "rødløk", "white onion": "løk",
    "yellow onion": "gul løk", "shallot": "sjalottløk", "spring onion": "vårløk",
    "spring onions": "vårløk", "garlic": "hvitløk", "garlic clove": "hvitløksfedd",
    "garlic cloves": "hvitløksfedd", "leek": "purre", "leeks": "purre",
    "carrot": "gulrot", "carrots": "gulrøtter",
    "potato": "potet", "potatoes": "poteter", "sweet potato": "søtpotet",
    "tomato": "tomat", "tomatoes": "tomater", "cherry tomatoes": "cherrytomater",
    "canned tomatoes": "hakkede tomater på boks",
    "chopped tomatoes": "hakkede tomater",
    "tomato paste": "tomatpuré", "tomato sauce": "tomatsaus",
    "cucumber": "agurk", "celery": "selleri", "celeriac": "sellerirot",
    "bell pepper": "paprika", "red bell pepper": "rød paprika",
    "green bell pepper": "grønn paprika", "yellow bell pepper": "gul paprika",
    "paprika": "paprika", "chili": "chili", "chilli": "chili",
    "chili flakes": "chiliflak", "chilli flakes": "chiliflak",
    "jalapeno": "jalapeño", "jalapeño": "jalapeño",
    "spinach": "spinat", "baby spinach": "babyspinat",
    "kale": "grønnkål", "lettuce": "salat", "arugula": "ruccola", "rocket": "ruccola",
    "broccoli": "brokkoli", "cauliflower": "blomkål", "cabbage": "kål",
    "red cabbage": "rødkål", "brussels sprouts": "rosenkål",
    "zucchini": "squash", "courgette": "squash", "eggplant": "aubergine",
    "aubergine": "aubergine", "mushroom": "sopp", "mushrooms": "sopp",
    "button mushrooms": "sjampinjonger", "champignons": "sjampinjonger",
    "avocado": "avokado", "avocados": "avokadoer",
    "corn": "mais", "sweetcorn": "mais", "peas": "erter", "green peas": "grønne erter",
    "sugar snap peas": "sukkererter", "snow peas": "sukkererter",
    "green beans": "brekkbønner", "beans": "bønner",
    "kidney beans": "kidneybønner", "black beans": "sorte bønner",
    "chickpeas": "kikerter", "lentils": "linser", "red lentils": "røde linser",
    "edamame": "edamame", "soy beans": "soyabønner",
    "beetroot": "rødbete", "beets": "rødbeter", "radish": "reddik",
    "turnip": "nepe", "parsnip": "pastinakk", "pumpkin": "gresskar",
    "squash": "gresskar", "ginger": "ingefær", "ginger root": "ingefær",
    # Fruits
    "lemon": "sitron", "lemons": "sitroner", "lemon juice": "sitronsaft",
    "lemon zest": "sitronskall", "lime": "lime", "lime juice": "limesaft",
    "orange": "appelsin", "oranges": "appelsiner", "orange juice": "appelsinjuice",
    "apple": "eple", "apples": "epler", "pear": "pære", "pears": "pærer",
    "banana": "banan", "bananas": "bananer", "strawberries": "jordbær",
    "blueberries": "blåbær", "raspberries": "bringebær", "blackberries": "bjørnebær",
    "berries": "bær", "mixed berries": "blandede bær",
    "grapes": "druer", "pineapple": "ananas", "mango": "mango",
    "peach": "fersken", "plum": "plomme", "dates": "dadler", "raisins": "rosiner",
    "dried apricots": "tørkede aprikoser", "dried cranberries": "tørkede tranebær",
    # Meat and fish
    "chicken": "kylling", "chicken breast": "kyllingfilet",
    "chicken breasts": "kyllingfileter", "chicken thigh": "kyllinglår",
    "chicken thighs": "kyllinglår", "turkey": "kalkun", "turkey mince": "kalkunkjøttdeig",
    "beef": "storfekjøtt", "beef mince": "kjøttdeig", "ground beef": "kjøttdeig",
    "steak": "biff", "pork": "svinekjøtt", "bacon": "bacon", "ham": "skinke",
    "sausage": "pølse", "sausages": "pølser", "lamb": "lam",
    "mince": "kjøttdeig", "minced meat": "kjøttdeig",
    "salmon": "laks", "salmon fillet": "laksefilet",
    "salmon fillets": "laksefileter", "smoked salmon": "røkelaks",
    "cod": "torsk", "tuna": "tunfisk", "shrimp": "reker", "prawns": "reker",
    "fish": "fisk", "white fish": "hvit fisk",
    # Dairy
    "cheese": "ost", "feta": "fetaost", "feta cheese": "fetaost",
    "parmesan": "parmesan", "cheddar": "cheddar",
    "mozzarella": "mozzarella", "cottage cheese": "cottage cheese",
    "cream cheese": "kremost", "goat cheese": "geitost",
    "cream": "fløte", "heavy cream": "kremfløte", "double cream": "kremfløte",
    "sour cream": "rømme", "creme fraiche": "crème fraîche",
    "yogurt": "yoghurt", "greek yogurt": "gresk yoghurt",
    "plain yogurt": "naturell yoghurt", "plain greek yogurt": "naturell gresk yoghurt",
    # Bread, grains, pasta
    "bread": "brød", "breadcrumbs": "brødsmuler", "panko": "panko",
    "toast": "ristet brød", "bun": "rundstykke", "buns": "rundstykker",
    "pita bread": "pitabrød", "tortilla": "tortilla", "tortillas": "tortillaer",
    "oats": "havregryn", "rolled oats": "havregryn", "quick oats": "lettkokte havregryn",
    "muesli": "müsli", "granola": "granola",
    "rice": "ris", "white rice": "hvit ris", "brown rice": "brun ris",
    "basmati rice": "basmatiris", "jasmine rice": "jasminris",
    "pasta": "pasta", "spaghetti": "spagetti", "penne": "penne",
    "noodles": "nudler", "rice noodles": "risnudler",
    "quinoa": "quinoa", "couscous": "couscous", "bulgur": "bulgur", "barley": "bygg",
    # Legumes / canned
    "canned chickpeas": "kikerter på boks",
    "canned beans": "bønner på boks",
    "canned black beans": "sorte bønner på boks",
    "canned kidney beans": "kidneybønner på boks",
    # Herbs and spices
    "parsley": "persille", "fresh parsley": "frisk persille",
    "basil": "basilikum", "fresh basil": "frisk basilikum",
    "cilantro": "koriander", "coriander": "koriander",
    "fresh coriander": "frisk koriander", "dill": "dill", "fresh dill": "frisk dill",
    "mint": "mynte", "fresh mint": "frisk mynte",
    "chives": "gressløk", "rosemary": "rosmarin", "thyme": "timian",
    "oregano": "oregano", "sage": "salvie", "bay leaf": "laurbærblad",
    "bay leaves": "laurbærblader",
    "cumin": "spisskummen", "ground cumin": "malt spisskummen",
    "turmeric": "gurkemeie", "ground turmeric": "malt gurkemeie",
    "smoked paprika": "røkt paprikapulver", "paprika powder": "paprikapulver",
    "cayenne": "cayenne", "cayenne pepper": "cayennepepper",
    "curry powder": "karripulver", "garam masala": "garam masala",
    "chili powder": "chilipulver", "chilli powder": "chilipulver",
    "mustard": "sennep", "dijon mustard": "dijonsennep",
    "mustard seeds": "sennepsfrø",
    # Nuts and seeds
    "almonds": "mandler", "sliced almonds": "hakkede mandler",
    "walnuts": "valnøtter", "hazelnuts": "hasselnøtter",
    "cashews": "cashewnøtter", "pistachios": "pistasjnøtter",
    "peanuts": "peanøtter", "pine nuts": "pinjekjerner",
    "chia seeds": "chiafrø", "flax seeds": "linfrø", "linseed": "linfrø",
    "sesame seeds": "sesamfrø", "sunflower seeds": "solsikkefrø",
    "pumpkin seeds": "gresskarfrø",
    # Condiments
    "soy sauce": "soyasaus", "low sodium soy sauce": "soyasaus (lav-salt)",
    "low-sodium soy sauce": "soyasaus (lav-salt)",
    "tamari": "tamari", "fish sauce": "fiskesaus",
    "ketchup": "ketsjup", "mayonnaise": "majones",
    "mayo": "majones", "vinegar": "eddik", "white vinegar": "hvit eddik",
    "apple cider vinegar": "eplecidereddik",
    "balsamic vinegar": "balsamicoeddik", "white wine vinegar": "hvitvinseddik",
    "rice vinegar": "riseddik",
    "tahini": "tahini", "peanut butter": "peanøttsmør",
    "hummus": "hummus", "pesto": "pesto", "salsa": "salsa",
    # Stocks / broths
    "stock": "kraft", "broth": "kraft",
    "chicken stock": "kyllingkraft", "chicken broth": "kyllingkraft",
    "vegetable stock": "grønnsakskraft", "vegetable broth": "grønnsakskraft",
    "beef stock": "oksekraft", "beef broth": "oksekraft",
    "fish stock": "fiskekraft",
    # Misc
    "tofu": "tofu", "tempeh": "tempeh",
    "olives": "oliven", "black olives": "sorte oliven", "green olives": "grønne oliven",
    "capers": "kapers", "pickles": "syltede agurker",
}

# Useful for trimming instruction-like prefixes before checking the dict
def normalize_ingredient(name):
    s = name.strip().lower()
    s = re.sub(r"\s*\(.+?\)\s*", " ", s).strip()
    s = re.sub(r"\s+", " ", s)
    return s

# ---------------------------------------------------------------------------
# Title overrides — common Fredheim recipe names
# ---------------------------------------------------------------------------
TITLE_OVERRIDES = {
    "Aioli": "Aioli",
    "Alambre taco": "Alambre-tacos",
    "Almond butter": "Mandelsmør",
    "Apple cake": "Eplekake",
    "Apple pie": "Eplepai",
    "Asparagus soup": "Aspargessuppe",
    "Avocado dressing": "Avokadodressing",
    "Avocado toast": "Avokadotoast",
    "Bagel": "Bagel",
    "Baguette": "Baguette",
    "Banana bread": "Bananbrød",
    "Banana pancakes": "Bananpannekaker",
    "Bean pâté": "Bønnepostei",
    "Beef stew": "Okseragu",
    "Blueberry muffins": "Blåbærmuffins",
    "Bolognese": "Bolognese",
    "Bolognese sauce": "Bolognese-saus",
    "Bread": "Brød",
    "Bread rolls": "Rundstykker",
    "Breakfast smoothie": "Frokostsmoothie",
    "Brownies": "Sjokoladekaker",
    "Caesar salad": "Cæsarsalat",
    "Carrot cake": "Gulrotkake",
    "Carrot soup": "Gulrotsuppe",
    "Cauliflower soup": "Blomkålsuppe",
    "Cheese sauce": "Ostesaus",
    "Chicken curry": "Kyllingkarri",
    "Chicken salad": "Kyllingsalat",
    "Chicken soup": "Kyllingsuppe",
    "Chicken stock": "Kyllingkraft",
    "Chickpea stew": "Kikertgryte",
    "Chili": "Chili con carne",
    "Chili con carne": "Chili con carne",
    "Chocolate cake": "Sjokoladekake",
    "Chocolate mousse": "Sjokolademousse",
    "Cinnamon buns": "Kanelboller",
    "Cinnamon rolls": "Kanelboller",
    "Coleslaw": "Kålslaw",
    "Cookies": "Småkaker",
    "Corn bread": "Maisbrød",
    "Couscous salad": "Couscoussalat",
    "Cream sauce": "Fløtesaus",
    "Crepes": "Tynne pannekaker",
    "Curry": "Karri",
    "Dinner rolls": "Rundstykker",
    "Dumplings": "Dumplinger",
    "Egg salad": "Eggerøre",
    "Fajitas": "Fajitas",
    "Falafel": "Falafel",
    "Fish cakes": "Fiskekaker",
    "Fish soup": "Fiskesuppe",
    "Flatbread": "Flatbrød",
    "Focaccia": "Focaccia",
    "French toast": "Arme riddere",
    "Fried rice": "Stekt ris",
    "Fruit salad": "Fruktsalat",
    "Garden vegetable soup": "Hagegrønnsakssuppe",
    "Garlic bread": "Hvitløksbrød",
    "Gazpacho": "Gazpacho",
    "Gingerbread": "Pepperkaker",
    "Gnocchi": "Gnocchi",
    "Granola": "Granola",
    "Greek salad": "Gresk salat",
    "Green salad": "Grønn salat",
    "Green smoothie": "Grønn smoothie",
    "Guacamole": "Guacamole",
    "Hamburger": "Hamburger",
    "Hot dog": "Pølse i brød",
    "Hummus": "Hummus",
    "Ice cream": "Iskrem",
    "Lamb stew": "Fårikål",
    "Lasagna": "Lasagne",
    "Lasagne": "Lasagne",
    "Lemon cake": "Sitronkake",
    "Lentil soup": "Linsesuppe",
    "Mac and cheese": "Mac and cheese",
    "Meatballs": "Kjøttboller",
    "Meatloaf": "Kjøttpudding",
    "Minestrone": "Minestronesuppe",
    "Muesli": "Müsli",
    "Mushroom soup": "Soppsuppe",
    "Nachos": "Nachos",
    "Oatmeal": "Havregrøt",
    "Oatmeal porridge": "Havregrøt",
    "Omelette": "Omelett",
    "Overnight oats": "Overnattshavregrøt",
    "Pancakes": "Pannekaker",
    "Pasta salad": "Pastasalat",
    "Pea soup": "Ertesuppe",
    "Pesto": "Pesto",
    "Pizza": "Pizza",
    "Pizza dough": "Pizzadeig",
    "Porridge": "Grøt",
    "Potato salad": "Potetsalat",
    "Potato soup": "Potetsuppe",
    "Pumpkin soup": "Gresskarsuppe",
    "Quinoa salad": "Quinoasalat",
    "Ratatouille": "Ratatouille",
    "Rice pudding": "Risgrøt",
    "Risotto": "Risotto",
    "Roasted vegetables": "Ovnsbakte grønnsaker",
    "Salmon salad": "Laksesalat",
    "Salsa": "Salsa",
    "Sauerkraut": "Surkål",
    "Scones": "Scones",
    "Shakshuka": "Shakshuka",
    "Shepherd's pie": "Shepherd's pie",
    "Smoothie": "Smoothie",
    "Sourdough bread": "Surdeigsbrød",
    "Spaghetti bolognese": "Spagetti bolognese",
    "Spinach salad": "Spinatsalat",
    "Strawberry jam": "Jordbærsyltetøy",
    "Sushi": "Sushi",
    "Tacos": "Tacos",
    "Tahini dressing": "Tahinidressing",
    "Thai curry": "Thai-karri",
    "Tofu sour cream": "Tofurømme",
    "Tomato sauce": "Tomatsaus",
    "Tomato soup": "Tomatsuppe",
    "Tortilla": "Tortilla",
    "Tuna salad": "Tunfisksalat",
    "Vanilla ice cream": "Vaniljeiskrem",
    "Vegetable soup": "Grønnsakssuppe",
    "Vegetable stock": "Grønnsakskraft",
    "Waffles": "Vafler",
    "Whole grain bread": "Grovt brød",
    "Whole wheat bread": "Grovt brød",
    "Yogurt sauce": "Yoghurtsaus",
    "Zucchini bread": "Squashbrød",
}


def load_cache():
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    # OneDrive can lock files; retry a few times and fall back to direct write.
    for attempt in range(5):
        try:
            with open(CACHE_PATH, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=2)
            return
        except PermissionError:
            time.sleep(0.5 * (attempt + 1))
    # Give up silently — the next save will try again.


_api_disabled = False


def translate_via_api(text):
    global _api_disabled
    if _api_disabled or not text or not text.strip():
        return None
    url = "https://api.mymemory.translated.net/get?" + urllib.parse.urlencode(
        {"q": text[:500], "langpair": "en|no", "de": "menuplanner@example.com"}
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "menu-planner-translator/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        rd = data.get("responseData", {})
        translated = rd.get("translatedText") or ""
        if "QUOTA" in translated.upper() or "MYMEMORY WARNING" in translated.upper():
            _api_disabled = True
            print("  ! MyMemory quota reached — falling back to dictionary only", flush=True)
            return None
        if not translated:
            return None
        return translated
    except Exception as e:
        print(f"  ! API error: {e} — disabling API", flush=True)
        _api_disabled = True
        return None


def translate(text, cache, kind="generic"):
    if not text or not isinstance(text, str):
        return text
    key = f"{kind}::{text.strip()}"
    if key in cache:
        return cache[key]

    result = None

    if kind == "ingredient":
        norm = normalize_ingredient(text)
        if norm in INGREDIENT_OVERRIDES:
            result = INGREDIENT_OVERRIDES[norm]

    if kind == "title":
        stripped = text.strip()
        if stripped in TITLE_OVERRIDES:
            result = TITLE_OVERRIDES[stripped]

    if result is None and not _api_disabled:
        result = translate_via_api(text)

    # Always cache — even failures — so we don't re-ask.
    if result is None:
        result = text
    cache[key] = result
    return result


def main():
    with open(PACK_PATH, "r", encoding="utf-8") as f:
        pack = json.load(f)

    cache = load_cache()
    print(f"Loaded pack '{pack['name']}' with {len(pack['recipes'])} recipes")
    print(f"Cache starts with {len(cache)} entries")

    pack["name"] = "Fredheim-oppskrifter"
    pack["description"] = (
        "En kuratert samling av sunne og gode oppskrifter fra Fredheim. "
        "Inkluderer frokoster, lunsjer, middager, brød, sauser, salater, supper og mer."
    )

    total = len(pack["recipes"])
    for i, r in enumerate(pack["recipes"], 1):
        if r.get("category"):
            r["category"] = CATEGORY_MAP.get(r["category"], r["category"])

        r["title"] = translate(r.get("title", ""), cache, "title")

        if r.get("description"):
            r["description"] = translate(r["description"], cache, "desc")

        for ing in r.get("ingredients", []):
            if ing.get("name"):
                ing["name"] = translate(ing["name"], cache, "ingredient")

        r["steps"] = [translate(s, cache, "step") for s in r.get("steps", [])]

        if i % 20 == 0 or i == total:
            save_cache(cache)
            print(f"  {i}/{total} recipes — cache {len(cache)}", flush=True)

    cur = pack.get("version", "1.0.0")
    parts = cur.split(".")
    try:
        parts[-1] = str(int(parts[-1]) + 1)
        pack["version"] = ".".join(parts)
    except ValueError:
        pack["version"] = cur + "-no"

    save_cache(cache)

    with open(PACK_PATH, "w", encoding="utf-8") as f:
        json.dump(pack, f, ensure_ascii=False, indent=2)

    print(f"\nDone. Pack written to {PACK_PATH}")
    print(f"New version: {pack['version']}")


if __name__ == "__main__":
    main()

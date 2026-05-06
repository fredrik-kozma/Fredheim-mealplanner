import json
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load current pack
with open("recipe-packs-template/packs/fredheim-recipes.json", 'r', encoding='utf-8') as f:
    pack = json.load(f)

# New recipes to add
new_recipes = [
    {
        "id": "fluffy-vegan-gluten-free-buns",
        "title": "Fluffy Vegan Gluten-Free Buns",
        "description": "Soft, pillowy burger and sandwich buns made with gluten-free flour.",
        "category": "Bread",
        "servings": 10,
        "prepTime": 15,
        "cookTime": 26,
        "imageUrl": None,
        "ingredients": [
            {"quantity": 500, "unit": "g", "name": "Gluten-free bread flour"},
            {"quantity": 300, "unit": "ml", "name": "Water"},
            {"quantity": 30, "unit": "ml", "name": "Neutral oil"},
            {"quantity": 7, "unit": "g", "name": "Salt"},
            {"quantity": 7, "unit": "g", "name": "Instant yeast"}
        ],
        "steps": [
            "Make dough following bread recipe with tangzhong method, mixing vigorously for 4-5 minutes until sticky but scoopable.",
            "Divide dough: 110-120g for burger buns or 80-90g for smaller rolls.",
            "Shape with wet hands by gently cupping and rotating dough, smooth top without kneading, place on baking paper.",
            "Cover loosely and rise 30-45 minutes until 50-70% larger.",
            "Optional: brush with oat milk and sprinkle sesame seeds, poppy seeds, or oats.",
            "Bake at 220°C for 8 minutes, then 190°C for 12-18 minutes until golden and hollow-sounding.",
            "Cool at least 30-45 minutes before slicing."
        ],
        "tags": ["vegan", "gluten-free", "bread"]
    },
    {
        "id": "fredheim-deluxe-plant-based-cream-cheese",
        "title": "Fredheim Deluxe Plant-Based Cream Cheese",
        "description": "Rich and creamy cashew-based cream cheese with fresh herbs.",
        "category": "Spreads",
        "servings": 16,
        "prepTime": 20,
        "cookTime": 0,
        "imageUrl": None,
        "ingredients": [
            {"quantity": 900, "unit": "g", "name": "Raw cashews, soaked"},
            {"quantity": 240, "unit": "g", "name": "Medjool dates, pitted"},
            {"quantity": 270, "unit": "ml", "name": "Fresh lemon juice"},
            {"quantity": 3, "unit": "tsp", "name": "Lemon zest"},
            {"quantity": 15, "unit": "g", "name": "Salt"},
            {"quantity": 15, "unit": "g", "name": "White miso"},
            {"quantity": 60, "unit": "g", "name": "Nutritional yeast"},
            {"quantity": 12, "unit": "g", "name": "Onion powder"},
            {"quantity": 9, "unit": "g", "name": "Garlic powder"},
            {"quantity": 400, "unit": "ml", "name": "Cold water"},
            {"quantity": 35, "unit": "g", "name": "Fresh chives, chopped"},
            {"quantity": 20, "unit": "g", "name": "Fresh dill, chopped"}
        ],
        "steps": [
            "Soak raw cashews in water for 2-4 hours, or pour boiling water and soak 10 minutes, then drain.",
            "Blend in 2-3 batches: combine cashews, dates, lemon juice, lemon zest, salt, miso, yeast, onion powder, garlic powder, and water.",
            "Blend until completely smooth and creamy.",
            "Add water gradually to reach thick but spreadable consistency (typically 300-500ml total).",
            "Transfer to bowl and fold in finely chopped chives and dill.",
            "Refrigerate 2-3 hours before serving; cream cheese will thicken and flavors will develop."
        ],
        "tags": ["vegan", "plant-based", "spread"]
    },
    {
        "id": "creamy-red-lentil-stew",
        "title": "Creamy Red Lentil Stew",
        "description": "Warming stew with red lentils, vegetables, and creamy cashew milk.",
        "category": "Dinner",
        "servings": 5,
        "prepTime": 10,
        "cookTime": 35,
        "imageUrl": None,
        "ingredients": [
            {"quantity": 300, "unit": "g", "name": "Red lentils, rinsed"},
            {"quantity": 1, "unit": "pcs", "name": "Medium onion, finely chopped"},
            {"quantity": 3, "unit": "pcs", "name": "Garlic cloves, minced"},
            {"quantity": 1, "unit": "pcs", "name": "Large carrot, diced"},
            {"quantity": 2, "unit": "pcs", "name": "Small potatoes, diced"},
            {"quantity": 1, "unit": "pcs", "name": "Red bell pepper, diced"},
            {"quantity": 1000, "unit": "ml", "name": "Vegetable broth"},
            {"quantity": 400, "unit": "g", "name": "Crushed tomatoes"},
            {"quantity": 1, "unit": "tsp", "name": "Ground cumin"},
            {"quantity": 1.5, "unit": "tsp", "name": "Smoked paprika"},
            {"quantity": 0.5, "unit": "tsp", "name": "Turmeric"},
            {"quantity": 0.5, "unit": "tsp", "name": "Cinnamon"},
            {"quantity": 0.5, "unit": "tsp", "name": "Ground coriander"},
            {"quantity": 1.5, "unit": "tsp", "name": "Salt"},
            {"quantity": 2, "unit": "tbsp", "name": "Date paste"},
            {"quantity": 0.5, "unit": "pcs", "name": "Lemon, juice"},
            {"quantity": 120, "unit": "g", "name": "Raw cashews for milk"},
            {"quantity": 360, "unit": "ml", "name": "Water for milk"},
            {"quantity": 15, "unit": "g", "name": "Fresh cilantro, chopped"}
        ],
        "steps": [
            "Saute onions, garlic, carrots, and bell pepper with splash of water over medium heat until soft and fragrant, about 5-7 minutes.",
            "Add cumin, smoked paprika, turmeric, cinnamon, coriander, and salt, stirring 30 seconds until fragrant.",
            "Stir in lentils, potatoes, crushed tomatoes, broth, and date paste. Bring to boil.",
            "Reduce heat to low, cover partially, and simmer 20-25 minutes until lentils and vegetables are soft.",
            "Blend cashews with water until smooth and creamy.",
            "Stir cashew milk and lemon juice into stew, simmer 5 minutes to thicken.",
            "Optional: use immersion blender to blend portion for creaminess while keeping some texture.",
            "Taste and adjust salt, lemon, and spices as needed.",
            "Serve hot garnished with cilantro, alongside bread, rice, or quinoa."
        ],
        "tags": ["vegan", "plant-based", "stew", "lentils"]
    }
]

# Add to pack
pack['recipes'].extend(new_recipes)
pack['version'] = '1.0.5'
pack['description'] = f"A curated collection of {len(pack['recipes'])} healthy and delicious recipes from Fredheim."

# Save
with open("recipe-packs-template/packs/fredheim-recipes.json", 'w', encoding='utf-8') as f:
    json.dump(pack, f, indent=2, ensure_ascii=False)

print(f"Added 3 new recipes")
print(f"Total recipes: {len(pack['recipes'])}")
print(f"Version: {pack['version']}")

# Update registry
with open("recipe-packs-template/registry.json", 'r', encoding='utf-8') as f:
    reg = json.load(f)

for item in reg:
    if item['id'] == 'fredheim-recipes':
        item['version'] = '1.0.5'
        item['recipeCount'] = len(pack['recipes'])
        break

with open("recipe-packs-template/registry.json", 'w', encoding='utf-8') as f:
    json.dump(reg, f, indent=2, ensure_ascii=False)

print(f"Registry updated to v1.0.5")

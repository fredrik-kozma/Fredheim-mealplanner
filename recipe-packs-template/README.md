# Recipe Packs — GitHub Hosting Guide

This folder contains the exact files you need to host your own recipe packs on GitHub so the Menu Planner app can download them.

---

## The easy way: Export from the app

The fastest way to create a pack is to build it directly inside the app using the Export feature — no JSON editing required.

1. **Open the app → go to Recipes** and add your recipes normally using the Add Recipe form.
2. **Go to Packs → click "Create Pack"** (indigo button, top-right of the Packs page). You can also reach it via the "Export as Pack" button on the Recipes page.
3. **Select recipes** — use the search bar and category chips to find them, then tick the ones you want to include.
4. **Fill in pack details** — name, description, author, version, and tags.
5. **Click Export** — a `{packId}.json` file downloads to your computer.
6. **Upload it to GitHub:**
   - Drop the file into your `menu-planner-recipes/packs/` folder.
   - Add an entry to `registry.json`:
     ```json
     {
       "id": "my-pack-id",
       "name": "My Pack Name",
       "description": "Short description shown on the pack card.",
       "author": "Your Name",
       "version": "1.0.0",
       "tags": ["tag1", "tag2"],
       "recipeCount": 5
     }
     ```
7. **Push to GitHub** — users can now find and install your pack from the Online Packs section of the app.

---

## Manual setup steps

1. **Create a public GitHub repository** named `menu-planner-recipes`.

2. **Copy these files** to the root of that repository, preserving the folder structure:
   ```
   registry.json
   packs/
     healthy-basics.json
     mediterranean.json
     nordic-classics.json
   ```

3. **Edit `src/utils/recipePacks.js`** in the Menu Planner app and change `YOUR_USERNAME` to your actual GitHub username:
   ```js
   export const REGISTRY_URL =
     'https://raw.githubusercontent.com/YOUR_USERNAME/menu-planner-recipes/main'
   ```

4. **Push to GitHub.** Done — the app will now fetch your packs from the Online Packs section.

---

## File format reference

### `registry.json`
An array of pack metadata objects. Each entry must have:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique pack identifier (must match the filename in `packs/`) |
| `name` | string | Display name |
| `description` | string | Short description shown on the pack card |
| `author` | string | Your name |
| `version` | string | Semver string, e.g. `"1.0.0"` |
| `tags` | string[] | Category tags shown as badges |
| `recipeCount` | number | Number of recipes (shown before the full pack is downloaded) |

### `packs/{id}.json`
The full pack file. Same metadata fields as above, plus a `recipes` array.

Each recipe must have:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique across all packs (use a prefix, e.g. `hb-1`) |
| `title` | string | Recipe name |
| `category` | string | One of the app's recipe categories (Breakfast, Lunch, Dinner, Snack, etc.) |
| `servings` | number | Number of servings the recipe makes |
| `prepTime` | number \| null | Prep time in minutes |
| `cookTime` | number \| null | Cook time in minutes |
| `imageUrl` | string \| null | URL to an image, or `null` |
| `description` | string | Short description |
| `tags` | string[] | Descriptive tags |
| `ingredients` | array | See below |
| `steps` | string[] | Ordered instruction steps |

Each ingredient:
```json
{ "quantity": 200, "unit": "g", "name": "rolled oats" }
```
Use `quantity: 0` and `unit: ""` for ingredients with no measurable quantity (e.g. `"salt and pepper"`).

---

## Adding your own packs

1. Create `packs/my-pack.json` with your recipes following the format above.
2. Add an entry for it in `registry.json`.
3. Push to GitHub.
4. Click **Refresh** in the Online Packs section of the app.

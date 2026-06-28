/*
 * One-off parser: turns the extracted text of
 * Fredheim_FMD_Nutrition_Panels.docx into scripts/fmd_nutrition.json,
 * a map of recipeId -> { servingWeightGrams, perServing: {...} }.
 *
 * The source .docx lives outside the repo (the user's Downloads). We read
 * the plain-text extraction and commit the parsed JSON so the pack
 * generator is reproducible without the original document.
 *
 * Usage: node scripts/parse_fmd_nutrition.cjs <path-to-extracted-text.txt>
 */
const fs = require('fs')
const path = require('path')

const txtPath = process.argv[2] || 'C:/Users/fredr/Downloads/fmd_nut.txt'
const lines = fs.readFileSync(txtPath, 'utf8').split('\n').map(l => l.trim())

const LABELS = {
  'Calories (kcal)': 'calories',
  'Protein (g)': 'protein',
  'Total Fat (g)': 'totalFat',
  'Saturated Fat (g)': 'saturatedFat',
  'Polyunsaturated Fat (g)': 'polyunsaturatedFat',
  'Monounsaturated Fat (g)': 'monounsaturatedFat',
  'Omega-3 (ALA) (g)': 'omega3',
  'Omega-6 (g)': 'omega6',
  'Cholesterol (mg)': 'cholesterol',
  'Total Carbohydrates (g)': 'totalCarbs',
  'Total Sugars (g)': 'totalSugars',
  'Added Sugar (g)': 'addedSugar',
  'Dietary Fiber (g)': 'fiber',
  'Calcium (mg)': 'calcium',
  'Potassium (mg)': 'potassium',
  'Copper (mg)': 'copper',
  'Iron (mg)': 'iron',
  'Magnesium (mg)': 'magnesium',
  'Manganese (mg)': 'manganese',
  'Selenium (ug)': 'selenium',
  'Phosphorus (mg)': 'phosphorus',
  'Zinc (mg)': 'zinc',
  'Sodium (mg)': 'sodium',
  'Vitamin A (ug)': 'vitaminA',
  'Vitamin B6 (mg)': 'vitaminB6',
  'Vitamin B12 (ug)': 'vitaminB12',
  'Vitamin C (mg)': 'vitaminC',
  'Vitamin D (ug)': 'vitaminD',
  'Vitamin E (mg)': 'vitaminE',
  'Vitamin K (ug)': 'vitaminK',
  'Folate (ug)': 'folate',
  'Thiamin (mg)': 'thiamin',
  'Riboflavin (mg)': 'riboflavin',
  'Niacin (mg)': 'niacin',
  'Choline (mg)': 'choline',
}

const MEAL = { Breakfast: 'breakfast', Lunch: 'lunch', Dinner: 'dinner' }
const out = {}
let cur = null

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const head = line.match(/^D(\d)\s+(Breakfast|Lunch|Dinner)\b/)
  if (head) {
    const id = `fmd-d${head[1]}-${MEAL[head[2]]}`
    cur = { servingWeightGrams: null, perServing: {} }
    out[id] = cur
    continue
  }
  if (!cur) continue
  const w = line.match(/≈\s*([\d.]+)\s*g/)
  if (w && cur.servingWeightGrams === null) { cur.servingWeightGrams = Math.round(parseFloat(w[1])); continue }
  if (LABELS[line] !== undefined) {
    const val = parseFloat((lines[i + 1] || '').replace(',', '.'))
    if (!Number.isNaN(val)) cur.perServing[LABELS[line]] = val
  }
}

// Sanity report
const ids = Object.keys(out)
const missing = []
for (const id of ids) {
  const n = out[id]
  const keys = Object.keys(n.perServing).length
  if (keys < 30 || !n.servingWeightGrams) missing.push(`${id} (keys=${keys}, w=${n.servingWeightGrams})`)
}

const dest = path.join(__dirname, 'fmd_nutrition.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log('Parsed', ids.length, 'recipes ->', dest)
console.log('Issues:', missing.length ? missing.join('; ') : 'none')

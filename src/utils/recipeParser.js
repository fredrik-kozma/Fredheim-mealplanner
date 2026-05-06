/**
 * Smart recipe parser — supports English and Norwegian text
 */

const UNITS = [
  // Metric
  'kg', 'g', 'mg',
  'l', 'dl', 'ml', 'cl',
  // Imperial
  'cup', 'cups',
  'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces',
  'lb', 'lbs', 'pound', 'pounds',
  'fl oz',
  'pint', 'pints', 'qt', 'quart', 'quarts', 'gallon', 'gallons',
  // Norwegian
  'ss', 'ts', 'stk', 'pk', 'boks', 'neve', 'klype', 'skive', 'skiver',
  // Generic
  'pcs', 'piece', 'pieces', 'slice', 'slices', 'handful', 'pinch',
  'can', 'cans', 'jar', 'jars', 'bag', 'bags', 'bunch', 'clove', 'cloves',
]

const UNIT_PATTERN = new RegExp(
  `^(\\d+(?:[.,/]\\d+)?(?:\\s*-\\s*\\d+(?:[.,/]\\d+)?)?)\\s*(${UNITS.join('|')})\\.?\\s+(.+)$`,
  'i'
)

const FRACTION_MAP = {
  '½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1/6, '⅚': 5/6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

function parseFraction(str) {
  // Handle unicode fractions
  for (const [frac, val] of Object.entries(FRACTION_MAP)) {
    str = str.replace(frac, val)
  }
  // Handle "1/2" style
  str = str.replace(/(\d+)\s*\/\s*(\d+)/, (_, a, b) => parseFloat(a) / parseFloat(b))
  // Handle ranges "2-3" → take first
  str = str.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/, (_, a) => a)
  // Handle comma decimal (Norwegian)
  str = str.replace(',', '.')
  return parseFloat(str) || 0
}

function parseIngredientLine(line) {
  line = line.trim()
  if (!line) return null

  // Remove leading list markers
  line = line.replace(/^[-•*·▪◦]\s*/, '')

  // Try unit pattern first
  const unitMatch = line.match(UNIT_PATTERN)
  if (unitMatch) {
    return {
      quantity: parseFraction(unitMatch[1]),
      unit: unitMatch[2].toLowerCase(),
      name: unitMatch[3].trim(),
    }
  }

  // Try "quantity name" (no unit)
  const noUnitMatch = line.match(/^(\d+(?:[.,/]\d+)?(?:\s*-\s*\d+(?:[.,/]\d+)?)?)\s+(.+)$/)
  if (noUnitMatch) {
    return {
      quantity: parseFraction(noUnitMatch[1]),
      unit: '',
      name: noUnitMatch[2].trim(),
    }
  }

  // Just a name (e.g. "salt and pepper")
  if (line.length > 0 && line.length < 80) {
    return { quantity: 0, unit: '', name: line }
  }

  return null
}

function detectServings(text) {
  const patterns = [
    /serves?\s+(\d+)/i,
    /(\d+)\s+servings?/i,
    /portions?:\s*(\d+)/i,
    /(\d+)\s+portions?/i,
    /makes?\s+(\d+)/i,
    /yield[s]?\s*:?\s*(\d+)/i,
    // Norwegian
    /(\d+)\s+porsjoner?/i,
    /porsjoner?\s*:?\s*(\d+)/i,
    /(\d+)\s+porsj\./i,
    /antall\s+porsjoner?\s*:?\s*(\d+)/i,
    /(\d+)\s+pers(?:oner?)?/i,
    /til\s+(\d+)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return parseInt(match[1], 10)
  }
  return 4 // default
}

function detectTime(text, type) {
  // type: 'prep' | 'cook' | 'total'
  const patterns = {
    prep: [
      /prep(?:aration)?\s+time\s*:?\s*(\d+)\s*(min(?:utes?)?|hour[s]?|h)/i,
      /forberedelse(?:stid)?\s*:?\s*(\d+)\s*(min(?:utter?)?|time[r]?)/i,
    ],
    cook: [
      /cook(?:ing)?\s+time\s*:?\s*(\d+)\s*(min(?:utes?)?|hour[s]?|h)/i,
      /bake[s]?\s+(?:for\s+)?(\d+)\s*(min(?:utes?)?|hour[s]?|h)/i,
      /ovn(?:stid)?\s*:?\s*(\d+)\s*(min(?:utter?)?|time[r]?)/i,
      /steketid\s*:?\s*(\d+)\s*(min(?:utter?)?|time[r]?)/i,
      /koketid\s*:?\s*(\d+)\s*(min(?:utter?)?|time[r]?)/i,
    ],
    total: [
      /total\s+time\s*:?\s*(\d+)\s*(min(?:utes?)?|hour[s]?|h)/i,
      /total\s*:?\s*(\d+)\s*(min(?:utes?)?|hour[s]?|h)/i,
    ],
  }

  for (const pattern of (patterns[type] || [])) {
    const match = text.match(pattern)
    if (match) {
      const val = parseInt(match[1], 10)
      const unit = match[2].toLowerCase()
      if (unit.startsWith('h') || unit.startsWith('time')) return val * 60
      return val
    }
  }
  return null
}

function detectCategory(text, title) {
  const combined = (title + ' ' + text).toLowerCase()
  const categoryKeywords = {
    Breakfast: ['breakfast', 'frokost', 'morgon', 'porridge', 'oatmeal', 'grøt', 'eggs', 'egg', 'pancake', 'waffle', 'vaffel', 'pannekake'],
    Lunch: ['lunch', 'lunsj', 'salad', 'salat', 'sandwich', 'wrap', 'soup', 'suppe'],
    Dinner: ['dinner', 'middag', 'supper', 'pasta', 'pizza', 'curry', 'stew', 'gryte', 'roast', 'steak', 'biff'],
    Bread: ['bread', 'brød', 'bun', 'bolle', 'roll', 'loaf'],
    Snack: ['snack', 'melomåltid', 'bar', 'balls', 'muffin', 'cookie', 'kjeks'],
    Dessert: ['dessert', 'cake', 'kake', 'pie', 'pudding', 'ice cream', 'iskrem', 'chocolate', 'sjokolade'],
    Spreads: ['spread', 'pålegg', 'jam', 'syltetøy', 'butter', 'smør', 'hummus', 'dip'],
  }
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => combined.includes(k))) return cat
  }
  return 'Dinner'
}

function splitIntoSections(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let titleLines = []
  let ingredientLines = []
  let stepLines = []
  let metaLines = []

  let mode = 'title'

  const INGREDIENT_HEADER = /^(ingredients?|ingredienser|what\s+you['']?ll?\s+need|du\s+trenger|you\s+need|til\s+\d+)[\s:]*$/i
  const STEPS_HEADER = /^(directions?|instructions?|method|steps?|fremgangsmåte|slik\s+gjør\s+du|how\s+to|preparation|tilberedning)[\s:]*$/i
  const STEP_NUM = /^\d+[.)]\s+/

  for (const line of lines) {
    if (INGREDIENT_HEADER.test(line)) {
      mode = 'ingredients'
      continue
    }
    if (STEPS_HEADER.test(line)) {
      mode = 'steps'
      continue
    }

    if (mode === 'title') {
      // First non-empty lines are title/meta until we see an ingredient-like line
      const maybeIngredient = parseIngredientLine(line)
      if (maybeIngredient && maybeIngredient.name) {
        mode = 'ingredients'
        ingredientLines.push(line)
      } else if (STEP_NUM.test(line)) {
        mode = 'steps'
        stepLines.push(line)
      } else {
        titleLines.push(line)
      }
    } else if (mode === 'ingredients') {
      if (STEP_NUM.test(line) || (line.length > 100 && !line.match(/^\d/))) {
        mode = 'steps'
        stepLines.push(line)
      } else {
        ingredientLines.push(line)
      }
    } else if (mode === 'steps') {
      stepLines.push(line)
    }
  }

  // If no sections found, try heuristic split
  if (ingredientLines.length === 0 && stepLines.length === 0) {
    for (const line of lines.slice(1)) {
      const parsed = parseIngredientLine(line)
      if (parsed && (parsed.quantity > 0 || UNITS.some(u => line.toLowerCase().includes(u)))) {
        ingredientLines.push(line)
      } else if (STEP_NUM.test(line) || line.length > 60) {
        stepLines.push(line)
      }
    }
  }

  return { titleLines, ingredientLines, stepLines }
}

export function parseRecipe(rawText) {
  if (!rawText || !rawText.trim()) return null

  const text = rawText.trim()
  const { titleLines, ingredientLines, stepLines } = splitIntoSections(text)

  // Title: first non-empty title line, or first line overall
  const title = (titleLines[0] || text.split('\n')[0] || 'New Recipe').trim()
    .replace(/^#+\s*/, '') // strip markdown headings
    .slice(0, 100)

  // Servings
  const servings = detectServings(text)

  // Times
  const prepTime = detectTime(text, 'prep')
  const cookTime = detectTime(text, 'cook')

  // Ingredients
  const ingredients = ingredientLines
    .map(parseIngredientLine)
    .filter(Boolean)

  // Steps — clean and join numbered items
  const steps = stepLines
    .map(l => l.replace(/^\d+[.)]\s*/, '').trim())
    .filter(l => l.length > 3)

  // If no steps parsed, treat long lines as steps
  const finalSteps = steps.length > 0 ? steps : text
    .split('\n')
    .filter(l => l.trim().length > 50)
    .map(l => l.trim())

  // Category
  const category = detectCategory(text, title)

  return {
    title,
    servings,
    prepTime: prepTime || null,
    cookTime: cookTime || null,
    ingredients,
    steps: finalSteps,
    category,
  }
}

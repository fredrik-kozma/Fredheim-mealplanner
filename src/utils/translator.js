const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'

const LANG_MAP = {
  en: 'en-GB',
  no: 'nb-NO',
  sv: 'sv-SE',
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function translateText(text, fromLang, toLang) {
  if (!text || !text.trim()) return text
  if (fromLang === toLang) return text

  const from = LANG_MAP[fromLang] || fromLang
  const to = LANG_MAP[toLang] || toLang

  const res = await fetch(
    `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
  )
  const data = await res.json()
  return data.responseData?.translatedText || text
}

export async function translateRecipe(recipe, fromLang, toLang) {
  const translated = {}

  // Translate title
  translated.title = await translateText(recipe.title, fromLang, toLang)
  await delay(200)

  // Translate description
  if (recipe.description) {
    translated.description = await translateText(recipe.description, fromLang, toLang)
    await delay(200)
  } else {
    translated.description = recipe.description
  }

  // Translate ingredient names
  const ingredients = []
  for (const ing of (recipe.ingredients || [])) {
    if (ing.name && ing.name.trim()) {
      const translatedName = await translateText(ing.name, fromLang, toLang)
      ingredients.push({ ...ing, name: translatedName })
      await delay(150)
    } else {
      ingredients.push(ing)
    }
  }
  translated.ingredients = ingredients

  // Translate steps
  const steps = []
  for (const step of (recipe.steps || [])) {
    if (step && step.trim()) {
      const translatedStep = await translateText(step, fromLang, toLang)
      steps.push(translatedStep)
      await delay(150)
    } else {
      steps.push(step)
    }
  }
  translated.steps = steps

  return translated
}

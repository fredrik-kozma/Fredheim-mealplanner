/**
 * Assigns a shopping-list ingredient to a store aisle.
 *
 * This used to be plain substring matching, which put watermelon under
 * Beverages ("water"), coconut oil and arugula under Bakery ("nut"... "rug")
 * and soy milk next to the wine. Now names are split into words and the
 * aisle comes from the ingredient's HEAD NOUN:
 *
 *   - English phrases put the head last: "coconut oil" is an oil, "soy milk"
 *     is a milk. So the rightmost word that names a food wins.
 *   - Norwegian and Swedish build compounds the same way: "kokosolje" is an
 *     olje, "vannmelon" a melon. A keyword at the END of a word (a "tail")
 *     counts as the head; one at the START ("vann" in vannmelon) only counts
 *     when nothing better is found.
 *   - Ties go to the longest keyword, so "coconut milk" (canned) beats "milk"
 *     and "laurbær" (bay leaf) beats "bær" (berries).
 *
 * Then a few modifiers adjust the result: anything frozen goes to Frozen,
 * canned/pickled/drained produce or fish to Canned & Dried, dried fruit to
 * Canned & Dried, and dried or ground herbs and powders to the spice shelf.
 *
 * The aisle keys are stored on saved shopping lists and translated via
 * `aisles.<key>` in the locales — don't rename them.
 */

export const AISLES = [
  'Produce',
  'Meat & Fish',
  'Dairy',
  'Bakery & Grains',
  'Canned & Dried',
  'Oils & Condiments',
  'Frozen',
  'Beverages',
  'Other',
]

const KEYWORDS = {
  Produce: [
    // fruit
    'apple', 'eple', 'äpple', 'banana', 'banan', 'lemon', 'sitron', 'citron', 'lime', 'orange', 'appelsin',
    'strawberry', 'jordbær', 'jordgubbe', 'jordgubbar', 'blueberry', 'blåbær', 'raspberry', 'bringebær', 'hallon',
    'blackberry', 'bjørnebær', 'björnbär', 'lingonberry', 'lingoberry', 'tyttebær', 'lingon', 'berry', 'bær', 'bär',
    'cherry', 'kirsebær', 'körsbär', 'mango', 'avocado', 'avokado', 'pineapple', 'ananas', 'melon', 'grape',
    'drue', 'druer', 'vindruvor', 'pear', 'pære', 'päron', 'plum', 'plomme', 'plommon', 'pomegranate',
    'granatäpple', 'kiwi', 'peach', 'fersken', 'persika', 'nectarine', 'apricot', 'aprikos', 'fig', 'fiken',
    'fikon', 'cranberry', 'tranebær', 'tranbär', 'rhubarb', 'rabarbra', 'rabarber',
    // Citrus juice: you buy the fruit (or the bottle next to it), not a drink.
    'lemon juice', 'lime juice', 'sitronsaft', 'citronsaft', 'limesaft', 'limejuice', 'citronjuice',
    // vegetables
    'tomato', 'tomat', 'onion', 'løk', 'lök', 'shallot', 'sjalottløk', 'schalottenlök', 'garlic', 'hvitløk',
    'vitlök', 'garlic clove', 'ginger', 'ingefær', 'ingefära', 'carrot', 'gulrot', 'gulrøtter', 'morot', 'morötter',
    'potato', 'potet', 'potatis', 'sweet potato', 'søtpotet', 'sötpotatis', 'celery', 'selleri', 'sellerirot',
    'stangselleri', 'stjälkselleri', 'celeriac', 'broccoli', 'brokkoli', 'spinach', 'spinat', 'spenat',
    'lettuce', 'salad', 'salat', 'sallad', 'arugula', 'rocket', 'ruccola', 'rucola', 'romaine',
    'cucumber', 'agurk', 'gurka', 'bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'paprika',
    'chili', 'chilli', 'chile', 'chilipepper', 'chili pepper', 'jalapeño', 'jalapeno', 'zucchini', 'squash', 'courgette', 'cauliflower', 'blomkål', 'pumpkin',
    'gresskar', 'pumpa', 'butternut', 'mushroom', 'sopp', 'svamp', 'champignon', 'sjampinjong', 'champinjon',
    'skivling', 'shiitake', 'pea', 'erter', 'ärter', 'ärtor', 'snow pea', 'sugar snap', 'corn', 'mais', 'majs',
    'kale', 'grønnkål', 'grönkål', 'cabbage', 'kål', 'savoy', 'leek', 'purre', 'purjolök', 'asparagus',
    'asparges', 'sparris', 'sprout', 'spire', 'groddar', 'brussels sprout', 'eggplant', 'aubergine',
    'fennel', 'fennikel', 'fänkål', 'beetroot', 'beet', 'rødbete', 'rödbeta', 'bete', 'beta', 'parsnip',
    'pastinakk', 'palsternacka', 'radish', 'reddik', 'rädisa', 'rädisor', 'horseradish', 'pepperrot',
    'pepparrot', 'spring onion', 'vårløk', 'salladslök', 'scallion',
    // fresh herbs — see HERBS below for what happens when they're dried
    'herb', 'urter', 'örter', 'basil', 'basilikum', 'basilika', 'parsley', 'persille', 'persilja',
    'cilantro', 'coriander', 'koriander', 'dill', 'thyme', 'timian', 'timjan', 'rosemary', 'rosmarin',
    'oregano', 'mint', 'mynte', 'mynta', 'chive', 'gressløk', 'gräslök', 'sage', 'salvie', 'salvia',
    'tarragon', 'estragon', 'dragon', 'marjoram', 'merian', 'mejram', 'lemongrass', 'sitrongress',
  ],
  'Meat & Fish': [
    'chicken', 'kylling', 'kyckling', 'beef', 'biff', 'storfe', 'nötkött', 'pork', 'svin', 'fläsk', 'lamb', 'lam',
    'turkey', 'kalkun', 'kalkon', 'bacon', 'sausage', 'pølse', 'korv', 'ham', 'skinke', 'skinka',
    'salmon', 'laks', 'lax', 'tuna', 'tunfisk', 'cod', 'torsk', 'shrimp', 'prawn', 'reke', 'räka', 'räkor',
    'fish', 'fisk', 'mince', 'kjøttdeig', 'köttfärs', 'steak', 'sea bass', 'havabbor', 'havsabborre',
    'pollock', 'sei', 'fillet', 'filet', 'meat', 'kjøtt', 'kött', 'lamm', 'meatball', 'kjøttbolle',
    'köttbulle', 'chorizo', 'salami', 'prosciutto', 'mackerel', 'makrell', 'makrill', 'herring', 'sild',
    'sill', 'trout', 'ørret', 'öring', 'haddock', 'hyse', 'kolja', 'crab', 'krabbe', 'krabba',
    'mussel', 'blåskjell', 'blåmussla', 'blåmusslor', 'scampi',
  ],
  Dairy: [
    // Plant milks and yogurts sit with dairy in the chilled section; that's
    // where a shopper in Norway or Sweden looks for them.
    'milk', 'melk', 'mjölk', 'cream', 'fløte', 'grädde', 'sour cream', 'rømme', 'gräddfil', 'crème fraîche',
    'creme fraiche', 'crème fraiche',
    // Swedish and Norwegian shops sell plant milks as "drinks".
    'havredryck', 'sojadryck', 'mandeldryck', 'risdryck', 'kokosdryck', 'växtdryck', 'havredrikk',
    'soyadrikk', 'mandeldrikk', 'risdrikk', 'plantedrikk',
    'yogurt', 'yoghurt', 'butter', 'smør', 'smör', 'cheese', 'ost', 'mozzarella', 'parmesan', 'cheddar',
    'feta', 'ricotta', 'quark', 'kvarg', 'kesam', 'cottage', 'egg', 'ägg',
    // Chilled plant protein and dips.
    'tofu', 'tempeh', 'seitan', 'hummus',
  ],
  'Bakery & Grains': [
    'flour', 'mel', 'mjöl', 'bread', 'brød', 'bröd', 'bun', 'roll', 'pasta', 'spaghetti', 'macaroni',
    'lasagne', 'lasagna', 'rice', 'ris', 'oat', 'oats', 'havre', 'havregryn', 'gryn', 'groats', 'barley',
    'bygg', 'quinoa', 'millet', 'hirse', 'hirs', 'buckwheat', 'bokhvete', 'bovete', 'spelt', 'rye',
    'rug', 'råg', 'noodle', 'nudel', 'nudler', 'nudlar', 'tortilla', 'cracker', 'crispbread', 'knekkebrød',
    'knäckebröd', 'flatbread', 'pitta', 'pita', 'naan', 'breadcrumb', 'panko', 'yeast', 'gjær', 'jäst',
    'sourdough', 'surdeig', 'surdeg', 'baking powder', 'bakepulver', 'bakpulver', 'baking soda', 'natron',
    'bikarbonat', 'starch', 'stivelse', 'stärkelse', 'cornstarch', 'maizena', 'potetmel', 'bulgur',
    'couscous', 'polenta', 'semolina', 'gluten', 'psyllium', 'husk', 'fibre', 'fiber', 'tapioca', 'tapioka',
    'agar', 'carob', 'karob', 'cocoa', 'kakao', 'granola', 'muesli', 'müsli',
    // Baking chocolate shares the baking shelf with cocoa.
    'chocolate', 'sjokolade', 'choklad',
  ],
  'Canned & Dried': [
    'bean', 'bønne', 'bønner', 'böna', 'bönor', 'bön', 'cannellini', 'borlotti', 'kidney', 'lentil',
    'linse', 'linser', 'lins', 'chickpea', 'kikert', 'kikerter', 'kikärt', 'kikärta', 'kikärtor', 'kikärter',
    'aquafaba', 'yellow pea', 'yellow split pea', 'gule erter', 'gula ärtor', 'gula ärter',
    'stock', 'kraft', 'broth', 'buljong', 'bouillon', 'fond', 'soup', 'suppe', 'soppa',
    'tomato paste', 'tomato puree', 'tomatpuré', 'tomatpure', 'tomato sauce', 'tomatsaus', 'passata',
    'chopped tomatoes', 'crushed tomatoes', 'knuste tomater', 'krossade tomater',
    'coconut milk', 'kokosmelk', 'kokosmjölk', 'coconut cream', 'kokosfløte', 'kokosgrädde',
    'coconut', 'kokos', 'kokosmasse',
    'olive', 'oliven', 'oliv', 'oliver', 'olive water', 'olivenvann', 'caper', 'kapers', 'kapris',
    'sylteagurk', 'pickle', 'anchovy', 'ansjos', 'sardell', 'sardine', 'sardin', 'nori', 'seaweed', 'tang', 'nutritional yeast', 'næringsgjær', 'näringsjäst',
    // Nuts and seeds.
    'walnut', 'valnøtt', 'valnöt', 'almond', 'mandel', 'mandl', 'mandlar', 'cashew', 'peanut', 'peanøtt',
    'jordnöt', 'hazelnut', 'hasselnøtt', 'hasselnöt', 'pecan', 'pekannøtt', 'pistachio', 'pistasj',
    'pistasch', 'pinje', 'pine nut', 'nut', 'nøtt', 'nöt', 'pumpkin seed', 'squash seed', 'gresskarfrø', 'gresskarkjern',
    'pumpafrö', 'pumpakärn', 'sunflower seed', 'sunflower', 'solsikkefrø', 'solsikke', 'solrosfrö',
    'sesame seed', 'sesamfrø', 'sesamfrö', 'chia', 'chia seed', 'chiafrø', 'chiafrö', 'flaxseed', 'flax',
    'linseed', 'linfrø', 'linfrö', 'hemp seed', 'hampfrø', 'tahini', 'tahin',
    // Dried fruit. Dates in Norway and Sweden are sold dried, not fresh.
    'raisin', 'rosin', 'russin', 'prune', 'svisker', 'sviske', 'katrinplommon', 'date', 'daddel', 'dadler',
    'dadel', 'dadlar', 'medjool',
  ],
  'Oils & Condiments': [
    'oil', 'olje', 'olja', 'vinegar', 'eddik', 'vinäger', 'ättika', 'soy', 'soya', 'soja', 'soy sauce',
    'soyasaus', 'tamari', 'sauce', 'saus', 'sås', 'mustard', 'sennep', 'senap', 'ketchup', 'mayonnaise',
    'majones', 'majonnäs', 'sriracha', 'worcestershire', 'fish sauce', 'oyster sauce', 'miso', 'misopasta',
    'pesto', 'honey', 'honning', 'honung', 'syrup', 'sirup', 'sirap', 'maple syrup', 'sugar', 'sukker',
    'socker', 'sukrin', 'stevia', 'jam', 'syltetøy', 'sylt', 'almond butter', 'mandelsmør', 'mandelsmör',
    'peanut butter', 'peanøttsmør', 'jordnötssmör', 'salt', 'pepper', 'peppar', 'peppercorn',
    // Spices and dried flavourings.
    'spice', 'krydder', 'krydda', 'cumin', 'spisskummen', 'spiskummin', 'kummin', 'caraway', 'karve',
    'turmeric', 'gurkemeie', 'gurkmeja', 'garam masala', 'masala', 'curry', 'karri', 'cayenne', 'kajenne',
    'cinnamon', 'kanel', 'cardamom', 'kardemomme', 'kardemumma', 'clove', 'nellik', 'kryddnejlika',
    'nejlika', 'nutmeg', 'muskat', 'muskatnøtt', 'muskot', 'muskotnöt', 'smoked paprika', 'røkt paprika',
    'rökt paprika', 'sumac', 'sumak', 'bay leaf', 'bay leaves', 'laurbær', 'laurbærblad', 'lagerblad',
    'fenugreek', 'bukkehorn', 'bockhornsklöver', 'nigella', 'svartkarve', 'svartkummin', 'star anise',
    'stjerneanis', 'stjärnanis', 'saffron', 'safran', 'vanilla', 'vanilje', 'vanilj', 'amla', 'za\'atar',
  ],
  Frozen: [
    // Edamame is only sold frozen in Norwegian and Swedish shops.
    'edamame', 'ice cream', 'iskrem', 'vaniljeis', 'vaniljglass',
  ],
  Beverages: [
    'water', 'vann', 'vatten', 'juice', 'coffee', 'kaffe', 'tea', 'te', 'wine', 'vin', 'beer', 'øl', 'öl',
    'cider', 'kombucha', 'lemonade', 'brus', 'läsk',
  ],
}

// Fresh herbs and aromatics. Dried or ground they're bought on the spice
// shelf; other dried produce (fruit, sun-dried tomatoes) is dry goods.
const HERBS = new Set([
  'herb', 'urter', 'örter', 'basil', 'basilikum', 'basilika', 'parsley', 'persille', 'persilja', 'cilantro',
  'coriander', 'koriander', 'dill', 'thyme', 'timian', 'timjan', 'rosemary', 'rosmarin', 'oregano', 'mint',
  'mynte', 'mynta', 'chive', 'gressløk', 'gräslök', 'sage', 'salvie', 'salvia', 'tarragon', 'estragon',
  'dragon', 'marjoram', 'merian', 'mejram', 'lemongrass', 'sitrongress', 'ginger', 'ingefær', 'ingefära',
  'garlic', 'hvitløk', 'vitlök', 'onion', 'løk', 'lök', 'chili', 'chilli', 'chile', 'chilipepper',
  'chili pepper', 'paprika', 'fennel',
  'fennikel', 'fänkål',
])

/*
 * Exact names the rules still get wrong, in en/no/sv. Keys are lowercase
 * with any "(...)" note removed; a key matches either the whole name or the
 * part before the first comma.
 */
const OVERRIDES = {
  // Olive brine, not drinking water.
  'olive water': 'Canned & Dried',
  'olivenvann': 'Canned & Dried',
  'olivlag': 'Canned & Dried',
  // Leftover chickpea water — you buy the chickpeas.
  'kokevann fra kikerter': 'Canned & Dried',
  'kokvatten från kikärtor': 'Canned & Dried',
  'kokvatten från kikärter': 'Canned & Dried',
  // Tinned fish named by what it's packed in.
  'tuna in water': 'Canned & Dried',
  'tuna in oil': 'Canned & Dried',
  'tuna in olive oil': 'Canned & Dried',
  'tunfisk i vann': 'Canned & Dried',
  'tunfisk i olje': 'Canned & Dried',
  'tonfisk i vatten': 'Canned & Dried',
  'tonfisk i olja': 'Canned & Dried',
  'mackerel in tomato sauce': 'Canned & Dried',
  'makrell i tomat': 'Canned & Dried',
  'makrill i tomatsås': 'Canned & Dried',
  // Sweet "ice" in Swedish is glass; the Norwegian is is too short to match safely.
  'is': 'Frozen',
  'glass': 'Frozen',
}

// Word-final endings that still leave the same word: English plurals and
// Norwegian/Swedish plural and definite forms.
const SUFFIXES = ['', 's', 'es', 'e', 'r', 'er', 'n', 'en', 'et', 'ne', 'ene', 'a', 'ar', 'or', 'na', 'erna', 'arna', 'orna']

// Parts of a compound that say which piece of the plant you use, not what
// it is: "hvitløks|fedd", "selleri|stilker", "korriander|frø". Stripped so
// the part before them can act as the head.
const GENERIC_TAILS = [
  'pulver', 'frøene', 'frø', 'frön', 'frö', 'skall', 'skal', 'saft', 'biter', 'bitar', 'buketter', 'stilker',
  'stilk', 'stjälkar', 'stjälk', 'blader', 'blad', 'fedd', 'klyftor', 'klyfta', 'skiver', 'halvdeler', 'halvor',
  'korn', 'flak', 'plater', 'puré', 'smuler', 'kjerner', 'kärnor', 'fileter', 'filet', 'filéer', 'filé',
]

// Modifiers that move produce to another aisle.
const FROZEN = new Set(['frozen', 'frossen', 'frosne', 'frosset', 'fryst', 'frysta', 'dypfryst', 'djupfryst'])
const FRESH = new Set(['fresh', 'fersk', 'ferske', 'ferskt', 'frisk', 'friske', 'färsk', 'färska', 'färskt'])
const CANNED = new Set([
  'canned', 'tinned', 'can', 'cans', 'jar', 'jarred', 'tetrapak', 'tetrapakk', 'hermetisk', 'hermetiske',
  'boks', 'burk', 'pickled', 'syltet', 'syltede', 'syltad', 'syltade', 'inlagd', 'inlagda',
  'drained', 'avrent', 'avrunnen', 'avrunna', 'avrunnet',
])
const DRIED = new Set([
  'dried', 'dry', 'sun', 'tørket', 'tørkede', 'tørkete', 'tørr', 'tørre', 'soltørket', 'soltørkede',
  'torkad', 'torkade', 'torkat', 'torr', 'torra', 'soltorkad', 'soltorkade',
])
const GROUND = new Set([
  'ground', 'powder', 'powdered', 'flakes', 'seed', 'seeds', 'malt', 'malte', 'malen', 'malet', 'malda',
  'pulver', 'flak',
])
const GROUND_TAILS = ['pulver', 'frø', 'frön', 'frö', 'flak']

// Words after which the rest of the phrase is about use, not the item:
// "olive oil for frying", "cashews til melk", "tunfisk i olje".
const CUT_WORDS = new Set([
  'for', 'to', 'til', 'till', 'att', 'per', 'with', 'med', 'without', 'uten', 'utan', 'plus', 'pluss',
  'in', 'i', 'på',
])
const OR_WORDS = new Set(['or', 'eller'])

// --- keyword index -------------------------------------------------------

const ORDER = Object.fromEntries(AISLES.map((a, i) => [a, i]))
const SINGLE = new Map() // word -> aisle
const PHRASES = []        // { words, aisle, len }
for (const [aisle, list] of Object.entries(KEYWORDS)) {
  for (const raw of list) {
    const kw = raw.toLowerCase()
    if (kw.includes(' ')) PHRASES.push({ words: kw.split(' '), aisle, len: kw.length, kw })
    else if (!SINGLE.has(kw)) SINGLE.set(kw, aisle)
  }
}

const LETTERS = /[\p{L}']+/gu

function tokenize(text) {
  return (text.toLowerCase().match(LETTERS) || []).map(w => w.replace(/'/g, '')).filter(Boolean)
}

// Is `word` the keyword `kw` itself, possibly inflected?
function inflectionOf(word, kw) {
  if (word === kw) return true
  if (kw.length <= 2) return false
  if (kw.endsWith('y') && word === kw.slice(0, -1) + 'ies') return true
  if (kw.endsWith('f') && word === kw.slice(0, -1) + 'ves') return true
  if (!word.startsWith(kw)) return false
  return SUFFIXES.includes(word.slice(kw.length))
}

// Keywords `word` is, or ends with — the head of a compound like
// "vann|melon". A tail needs 2+ letters in front of it and 3+ letters of
// its own, so "te" (tea) can't hide inside "paste".
function headMatches(word) {
  const out = []
  for (let i = 0; i <= word.length - 1; i++) {
    if (i === 1) continue
    const rest = word.slice(i)
    for (const kw of [...stemsOf(rest)]) {
      if (i > 0 && kw.length < 3) continue
      if (SINGLE.has(kw)) out.push({ kw, aisle: SINGLE.get(kw) })
    }
  }
  return out
}

// Possible dictionary forms of a word: itself, minus an inflection, or an
// irregular English plural (berries -> berry, leaves -> leaf).
function* stemsOf(word) {
  yield word
  for (const suf of SUFFIXES) {
    if (suf && word.endsWith(suf) && word.length - suf.length >= 3) yield word.slice(0, -suf.length)
  }
  if (word.endsWith('ies')) yield word.slice(0, -3) + 'y'
  if (word.endsWith('ves')) yield word.slice(0, -3) + 'f'
}

// Keywords the word merely starts with ("vann" in "vannmelon").
function leadMatches(word) {
  const out = []
  for (let n = 3; n <= word.length - 3; n++) {
    const kw = word.slice(0, n)
    const aisle = SINGLE.get(kw)
    if (aisle) out.push({ kw, aisle })
  }
  return out
}

function stripGenericTail(word) {
  for (const g of GENERIC_TAILS) {
    if (word.endsWith(g) && word.length - g.length >= 3) return word.slice(0, -g.length)
  }
  return null
}

/*
 * Best keyword match in a list of words. Matches further right win (they're
 * the head); a keyword only found at the start of a word scores half a step
 * less than a full match on that word. Ties go to the longer keyword.
 */
function bestMatch(words) {
  let best = null
  const consider = (pos, kw, aisle) => {
    if (!best || pos > best.pos || (pos === best.pos && (kw.length > best.kw.length
      || (kw.length === best.kw.length && ORDER[aisle] < ORDER[best.aisle])))) {
      best = { pos, kw, aisle }
    }
  }

  words.forEach((word, i) => {
    for (const m of headMatches(word)) consider(i, m.kw, m.aisle)
    const stem = stripGenericTail(word)
    if (stem) {
      for (const m of headMatches(stem)) consider(i, m.kw, m.aisle)
      for (const m of leadMatches(stem)) consider(i - 0.5, m.kw, m.aisle)
    }
    for (const m of leadMatches(word)) consider(i - 0.5, m.kw, m.aisle)
  })

  for (const p of PHRASES) {
    const n = p.words.length
    for (let i = 0; i + n <= words.length; i++) {
      let ok = true
      for (let j = 0; j < n - 1 && ok; j++) ok = words[i + j] === p.words[j]
      if (ok && inflectionOf(words[i + n - 1], p.words[n - 1])) consider(i + n - 1, p.kw, p.aisle)
    }
  }
  return best
}

// "lemon — all the juice + the zest" / "Water, drinking water" -> segments.
function segmentsOf(text) {
  return text
    .replace(/\([^)]*\)?/g, ' ')
    .split(/,|\s[—–+]\s|;/)
    .map(s => s.trim())
    .filter(Boolean)
}

// The item part of one segment, split into "X or Y" alternatives.
function alternativesOf(segment) {
  const words = tokenize(segment.replace(/-/g, ' '))
  const cut = words.findIndex(w => CUT_WORDS.has(w))
  const kept = cut > 0 ? words.slice(0, cut) : words
  const alts = [[]]
  for (const w of kept) {
    if (OR_WORDS.has(w)) alts.push([])
    else alts[alts.length - 1].push(w)
  }
  return alts.filter(a => a.length)
}

function overrideFor(text) {
  const clean = text.toLowerCase().replace(/\([^)]*\)?/g, ' ').replace(/\s+/g, ' ').trim()
  if (OVERRIDES[clean]) return OVERRIDES[clean]
  const head = clean.split(',')[0].trim()
  return OVERRIDES[head] || null
}

function applyModifiers(aisle, best, allWords) {
  const has = set => allWords.some(w => set.has(w))
  // Frozen goods of any kind live in the freezer.
  if (has(FROZEN) && !has(FRESH)) return 'Frozen'
  // Tinned tuna and mackerel sit with the other tins, not at the fish counter.
  if (aisle === 'Meat & Fish' && has(CANNED)) return 'Canned & Dried'
  if (aisle !== 'Produce') return aisle
  if (has(CANNED)) return 'Canned & Dried'
  const groundTail = allWords.some(w => GROUND_TAILS.some(t => w.endsWith(t) && w.length > t.length))
  if (has(GROUND) || groundTail) return 'Oils & Condiments'
  if (has(DRIED)) return HERBS.has(best.kw) ? 'Oils & Condiments' : 'Canned & Dried'
  return aisle
}

/**
 * Aisle key for one ingredient or shopping item name. Returns one of
 * AISLES; 'Other' when nothing matches.
 */
export function categoriseIngredient(name) {
  if (!name) return 'Other'
  const text = String(name).normalize('NFC')

  // Bilingual names: "agurk, skåret tynt / cucumber, thinly sliced".
  const halves = text.split(/\s\/\s/)
  for (const half of halves) {
    const override = overrideFor(half)
    if (override) return override
  }

  for (const half of halves) {
    const segments = segmentsOf(half)
    const allWords = segments.flatMap(s => tokenize(s.replace(/-/g, ' ')))
    // The first segment names the item ("Apple, Norwegian, raw"); later
    // ones are only tried when it says nothing we recognise.
    for (const segment of segments) {
      for (const alt of alternativesOf(segment)) {
        const best = bestMatch(alt)
        if (best) return applyModifiers(best.aisle, best, allWords)
      }
    }
  }
  return 'Other'
}

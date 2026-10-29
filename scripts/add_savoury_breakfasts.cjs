/* Eight savoury breakfasts (scripts/data/savoury-breakfast-ideas.md, part 1,
 * approved by Fredrik 2026-10-29), into the Fredheim Kitchen pack.
 *
 * Rows are the ideas file's, standardized: wholegrain rye bread is `bread`
 * (note "wholegrain rye"), "parsley or cress" is parsley with the cress in
 * the note, and the spoon amounts of gram-measured ingredients are grams
 * (sunflower seeds 2 tbsp = 18 g, pumpkin seeds 3 tbsp = 30 g, tomato purée
 * 1 tbsp = 16 g; the app shows the spoon beside them). The smørbrød uses the
 * pack's Classic Hummus (200 g), like the Za'atar Hummus Plate, with the
 * quick blender version kept in its method.
 *
 * Nutrition per serving and the serving weight are calculated from the rows
 * with scripts/data/food-composition-core.json (the estimator label-recipes
 * and check-recipes use). Labels, standard salt and flavourProfile are
 * written afterwards by label-recipes and build_salt_levels.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(DIR, 'fredheim-recipes-with-pictures.json')
const IMG_DIR = path.join(__dirname, '_tmp', 'breakfast-pics')
const DICT = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'ingredientDictionary.json'), 'utf8'))
const BY_ID = new Map(DICT.entries.map(e => [e.id, e]))

// [quantity, unit, id, { en, no, sv } note?]
const RYE = (n, extra = {}) => ({
  en: `wholegrain rye, ${n} slices${extra.en || ''}`,
  no: `grovt rugbrød, ${n} skiver${extra.no || ''}`,
  sv: `fullkornsrågbröd, ${n} skivor${extra.sv || ''}`,
})
const N = {
  chopped: { en: 'chopped', no: 'hakket', sv: 'hackad' },
  onion1: { en: '1 onion, chopped', no: '1 løk, hakket', sv: '1 lök, hackad' },
  sliced: { en: 'sliced', no: 'i skiver', sv: 'skivad' },
  firm: { en: 'firm', no: 'fast', sv: 'fast' },
  drained: { en: 'drained', no: 'avrent', sv: 'avrunna' },
  finely: { en: 'finely chopped', no: 'finhakket', sv: 'finhackad' },
}

const RECIPES = [
  {
    id: 'savoury-oat-porridge',
    title: 'Savoury Oat Porridge with Mushrooms and Spinach',
    no: 'Havregrøt med sopp og spinat',
    sv: 'Havregrynsgröt med svamp och spenat',
    description: {
      en: 'Oats simmered with browned mushrooms, onion and garlic, spinach and nutritional yeast stirred in, chives and sunflower seeds on top.',
      no: 'Havregryn kokt med brunet sopp, løk og hvitløk, med spinat og næringsgjær rørt inn, og gressløk og solsikkefrø på toppen.',
      sv: 'Havregryn kokta med brynt svamp, lök och vitlök, med spenat och näringsjäst nedrörd, och gräslök och solrosfrön på toppen.',
    },
    servings: 4, prepTime: 10, cookTime: 15, mealTypes: ['breakfast'],
    portion: ['1 bowl', '1 bolle', '1 skål'],
    rows: [
      [160, 'g', 'rolled-oats'],
      [8, 'dl', 'water'],
      [250, 'g', 'mushrooms', N.sliced],
      [100, 'g', 'spinach'],
      [110, 'g', 'onions', N.onion1],
      [2, 'clove', 'garlic', N.chopped],
      [4, 'tbsp', 'nutritional-yeast'],
      [0.25, 'tsp', 'salt'],
      [0.5, 'tsp', 'black-pepper'],
      [10, 'g', 'chives', N.chopped],
      [18, 'g', 'sunflower-seeds'],
    ],
    steps: {
      en: [
        'Water-sauté the chopped onion, sliced mushrooms and garlic in a saucepan with a splash of water, adding a little more as it dries, until the mushrooms are browned, about 7 minutes.',
        'Add the oats and the water and simmer for 5 minutes, stirring.',
        'Stir in the spinach, nutritional yeast, salt and pepper until the spinach wilts.',
        'Serve topped with the chives and sunflower seeds.',
      ],
      no: [
        'Fres den hakkede løken, soppen og hvitløken i en kasserolle med en skvett vann, og tilsett litt mer etter hvert som det tørker inn, til soppen er brunet, ca. 7 minutter.',
        'Tilsett havregrynene og vannet og la det småkoke i 5 minutter under omrøring.',
        'Rør inn spinat, næringsgjær, salt og pepper til spinaten har falt sammen.',
        'Server med gressløk og solsikkefrø på toppen.',
      ],
      sv: [
        'Fräs den hackade löken, svampen och vitlöken i en kastrull med en skvätt vatten, och tillsätt lite mer när det torkar in, tills svampen är brynt, ca 7 minuter.',
        'Tillsätt havregrynen och vattnet och låt sjuda i 5 minuter under omrörning.',
        'Rör ner spenat, näringsjäst, salt och peppar tills spenaten har sjunkit ihop.',
        'Servera med gräslök och solrosfrön på toppen.',
      ],
    },
    notes: {
      en: 'Use gluten-free oats for a gluten-free porridge.',
      no: 'Bruk glutenfri havre for en glutenfri grøt.',
      sv: 'Använd glutenfri havre för en glutenfri gröt.',
    },
  },
  {
    id: 'tofu-egg-salad-rye',
    title: 'Tofu "Egg" Salad on Rye',
    no: 'Tofu-«eggesalat» på rugbrød',
    sv: 'Tofu-«äggröra» på rågbröd',
    description: {
      en: 'Crumbled tofu with yogurt, turmeric, black salt, red onion and fresh herbs, spooned onto rye bread and topped with cucumber.',
      no: 'Smuldret tofu med yoghurt, gurkemeie, svart salt, rødløk og friske urter, på rugbrød med agurk på toppen.',
      sv: 'Smulad tofu med yoghurt, gurkmeja, svart salt, rödlök och färska örter, på rågbröd med gurka ovanpå.',
    },
    servings: 4, prepTime: 15, cookTime: 0, mealTypes: ['breakfast', 'lunch'],
    portion: ['2 open sandwiches', '2 smørbrød', '2 smörgåsar'],
    rows: [
      [400, 'g', 'tofu', N.firm],
      [60, 'g', 'plant-yogurt', { en: 'unsweetened', no: 'usøtet', sv: 'osötad' }],
      [0.5, 'tsp', 'turmeric-ground'],
      [0.25, 'tsp', 'black-salt'],
      [10, 'g', 'dill', N.chopped],
      [10, 'g', 'chives', N.chopped],
      [50, 'g', 'red-onions', N.finely],
      [1, 'tbsp', 'lemon-juice'],
      [200, 'g', 'bread', RYE(8)],
      [150, 'g', 'cucumber', N.sliced],
    ],
    steps: {
      en: [
        'Crumble the tofu into a bowl with a fork.',
        'Stir in the yogurt, turmeric, black salt, lemon juice, red onion, dill and chives.',
        'Spoon onto the rye bread and top with the cucumber slices.',
      ],
      no: [
        'Smuldre tofuen i en bolle med en gaffel.',
        'Rør inn yoghurt, gurkemeie, svart salt, sitronsaft, rødløk, dill og gressløk.',
        'Fordel på rugbrødet og legg agurkskivene på toppen.',
      ],
      sv: [
        'Smula tofun i en skål med en gaffel.',
        'Rör ner yoghurt, gurkmeja, svart salt, citronsaft, rödlök, dill och gräslök.',
        'Fördela på rågbrödet och lägg gurkskivorna ovanpå.',
      ],
    },
    notes: {
      en: 'Black salt (kala namak) gives the egg flavour. The salad keeps 2 days in the fridge.',
      no: 'Svart salt (kala namak) gir eggesmaken. Salaten holder seg 2 dager i kjøleskapet.',
      sv: 'Svart salt (kala namak) ger äggsmaken. Röran håller 2 dagar i kylen.',
    },
  },
  {
    id: 'smashed-beans-avocado-rye',
    title: 'Smashed White Beans and Avocado on Rye',
    no: 'Moste hvite bønner og avokado på rugbrød',
    sv: 'Krossade vita bönor och avokado på rågbröd',
    description: {
      en: 'White beans and avocado mashed with lemon and garlic, spread thickly on rye and topped with tomato and herbs.',
      no: 'Hvite bønner og avokado most med sitron og hvitløk, smurt tykt på rugbrød med tomat og urter på toppen.',
      sv: 'Vita bönor och avokado krossade med citron och vitlök, brett tjockt på rågbröd med tomat och örter ovanpå.',
    },
    servings: 4, prepTime: 10, cookTime: 0, mealTypes: ['breakfast', 'lunch'],
    portion: ['1 open sandwich', '1 smørbrød', '1 smörgås'],
    rows: [
      [400, 'g', 'white-beans-canned', N.drained],
      [150, 'g', 'avocados', { en: '1 large', no: '1 stor', sv: '1 stor' }],
      [3, 'tbsp', 'lemon-juice'],
      [1, 'clove', 'garlic', { en: 'grated', no: 'revet', sv: 'riven' }],
      [160, 'g', 'bread', RYE(4)],
      [250, 'g', 'tomatoes', N.sliced],
      [0.25, 'tsp', 'chili-flakes', { en: 'optional', no: 'valgfritt', sv: 'valfritt' }],
      [10, 'g', 'parsley', { en: 'or cress', no: 'eller karse', sv: 'eller krasse' }],
    ],
    steps: {
      en: [
        'Mash the beans, avocado, lemon juice and garlic with a fork to a rough spread.',
        'Spread it on the bread.',
        'Top with the tomato slices, chili flakes and parsley or cress.',
      ],
      no: [
        'Mos bønnene, avokadoen, sitronsaften og hvitløken med en gaffel til et grovt pålegg.',
        'Smør det på brødet.',
        'Legg tomatskiver på toppen og dryss over chiliflak og persille eller karse.',
      ],
      sv: [
        'Krossa bönorna, avokadon, citronsaften och vitlöken med en gaffel till ett grovt pålägg.',
        'Bred det på brödet.',
        'Lägg tomatskivor ovanpå och strö över chiliflingor och persilja eller krasse.',
      ],
    },
  },
  {
    id: 'nordic-baked-beans',
    title: 'Nordic Baked Beans on Rye Toast',
    no: 'Nordiske bakte bønner på rugbrød',
    sv: 'Nordiska bakade bönor på rågbröd',
    description: {
      en: 'White beans in a smooth, smoky tomato sauce sweetened only with a date, served on toasted rye.',
      no: 'Hvite bønner i en glatt, røkt tomatsaus søtet bare med en daddel, servert på ristet rugbrød.',
      sv: 'Vita bönor i en slät, rökig tomatsås sötad bara med en dadel, serverade på rostat rågbröd.',
    },
    servings: 4, prepTime: 10, cookTime: 25, mealTypes: ['breakfast', 'lunch'],
    portion: ['1 plate', '1 tallerken', '1 tallrik'],
    rows: [
      [110, 'g', 'onions', N.chopped],
      [2, 'clove', 'garlic', N.chopped],
      [400, 'g', 'canned-tomatoes'],
      [400, 'g', 'white-beans-canned', N.drained],
      [16, 'g', 'tomato-puree'],
      [1, 'tsp', 'smoked-paprika'],
      [1, 'tsp', 'thyme-dried'],
      [20, 'g', 'medjool-dates', N.chopped],
      [160, 'g', 'bread', RYE(4, { en: ', toasted', no: ', ristet', sv: ', rostat' })],
      [10, 'g', 'parsley', N.chopped],
    ],
    steps: {
      en: [
        'Water-sauté the onion and garlic in a saucepan with a splash of water until soft, about 5 minutes.',
        'Add the tomatoes, tomato purée, dates, paprika and thyme and simmer for 10 minutes.',
        'Blend the sauce smooth, add the beans and simmer for 10 more minutes.',
        'Serve on toasted rye with the parsley.',
      ],
      no: [
        'Fres løk og hvitløk i en kasserolle med en skvett vann til de er myke, ca. 5 minutter.',
        'Tilsett tomater, tomatpuré, dadler, paprika og timian og la det småkoke i 10 minutter.',
        'Kjør sausen glatt, tilsett bønnene og la det småkoke i 10 minutter til.',
        'Server på ristet rugbrød med persille.',
      ],
      sv: [
        'Fräs lök och vitlök i en kastrull med en skvätt vatten tills de är mjuka, ca 5 minuter.',
        'Tillsätt tomater, tomatpuré, dadlar, paprika och timjan och låt sjuda i 10 minuter.',
        'Mixa såsen slät, tillsätt bönorna och låt sjuda i 10 minuter till.',
        'Servera på rostat rågbröd med persilja.',
      ],
    },
    notes: {
      en: 'The beans keep 4 days in the fridge and freeze well.',
      no: 'Bønnene holder seg 4 dager i kjøleskapet og kan fryses.',
      sv: 'Bönorna håller 4 dagar i kylen och går bra att frysa.',
    },
  },
  {
    id: 'oven-pyttipanna-tofu',
    title: 'Oven Pyttipanna with Tofu and Beetroot',
    no: 'Pytt i panne med tofu, ovnsbakt',
    sv: 'Pytt i panna med tofu, ugnsbakad',
    description: {
      en: 'The Nordic hash, baked on parchment instead of fried: potato, carrot, onion and tofu with paprika and thyme, served with beetroot.',
      no: 'Den nordiske klassikeren, bakt på bakepapir i stedet for stekt: potet, gulrot, løk og tofu med paprika og timian, servert med rødbeter.',
      sv: 'Den nordiska klassikern, bakad på bakplåtspapper i stället för stekt: potatis, morot, lök och tofu med paprika och timjan, serverad med rödbetor.',
    },
    servings: 4, prepTime: 15, cookTime: 30, mealTypes: ['breakfast', 'lunch', 'dinner'],
    portion: ['1 plate', '1 tallerken', '1 tallrik'],
    rows: [
      [600, 'g', 'potatoes'],
      [200, 'g', 'carrots'],
      [110, 'g', 'onions'],
      [300, 'g', 'tofu', N.firm],
      [1, 'tsp', 'paprika-powder'],
      [1, 'tsp', 'thyme-dried'],
      [0.5, 'tsp', 'black-pepper'],
      [0.5, 'tsp', 'salt'],
      [250, 'g', 'beetroot', { en: 'cooked, not pickled', no: 'kokt, ikke syltet', sv: 'kokt, inte inlagd' }],
      [10, 'g', 'parsley', N.chopped],
    ],
    steps: {
      en: [
        'Heat the oven to 220 °C. Dice the potatoes, carrots, onion and tofu into 1 cm cubes.',
        'Toss with the paprika, thyme, pepper and salt and spread out on a tray lined with parchment.',
        'Bake for about 30 minutes, turning once, until golden.',
        'Serve with the diced beetroot and the parsley.',
      ],
      no: [
        'Forvarm ovnen til 220 °C. Skjær poteter, gulrøtter, løk og tofu i terninger på 1 cm.',
        'Vend med paprika, timian, pepper og salt og fordel på et brett med bakepapir.',
        'Stek i ca. 30 minutter, og snu én gang, til det er gyllent.',
        'Server med rødbeter i terninger og persille.',
      ],
      sv: [
        'Sätt ugnen på 220 °C. Tärna potatis, morötter, lök och tofu i 1 cm stora tärningar.',
        'Vänd med paprika, timjan, peppar och salt och bred ut på en plåt med bakplåtspapper.',
        'Baka i ca 30 minuter, och vänd en gång, tills det är gyllene.',
        'Servera med tärnade rödbetor och persilja.',
      ],
    },
    notes: {
      en: 'Leftover cold boiled potatoes cut the baking time to 15 minutes.',
      no: 'Med kalde, kokte poteter fra dagen før tar steking bare 15 minutter.',
      sv: 'Med kall, kokt potatis från dagen innan tar ugnen bara 15 minuter.',
    },
  },
  {
    id: 'smorbrod-hummus',
    title: 'Smørbrød with Hummus, Cucumber and Radish',
    no: 'Smørbrød med hummus, agurk og reddik',
    sv: 'Smörgås med hummus, gurka och rädisor',
    description: {
      en: 'Open rye sandwiches spread with Classic Hummus and topped with thin cucumber, radish and tomato slices and dill.',
      no: 'Smørbrød av rugbrød med klassisk hummus og tynne skiver agurk, reddik og tomat, og dill.',
      sv: 'Öppna rågbrödsmackor med klassisk hummus och tunna skivor gurka, rädisor och tomat, och dill.',
    },
    servings: 4, prepTime: 15, cookTime: 0, mealTypes: ['breakfast', 'lunch'],
    portion: ['2 open sandwiches', '2 smørbrød', '2 smörgåsar'],
    relatedRecipes: ['classic-hummus'],
    rows: [
      [200, 'g', 'bread', RYE(8)],
      [200, 'g', 'classic-hummus', { en: 'homemade, see the Classic Hummus recipe', no: 'hjemmelaget, se oppskriften Klassisk hummus', sv: 'hemgjord, se receptet Klassisk hummus' }],
      [150, 'g', 'cucumber', { en: 'thinly sliced', no: 'i tynne skiver', sv: 'tunt skivad' }],
      [100, 'g', 'radishes', { en: 'thinly sliced', no: 'i tynne skiver', sv: 'tunt skivade' }],
      [200, 'g', 'tomatoes', N.sliced],
      [10, 'g', 'dill'],
    ],
    steps: {
      en: [
        'Spread the Classic Hummus on the bread. It can be made quickly: blend 200 g drained canned chickpeas, 2 tbsp tahini, 3 tbsp lemon juice, 1 clove garlic, ½ tsp ground cumin and 2–3 tbsp water until smooth.',
        'Top with the thin cucumber, radish and tomato slices and the dill.',
      ],
      no: [
        'Smør klassisk hummus på brødet. Den lages raskt: kjør 200 g avrente hermetiske kikerter, 2 ss tahini, 3 ss sitronsaft, 1 fedd hvitløk, ½ ts malt spisskummen og 2–3 ss vann glatt.',
        'Legg på tynne skiver agurk, reddik og tomat, og dill.',
      ],
      sv: [
        'Bred klassisk hummus på brödet. Den görs snabbt: mixa 200 g avrunna kikärtor på burk, 2 msk tahini, 3 msk citronsaft, 1 klyfta vitlök, ½ tsk malen spiskummin och 2–3 msk vatten slätt.',
        'Lägg på tunna skivor gurka, rädisor och tomat, och dill.',
      ],
    },
    notes: {
      en: 'The hummus is the Classic Hummus in this collection; the nutrition is calculated on it.',
      no: 'Hummusen er Klassisk hummus i denne samlingen; næringsinnholdet er regnet ut på den.',
      sv: 'Hummusen är Klassisk hummus i den här samlingen; näringsvärdet är beräknat på den.',
    },
  },
  {
    id: 'tofu-shakshuka',
    title: 'Tofu Shakshuka',
    no: 'Shakshuka med tofu',
    sv: 'Shakshuka med tofu',
    description: {
      en: 'Thick slices of tofu simmered in a spiced tomato and pepper sauce with spinach, served with rye bread.',
      no: 'Tykke skiver tofu kokt i en krydret saus av tomat og paprika med spinat, servert med rugbrød.',
      sv: 'Tjocka skivor tofu sjudna i en kryddig sås av tomat och paprika med spenat, serverade med rågbröd.',
    },
    servings: 4, prepTime: 10, cookTime: 25, mealTypes: ['breakfast', 'lunch', 'dinner'],
    portion: ['1 plate', '1 tallerken', '1 tallrik'],
    rows: [
      [110, 'g', 'onions', N.chopped],
      [300, 'g', 'bell-peppers', { en: 'red, sliced', no: 'rød, i strimler', sv: 'röd, strimlad' }],
      [2, 'clove', 'garlic', N.chopped],
      [800, 'g', 'canned-tomatoes'],
      [1, 'tsp', 'cumin-ground'],
      [1, 'tsp', 'smoked-paprika'],
      [400, 'g', 'tofu', { en: 'firm, in thick slices', no: 'fast, i tykke skiver', sv: 'fast, i tjocka skivor' }],
      [100, 'g', 'spinach'],
      [0.25, 'tsp', 'salt'],
      [10, 'g', 'parsley', N.chopped],
      [120, 'g', 'bread', RYE(4, { en: ', to serve', no: ', til servering', sv: ', till servering' })],
    ],
    steps: {
      en: [
        'Water-sauté the onion, pepper and garlic in a wide pan with a splash of water until soft, about 7 minutes.',
        'Add the tomatoes, cumin, paprika and salt and simmer for 10 minutes.',
        'Press the tofu slices into the sauce, add the spinach, cover and simmer for 8 minutes.',
        'Sprinkle with the parsley and serve with the rye bread.',
      ],
      no: [
        'Fres løk, paprika og hvitløk i en vid panne med en skvett vann til det er mykt, ca. 7 minutter.',
        'Tilsett tomater, spisskummen, paprika og salt og la det småkoke i 10 minutter.',
        'Trykk tofuskivene ned i sausen, tilsett spinaten, legg på lokk og la det småkoke i 8 minutter.',
        'Dryss over persille og server med rugbrød.',
      ],
      sv: [
        'Fräs lök, paprika och vitlök i en vid panna med en skvätt vatten tills det är mjukt, ca 7 minuter.',
        'Tillsätt tomater, spiskummin, paprika och salt och låt sjuda i 10 minuter.',
        'Tryck ner tofuskivorna i såsen, tillsätt spenaten, lägg på lock och låt sjuda i 8 minuter.',
        'Strö över persilja och servera med rågbröd.',
      ],
    },
    notes: {
      en: 'Leave out the bread (or use gluten-free bread) for a gluten-free shakshuka.',
      no: 'Dropp brødet (eller bruk glutenfritt brød) for en glutenfri shakshuka.',
      sv: 'Hoppa över brödet (eller använd glutenfritt bröd) för en glutenfri shakshuka.',
    },
  },
  {
    id: 'savoury-buckwheat-porridge',
    title: 'Savoury Buckwheat Porridge with Leek and Peas',
    no: 'Bokhvetegrøt med purre og erter',
    sv: 'Bovetegröt med purjolök och ärtor',
    description: {
      en: 'Buckwheat simmered with leek, peas stirred in at the end, finished with nutritional yeast, lemon, dill and pumpkin seeds.',
      no: 'Bokhvete kokt med purre, erter rørt inn til slutt, og næringsgjær, sitron, dill og gresskarkjerner på toppen.',
      sv: 'Bovete kokt med purjolök, ärtor nedrörda på slutet, och näringsjäst, citron, dill och pumpakärnor på toppen.',
    },
    servings: 4, prepTime: 5, cookTime: 15, mealTypes: ['breakfast'],
    portion: ['1 bowl', '1 bolle', '1 skål'],
    rows: [
      [200, 'g', 'buckwheat-groats'],
      [7, 'dl', 'water'],
      [200, 'g', 'leeks', N.sliced],
      [200, 'g', 'green-peas', { en: 'frozen', no: 'frosne', sv: 'frysta' }],
      [3, 'tbsp', 'nutritional-yeast'],
      [1, 'tbsp', 'lemon-juice'],
      [10, 'g', 'dill', N.chopped],
      [0.25, 'tsp', 'salt'],
      [0.5, 'tsp', 'black-pepper'],
      [30, 'g', 'pumpkin-seeds'],
    ],
    steps: {
      en: [
        'Rinse the buckwheat in a sieve.',
        'Simmer it with the sliced leek and the water for 12 minutes, adding the peas for the last 3 minutes.',
        'Stir in the nutritional yeast, lemon juice, salt and pepper.',
        'Serve topped with the dill and pumpkin seeds.',
      ],
      no: [
        'Skyll bokhveten i en sil.',
        'Kok den med purren og vannet i 12 minutter, og tilsett ertene de siste 3 minuttene.',
        'Rør inn næringsgjær, sitronsaft, salt og pepper.',
        'Server med dill og gresskarkjerner på toppen.',
      ],
      sv: [
        'Skölj bovetet i en sil.',
        'Koka det med purjolöken och vattnet i 12 minuter, och tillsätt ärtorna de sista 3 minuterna.',
        'Rör ner näringsjäst, citronsaft, salt och peppar.',
        'Servera med dill och pumpakärnor på toppen.',
      ],
    },
  },
]

function rowsFor(lang, rows) {
  return rows.map(([quantity, unit, id, note]) => {
    const e = BY_ID.get(id)
    if (!e) throw new Error(`not in the dictionary: ${id}`)
    const row = { quantity, unit, ingredient: id, name: e.names[lang] }
    if (note) row.note = note[lang]
    return row
  })
}

;(async () => {
  const { estimateRecipe, PACK_KEY, round } = await import('./lib/recipeNutritionEstimate.mjs')
  const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))

  let globalMax = 0
  const allIds = new Set()
  for (const f of PACKS) {
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
    for (const r of j.recipes) { globalMax = Math.max(globalMax, r.createdAt || 0); allIds.add(r.id) }
  }

  RECIPES.forEach((src, k) => {
    if (allIds.has(src.id)) throw new Error(`${src.id} already exists`)
    const ingredients = rowsFor('en', src.rows)
    const est = estimateRecipe({ ingredients })
    if (est.problems.length) throw new Error(`${src.id}: ${est.problems.join('; ')}`)
    const perServing = {}
    for (const [field, key] of Object.entries(PACK_KEY)) perServing[key] = round(est.totals[field] / src.servings, field)
    const grams = Math.round(est.weight / src.servings)
    const [pen, pno, psv] = src.portion
    const tr = (lang, title) => ({
      title,
      description: src.description[lang],
      ingredients: rowsFor(lang, src.rows),
      steps: src.steps[lang],
      ...(src.notes ? { notes: src.notes[lang] } : {}),
      portion: `${lang === 'no' ? pno : psv} (~${grams} g)`,
    })
    const recipe = {
      id: src.id,
      title: src.title,
      category: 'Breakfast',
      servings: src.servings,
      portion: `${pen} (~${grams} g)`,
      prepTime: src.prepTime,
      cookTime: src.cookTime,
      imageUrl: fs.readFileSync(path.join(IMG_DIR, src.id + '.b64'), 'utf8').trim(),
      description: src.description.en,
      tags: ['fredheim', 'breakfast', 'vegan'],
      mealTypes: src.mealTypes,
      kcal: Math.round(perServing.calories),
      servingWeightGrams: grams,
      nutrition: { perServing },
      ...(src.relatedRecipes ? { relatedRecipes: src.relatedRecipes } : {}),
      ingredients,
      steps: src.steps.en,
      ...(src.notes ? { notes: src.notes.en } : {}),
      translations: { no: tr('no', src.no), sv: tr('sv', src.sv) },
      createdAt: globalMax + 3600000 * (k + 1),
    }
    for (const lang of ['no', 'sv']) {
      if (recipe.translations[lang].steps.length !== recipe.steps.length) throw new Error(`${src.id} ${lang}: step count`)
    }
    pack.recipes.push(recipe)
    const n = perServing
    console.log(`${src.id}: ${grams} g/serving · ${n.calories} kcal · protein ${n.protein} g · fibre ${n.fiber} g · sodium ${n.sodium} mg · image ${Math.round(recipe.imageUrl.length * 3 / 4 / 1024)} KB`)
  })

  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
  pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  fs.writeFileSync(TARGET, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`Pack -> ${pack.version}`)
})()

/* Adds "Vegan Tzatziki Sauce" to the recipes-with-pictures pack.
 *
 * No nutrition table was supplied with this recipe, unlike the reversal-
 * protocol batches — so, matching the ~170 other fr-* recipes in this same
 * pack that also carry no nutrition object, this entry ships without one
 * rather than an invented figure. Condition tags (blood-pressure-friendly
 * etc.) are computed from real nutrition by audit_condition_tags.cjs, so
 * none are applied here either.
 *
 * Ingredient amounts are the author's Swedish figures, unit-converted
 * (g/ml/clove/pinch) but otherwise unchanged. Step text is de-quantified —
 * no amounts restated inline — so portion scaling doesn't strand a number
 * that no longer matches.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const IMG = 'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/tzatziki_b64.txt'

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.find(r => r.id === 'vegan-tzatziki-sauce')) throw new Error('already exists')

const imageUrl = fs.readFileSync(IMG, 'utf8').trim()

const recipe = {
  id: 'vegan-tzatziki-sauce',
  title: 'Vegan Tzatziki Sauce',
  category: 'Sauce',
  servings: 2,
  prepTime: 15,
  cookTime: 0,
  imageUrl,
  description: 'Creamy vegan tzatziki with cashews, cucumber and fresh dill.',
  tags: ['fredheim', 'sauce', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 0,
  ingredients: [
    { quantity: 131, unit: 'g', name: 'unsweetened vegan yogurt' },
    { quantity: 22, unit: 'ml', name: 'fresh lemon juice' },
    { quantity: 1, unit: 'clove', name: 'garlic' },
    { quantity: 32.5, unit: 'g', name: 'raw cashews, soaked 10-20 minutes' },
    { quantity: 7, unit: 'g', name: 'fresh dill, chopped' },
    { quantity: 80, unit: 'g', name: 'cucumber, peeled and grated' },
    { quantity: 1.5, unit: 'pinch', name: 'salt' },
  ],
  steps: [
    'Soak the cashews: cover them with hot water and leave 10-20 minutes, until soft.',
    'Prepare the cucumber: peel and finely grate it, then squeeze out the excess moisture with a clean kitchen towel or paper towel.',
    'Blend the base: drain the cashews. Put them in a blender or food processor with the yogurt, lemon juice and garlic. Blend until completely smooth.',
    'Combine: fold in the prepared cucumber, dill and salt. Stir well to combine.',
    'Chill: taste and adjust the seasoning. Cover and refrigerate for at least 30 minutes before serving so the flavours can develop.',
  ],
  notes: 'Makes about 2 servings. The dill amount is roughly 2 tbsp chopped fresh dill, and the cucumber is about 1/4 of a medium cucumber. Soaking the cashews first is what gives the creamier texture. Keeps refrigerated up to 4-5 days.',
  translations: {
    no: {
      title: 'Vegansk tzatziki-saus',
      description: 'Kremet vegansk tzatziki med cashewnøtter, agurk og fersk dill.',
      ingredients: [
        { quantity: 131, unit: 'g', name: 'usøtet vegansk yoghurt' },
        { quantity: 22, unit: 'ml', name: 'fersk sitronsaft' },
        { quantity: 1, unit: 'clove', name: 'hvitløk' },
        { quantity: 32.5, unit: 'g', name: 'rå cashewnøtter, bløtlagt 10-20 minutter' },
        { quantity: 7, unit: 'g', name: 'fersk dill, hakket' },
        { quantity: 80, unit: 'g', name: 'agurk, skrelt og revet' },
        { quantity: 1.5, unit: 'pinch', name: 'salt' },
      ],
      steps: [
        'Bløtlegg cashewnøttene: dekk dem med varmt vann og la stå i 10-20 minutter, til de er myke.',
        'Forbered agurken: skrell den og riv den fint, press deretter ut overskuddsvæsken med et rent kjøkkenhåndkle eller tørkepapir.',
        'Kjør basen: hell av vannet fra cashewnøttene. Ha dem i en blender eller foodprosessor sammen med yoghurten, sitronsaften og hvitløken. Kjør til det er helt glatt.',
        'Kombiner: vend inn den forberedte agurken, dillen og saltet. Rør godt sammen.',
        'Avkjøl: smak til og juster kryddingen. Dekk til og sett i kjøleskapet i minst 30 minutter før servering, slik at smakene får utvikle seg.',
      ],
      notes: 'Gir omtrent 2 porsjoner. Dillmengden tilsvarer ca. 2 ss hakket fersk dill, og agurken er ca. 1/4 av en middels agurk. Å bløtlegge cashewnøttene først gir den kremete teksturen. Holder seg i kjøleskap i 4-5 dager.',
    },
    sv: {
      title: 'Tzatziki sås (vegansk)',
      description: 'Vegansk tzatziki-sås med cashewnötter, gurka och färsk dill.',
      ingredients: [
        { quantity: 131, unit: 'g', name: 'osötad vegansk yoghurt' },
        { quantity: 22, unit: 'ml', name: 'färsk citronjuice' },
        { quantity: 1, unit: 'clove', name: 'vitlök' },
        { quantity: 32.5, unit: 'g', name: 'rå cashewnötter, blötlagda 10-20 minuter' },
        { quantity: 7, unit: 'g', name: 'färsk dill, hackad' },
        { quantity: 80, unit: 'g', name: 'gurka, skalad och riven' },
        { quantity: 1.5, unit: 'pinch', name: 'salt' },
      ],
      steps: [
        'Blötlägg cashewnötterna: täck dem med hett vatten och låt stå i 10-20 minuter, tills de är mjuka.',
        'Förbered gurkan: skala den och riv den fint, pressa sedan ur överskottsfukten med en ren kökshandduk eller pappershandduk.',
        'Mixa basen: häll av vattnet från cashewnötterna. Lägg dem i en blandare eller matberedare tillsammans med yoghurten, citronjuicen och vitlöken. Mixa tills helt slätt.',
        'Kombinera: vänd i den förberedda gurkan, dillen och saltet. Rör väl för att kombinera.',
        'Kyl: smaka av och justera kryddningen. Täck och ställ i kylskåp minst 30 minuter före servering så att smakerna får utvecklas.',
      ],
      notes: 'Receptet ger ungefär 2 portioner. Dillmängden motsvarar cirka 2 msk hackad färsk dill, och gurkan är cirka 1/4 av en medelstor gurka. Att blötlägga cashewnötterna i förväg ger den krämigare texturen. Håller sig i kylskåp i 4-5 dagar.',
    },
  },
  createdAt: 1785387600000,
}

pack.recipes.push(recipe)

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${recipe.id} — pack -> ${pack.version}, ${pack.recipes.length} recipes total`)

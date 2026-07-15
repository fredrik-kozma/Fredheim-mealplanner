/*
 * Appends 10 recipes (orn-14..orn-23) to the Fredheim Reversal Protocol
 * pack, transcribed from the user's PDF. Each carries EN/NO/SV content,
 * chef's notes, per-serving nutrition (from the source panels), and base
 * tags. Condition tags are assigned afterwards by audit_condition_tags.cjs.
 *
 * Steps are genericised (no inline quantities) so servings scale cleanly,
 * matching the rest of the pack. Notes are kept verbatim (advisory text).
 * Images are left null — the user adds photos later; re-running preserves
 * any already-added imageUrl.
 *
 * Run: node scripts/gen_reversal_additions.cjs
 */
const fs = require('fs')
const path = require('path')

const S_EN = 'Sea salt, to taste'
const S_NO = 'Havsalt, etter smak'
const S_SV = 'Havssalt, efter smak'

// perServing helper — only the values reliably read from the panels.
const nut = (o) => ({ cholesterol: 0, addedSugar: 0, ...o })

const RECIPES = [
  {
    id: 'orn-14', category: 'Salad', servings: 2, prepTime: 10, cookTime: 0, weight: 383,
    tags: ['ornish-green', 'salad', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
    en: {
      title: 'Black Bean & Tomato Breakfast Salad',
      description: 'A fresh, filling, protein-rich salad that works as a light breakfast or quick lunch — vibrant, earthy, sweet-sour, and ready in under 10 minutes.',
      notes: 'Ground flaxseed is always added off-heat and per bowl to preserve ALA omega-3 integrity — never cook it in. Chop the dates as finely as possible; they soften into the dressing and distribute sweetness evenly through every bite. For batch cooking, store undressed and add lemon, salt and flaxseed fresh per serving. Keeps refrigerated for up to 24 hours. If using canned black beans, rinse very thoroughly — residual canning liquid can add 50–80 mg sodium per serving.',
    },
    no: {
      title: 'Frokostsalat med sorte bønner og tomat',
      description: 'En frisk, mettende og proteinrik salat som fungerer som lett frokost eller rask lunsj — fargerik, jordnær, søtsyrlig og klar på under 10 minutter.',
      notes: 'Malt linfrø tilsettes alltid utenom varmen og per skål for å bevare ALA-omega-3 — kok det aldri inn. Hakk dadlene så fint som mulig; de mykner inn i dressingen og fordeler søtheten jevnt. Til matprep: oppbevar udressert og tilsett sitron, salt og linfrø ferskt per porsjon. Holder seg i kjøleskap i opptil 24 timer. Bruker du hermetiske bønner, skyll dem svært godt — restvæske kan tilføre 50–80 mg natrium per porsjon.',
    },
    sv: {
      title: 'Frukostsallad med svarta bönor och tomat',
      description: 'En fräsch, mättande och proteinrik sallad som fungerar som lätt frukost eller snabb lunch — färgstark, jordnära, sötsyrlig och klar på under 10 minuter.',
      notes: 'Malet linfrö tillsätts alltid utanför värmen och per skål för att bevara ALA-omega-3 — koka aldrig in det. Hacka dadlarna så fint som möjligt; de mjuknar in i dressingen och fördelar sötman jämnt. För matprep: förvara odressad och tillsätt citron, salt och linfrö färskt per portion. Håller sig i kylen i upp till 24 timmar. Använder du bönor på burk, skölj dem mycket noga — restvätska kan tillföra 50–80 mg natrium per portion.',
    },
    ings: [
      [240, 'g', 'Cooked black beans (rinsed if canned)', 'Kokte sorte bønner (skylt hvis hermetiske)', 'Kokta svarta bönor (sköljda om burk)'],
      [300, 'g', 'Ripe tomatoes, chopped', 'Modne tomater, hakket', 'Mogna tomater, hackade'],
      [100, 'g', 'Red bell pepper, diced', 'Rød paprika, i terninger', 'Röd paprika, tärnad'],
      [50, 'g', 'Red onion, thinly sliced', 'Rødløk, tynt skivet', 'Rödlök, tunt skivad'],
      [42, 'g', 'Medjool dates, pitted and finely chopped', 'Medjooldadler, uten stein og finhakket', 'Medjooldadlar, urkärnade och finhackade'],
      [15, 'g', 'Fresh cilantro, chopped', 'Frisk koriander, hakket', 'Färsk koriander, hackad'],
      [1, 'pcs', 'Lemon, juice only', 'Sitron, kun saften', 'Citron, endast saften'],
      [1, 'tsp', 'Ground cumin', 'Malt spisskummen', 'Malen spiskummin'],
      [0.5, 'tsp', 'Smoked paprika', 'Røkt paprika', 'Rökt paprika'],
      [14, 'g', 'Ground flaxseed', 'Malt linfrø', 'Malet linfrö'],
      [0.3, 'tsp', S_EN, S_NO, S_SV],
    ],
    steps: [
      ['Combine the black beans, tomatoes, red pepper, red onion and finely chopped dates in a large bowl. Toss together.', 'Ha sorte bønner, tomater, paprika, rødløk og finhakkede dadler i en stor bolle. Vend sammen.', 'Lägg svarta bönor, tomater, paprika, rödlök och finhackade dadlar i en stor skål. Vänd samman.'],
      ['Sprinkle in the cumin, smoked paprika and salt. Squeeze over the lemon juice and toss well to coat everything.', 'Dryss over spisskummen, røkt paprika og salt. Press over sitronsaften og vend godt så alt dekkes.', 'Strö över spiskummin, rökt paprika och salt. Pressa över citronsaften och vänd väl så allt täcks.'],
      ['Scatter the cilantro and ground flaxseed over the top and toss gently. Let the salad rest 5 minutes before serving — the sweet-sour contrast deepens as it sits.', 'Dryss koriander og malt linfrø over toppen og vend forsiktig. La salaten hvile i 5 minutter før servering — den søtsyrlige kontrasten blir dypere når den står.', 'Strö koriander och malet linfrö över och vänd försiktigt. Låt salladen vila i 5 minuter före servering — den sötsyrliga kontrasten fördjupas när den står.'],
    ],
    nutrition: nut({ calories: 246, protein: 12.9, totalFat: 3.6, saturatedFat: 0.4, polyunsaturatedFat: 2.3, omega3: 1.6, totalCarbs: 44, totalSugars: 12, fiber: 11, sodium: 290, potassium: 890 }),
  },

  {
    id: 'orn-15', category: 'Drink', servings: 1, prepTime: 5, cookTime: 0, weight: 270,
    tags: ['ornish-green', 'drink', 'vegan', 'oil-free', 'no-added-sugar', 'caffeine-free'],
    en: {
      title: 'Barley Coffee Evening Latte',
      description: 'A rich, creamy, caffeine-free evening drink made with barley coffee powder — ready in 5 minutes. Malty, gently sweet and deeply cozy.',
      notes: 'Strength: use 1 tsp powder for a milder drink, 3 tsp for something bolder and more coffee-like. No blender needed: mash 1–2 soft Medjool dates with a fork into a paste, then whisk into the warm oat milk (strain if needed). Spiced version: add a tiny pinch of cardamom or a drop of vanilla alongside the cinnamon. Batch: blend a larger batch of date-oat milk and keep in the fridge for 3 days; heat one portion each evening.',
    },
    no: {
      title: 'Byggkaffe-kveldslatte',
      description: 'En fyldig, kremet og koffeinfri kveldsdrikk laget med byggkaffepulver — klar på 5 minutter. Maltete, mildt søt og skikkelig koselig.',
      notes: 'Styrke: bruk 1 ts pulver for en mildere drikk, 3 ts for noe kraftigere og mer kaffelignende. Uten blender: mos 1–2 myke medjooldadler til en pasta med en gaffel, og visp inn i den varme havremelken (sil om nødvendig). Krydret versjon: tilsett en liten klype kardemomme eller en dråpe vanilje sammen med kanelen. Batch: kjør en større porsjon dadel-havremelk og oppbevar i kjøleskapet i 3 dager; varm én porsjon hver kveld.',
    },
    sv: {
      title: 'Kornkaffe-kvällslatte',
      description: 'En fyllig, krämig och koffeinfri kvällsdryck gjord på kornkaffepulver — klar på 5 minuter. Maltig, milt söt och riktigt mysig.',
      notes: 'Styrka: använd 1 tsk pulver för en mildare dryck, 3 tsk för något kraftigare och mer kaffelikt. Utan mixer: mosa 1–2 mjuka medjooldadlar till en pasta med en gaffel och vispa ner i den varma havremjölken (sila vid behov). Kryddad version: tillsätt en liten nypa kardemumma eller en droppe vanilj tillsammans med kanelen. Batch: mixa en större sats dadel-havremjölk och förvara i kylen i 3 dagar; värm en portion varje kväll.',
    },
    ings: [
      [2, 'tsp', 'Barley coffee powder (e.g. Inka, Caro)', 'Byggkaffepulver (f.eks. Inka, Caro)', 'Kornkaffepulver (t.ex. Inka, Caro)'],
      [200, 'ml', 'Unsweetened oat milk', 'Usøtet havremelk', 'Osötad havremjölk'],
      [50, 'ml', 'Hot water', 'Varmt vann', 'Hett vatten'],
      [15, 'g', 'Medjool dates, pitted', 'Medjooldadler, uten stein', 'Medjooldadlar, urkärnade'],
      [0.3, 'tsp', 'Ground cinnamon', 'Malt kanel', 'Malen kanel'],
    ],
    steps: [
      ['Blend the dates with the oat milk on high for about 30 seconds until completely smooth and creamy — this is your date-oat milk base.', 'Kjør dadlene med havremelken på høy hastighet i ca. 30 sekunder til det er helt glatt og kremet — dette er dadel-havremelk-basen din.', 'Mixa dadlarna med havremjölken på hög hastighet i ca 30 sekunder tills helt slätt och krämigt — detta är din dadel-havremjölksbas.'],
      ['Pour the hot water into your mug, add the barley coffee powder and stir well until fully dissolved — no lumps.', 'Hell det varme vannet i koppen, tilsett byggkaffepulveret og rør godt til det er helt oppløst — ingen klumper.', 'Häll det heta vattnet i muggen, tillsätt kornkaffepulvret och rör väl tills det är helt upplöst — inga klumpar.'],
      ['Warm the blended date-oat milk in a small saucepan over low-medium heat until steaming — do not boil. Froth it now if you have a frother.', 'Varm den blandede dadel-havremelken i en liten kjele på lav-middels varme til den damper — ikke kok. Skum den nå hvis du har en melkeskummer.', 'Värm den mixade dadel-havremjölken i en liten kastrull på låg-medelvärme tills den ryker — koka inte. Skumma den nu om du har en mjölkskummare.'],
      ['Pour the hot date-oat milk into the mug over the dissolved barley coffee, stir gently and dust with cinnamon on top.', 'Hell den varme dadel-havremelken i koppen over den oppløste byggkaffen, rør forsiktig og dryss kanel på toppen.', 'Häll den varma dadel-havremjölken i muggen över det upplösta kornkaffet, rör försiktigt och pudra kanel över.'],
    ],
    nutrition: nut({ calories: 105, protein: 2.3, totalFat: 1.6, saturatedFat: 0.2, polyunsaturatedFat: 0.35, monounsaturatedFat: 0.45, omega3: 0.04, omega6: 0.3, totalCarbs: 20, totalSugars: 10, fiber: 1.2, sodium: 50, potassium: 195 }),
  },

  {
    id: 'orn-16', category: 'Salad', servings: 4, prepTime: 15, cookTime: 0, weight: 210,
    tags: ['ornish-green', 'salad', 'vegan', 'oil-free', 'no-added-sugar'],
    en: {
      title: 'Red Cabbage & Edamame Salad with Sweet-Sour-Savory Dressing',
      description: 'Crunchy shredded red cabbage meets creamy edamame in a punchy miso-date-lemon dressing. Bold, colorful and ready in 15 minutes.',
      notes: "A few things to notice: the omega-6:omega-3 ratio is excellent at 0.6:1 (well below the 4:1 target), vitamin K is very high thanks to the red cabbage and parsley, and vitamin C lands at 90% NRV. The date-miso-lemon combination is a punchy sweet-sour-savory dressing that needs no oil whatsoever to feel rich. The miso contributes about 190 mg sodium — manageable within the 300 mg threshold across 4 servings.",
    },
    no: {
      title: 'Rødkål- og edamamesalat med søtsyrlig-salt dressing',
      description: 'Sprø, finstrimlet rødkål møter kremet edamame i en fyldig dressing av miso, dadler og sitron. Frekk, fargerik og klar på 15 minutter.',
      notes: 'Verdt å merke seg: omega-6:omega-3-forholdet er utmerket på 0,6:1 (godt under målet på 4:1), vitamin K er svært høyt takket være rødkål og persille, og vitamin C ligger på 90 % av anbefalt inntak. Dad, miso og sitron gir en fyldig søtsyrlig-salt dressing som ikke trenger olje i det hele tatt for å kjennes rik. Misoen bidrar med ca. 190 mg natrium — håndterbart innenfor terskelen på 300 mg fordelt på 4 porsjoner.',
    },
    sv: {
      title: 'Rödkåls- och edamamesallad med sötsyrlig-salt dressing',
      description: 'Krispig, strimlad rödkål möter krämig edamame i en fyllig dressing av miso, dadlar och citron. Fräck, färgstark och klar på 15 minuter.',
      notes: 'Värt att notera: omega-6:omega-3-förhållandet är utmärkt på 0,6:1 (långt under målet 4:1), vitamin K är mycket högt tack vare rödkålen och persiljan, och vitamin C ligger på 90 % av rekommenderat intag. Dadlar, miso och citron ger en fyllig sötsyrlig-salt dressing som inte behöver någon olja alls för att kännas rik. Mison bidrar med ca 190 mg natrium — hanterbart inom tröskeln 300 mg fördelat på 4 portioner.',
    },
    ings: [
      [400, 'g', 'Red cabbage, finely shredded', 'Rødkål, finstrimlet', 'Rödkål, fint strimlad'],
      [200, 'g', 'Shelled edamame (cooked from frozen)', 'Skallet edamame (kokt fra frossen)', 'Skalad edamame (kokt från fryst)'],
      [15, 'g', 'Fresh flat-leaf parsley, chopped', 'Frisk bladpersille, hakket', 'Färsk slätbladig persilja, hackad'],
      [40, 'g', 'Medjool dates, pitted', 'Medjooldadler, uten stein', 'Medjooldadlar, urkärnade'],
      [20, 'g', 'White miso (shiro)', 'Hvit miso (shiro)', 'Vit miso (shiro)'],
      [45, 'ml', 'Fresh lemon juice', 'Fersk sitronsaft', 'Färsk citronsaft'],
      [15, 'g', 'Ground flaxseed', 'Malt linfrø', 'Malet linfrö'],
    ],
    steps: [
      ['Make the dressing: blend the dates, white miso and lemon juice with a splash of water until completely smooth and glossy.', 'Lag dressingen: kjør dadler, hvit miso og sitronsaft med en skvett vann til det er helt glatt og blankt.', 'Gör dressingen: mixa dadlar, vit miso och citronsaft med en skvätt vatten tills helt slätt och blankt.'],
      ['Put the shredded red cabbage and cooked edamame in a large bowl. Pour over the dressing and toss thoroughly to coat every strand.', 'Ha den finstrimlede rødkålen og kokt edamame i en stor bolle. Hell over dressingen og vend godt så alt dekkes.', 'Lägg den strimlade rödkålen och kokt edamame i en stor skål. Häll över dressingen och vänd väl så allt täcks.'],
      ['Fold in the chopped parsley and ground flaxseed. Serve straight away, or let it sit 10 minutes for the flavours to deepen.', 'Vend inn hakket persille og malt linfrø. Server med en gang, eller la den stå i 10 minutter så smakene blir dypere.', 'Vänd ner hackad persilja och malet linfrö. Servera direkt, eller låt stå i 10 minuter så smakerna fördjupas.'],
    ],
    nutrition: nut({ calories: 178, protein: 9.8, totalFat: 5.1, saturatedFat: 0.6, polyunsaturatedFat: 2.8, monounsaturatedFat: 1.1, omega3: 1.7, omega6: 1.0, totalCarbs: 24.5, totalSugars: 12.8, fiber: 7.4, sodium: 195, potassium: 620 }),
  },

  {
    id: 'orn-17', category: 'Bread', servings: 8, prepTime: 25, cookTime: 45, weight: 107,
    tags: ['ornish-green', 'bread', 'vegan', 'oil-free', 'no-added-sugar', 'gluten-free'],
    en: {
      title: 'Gluten-Free Oat & Potato Bread Rolls',
      description: 'Soft, fluffy gluten-free oat bread rolls with brown rice flour and mashed potato — oil-free, sugar-free and Ornish GREEN compliant. Makes 8 rolls.',
      notes: 'Why the water is reduced to 300 ml: the mashed potato adds moisture, so total liquid is reduced slightly from 320 ml. Adjust by 1–2 tbsp if the dough feels too stiff or too wet — potato size and moisture varies. Mashed potato tip: cook and mash it the day before if convenient; cold mash works fine. Ground flaxseed goes into the dry mix (not the wet) to prevent premature gelling. Storage: keeps 3–4 days airtight; freezes well up to 1 month — slice before freezing.',
    },
    no: {
      title: 'Glutenfrie havre- og potetrundstykker',
      description: 'Myke, luftige glutenfrie havrebrødrundstykker med brunt rismel og potetmos — oljefrie, sukkerfrie og Ornish GREEN. Gir 8 rundstykker.',
      notes: 'Hvorfor vannet er redusert til 300 ml: potetmosen tilfører fukt, så total væske reduseres litt fra 320 ml. Juster med 1–2 ss hvis deigen kjennes for stiv eller for våt — potetstørrelse og fuktighet varierer. Potettips: kok og mos poteten dagen før om det passer; kald mos fungerer fint. Malt linfrø går i den tørre blandingen (ikke den våte) for å hindre for tidlig gelling. Oppbevaring: holder 3–4 dager lufttett; fryser godt i opptil 1 måned — skjær i skiver før frysing.',
    },
    sv: {
      title: 'Glutenfria havre- och potatisfrallor',
      description: 'Mjuka, luftiga glutenfria havrebrödsfrallor med brunt rismjöl och potatismos — oljefria, sockerfria och Ornish GREEN. Ger 8 frallor.',
      notes: 'Varför vattnet minskas till 300 ml: potatismoset tillför fukt, så total vätska minskas något från 320 ml. Justera med 1–2 msk om degen känns för styv eller för blöt — potatisstorlek och fukt varierar. Potatistips: koka och mosa den dagen innan om det passar; kall mos fungerar bra. Malet linfrö går i den torra blandningen (inte den blöta) för att förhindra för tidig gelning. Förvaring: håller 3–4 dagar lufttätt; fryser bra i upp till 1 månad — skiva före frysning.',
    },
    ings: [
      [200, 'g', 'Gluten-free oat flour', 'Glutenfritt havremel', 'Glutenfritt havremjöl'],
      [120, 'g', 'Brown rice flour', 'Brunt rismel', 'Brunt rismjöl'],
      [100, 'g', 'Plain cooked mashed potato (no additions)', 'Kokt potet, most (uten tilsetninger)', 'Kokt potatis, mosad (utan tillsatser)'],
      [12, 'g', 'Psyllium husk powder', 'Psylliumhusk-pulver', 'Psylliumfrö-pulver'],
      [8, 'g', 'Ground flaxseed', 'Malt linfrø', 'Malet linfrö'],
      [10, 'g', 'Dry yeast', 'Tørrgjær', 'Torrjäst'],
      [3, 'g', 'Salt', 'Salt', 'Salt'],
      [150, 'ml', 'Water (for the oat porridge)', 'Vann (til havregrøten)', 'Vatten (till havregröten)'],
      [15, 'ml', 'Fresh lemon juice', 'Fersk sitronsaft', 'Färsk citronsaft'],
      [300, 'ml', 'Lukewarm water (38–40°C)', 'Lunkent vann (38–40°C)', 'Ljummet vatten (38–40°C)'],
    ],
    steps: [
      ['Boil a medium potato until fully soft, drain and mash completely smooth. Set aside to cool to room temperature.', 'Kok en middels potet til den er helt myk, hell av og mos den helt glatt. Sett til side og la avkjøle til romtemperatur.', 'Koka en medelstor potatis tills helt mjuk, häll av och mosa helt slät. Ställ åt sidan och låt svalna till rumstemperatur.'],
      ['Make an oat porridge: cook a small amount of the oat flour with the porridge water over medium heat, stirring, until thickened (2–3 minutes). Cool to room temperature.', 'Lag en havregrøt: kok en liten mengde av havremelet med grøtvannet på middels varme mens du rører, til det tykner (2–3 minutter). Avkjøl til romtemperatur.', 'Gör en havregröt: koka en liten mängd av havremjölet med gröt-vattnet på medelvärme under omrörning tills det tjocknat (2–3 minuter). Svalna till rumstemperatur.'],
      ['Whisk together the remaining oat flour, brown rice flour, psyllium husk powder, ground flaxseed, dry yeast and salt in a large bowl.', 'Visp sammen resten av havremelet, brunt rismel, psylliumhusk-pulver, malt linfrø, tørrgjær og salt i en stor bolle.', 'Vispa samman resten av havremjölet, brunt rismjöl, psylliumpulver, malet linfrö, torrjäst och salt i en stor skål.'],
      ['In a separate bowl combine the cooled oat porridge, mashed potato, lemon juice and lukewarm water. Mix until smooth.', 'I en egen bolle blander du den avkjølte havregrøten, potetmosen, sitronsaften og det lunkne vannet. Bland til det er glatt.', 'I en separat skål blandar du den svalnade havregröten, potatismoset, citronsaften och det ljumma vattnet. Blanda tills slätt.'],
      ['Pour the wet ingredients into the dry and mix vigorously for 4–5 minutes until the dough is sticky but holds shape when formed with a wet hand. Add 1–2 tbsp water if too stiff.', 'Hell de våte ingrediensene i de tørre og bland kraftig i 4–5 minutter til deigen er klissete men holder formen når du former den med våt hånd. Tilsett 1–2 ss vann om den er for stiv.', 'Häll de blöta ingredienserna i de torra och blanda kraftigt i 4–5 minuter tills degen är kladdig men håller formen när du formar den med blöt hand. Tillsätt 1–2 msk vatten om för styv.'],
      ['Shape 8 round rolls with a wet hand on a lined baking tray. Cover loosely and let rise at room temperature 45–50 minutes until visibly puffed.', 'Form 8 runde rundstykker med våt hånd på et brett med bakepapir. Dekk løst til og la heve i romtemperatur i 45–50 minutter til de er tydelig hevet.', 'Forma 8 runda frallor med blöt hand på en plåt med bakplåtspapper. Täck löst och låt jäsa i rumstemperatur 45–50 minuter tills tydligt puffade.'],
      ['Bake at 220°C for about 10 minutes, then reduce to 190°C and bake a further 18 minutes until light golden. The base should sound hollow.', 'Stek ved 220°C i ca. 10 minutter, skru så ned til 190°C og stek videre i 18 minutter til de er lyst gyllne. Bunnen skal høres hul ut.', 'Grädda vid 220°C i ca 10 minuter, sänk sedan till 190°C och grädda ytterligare 18 minuter tills ljust gyllene. Botten ska låta ihålig.'],
      ['Cool on a rack for at least 60 minutes before eating — the crumb keeps setting as it cools.', 'Avkjøl på rist i minst 60 minutter før servering — krummen setter seg videre mens den avkjøles.', 'Svalna på galler i minst 60 minuter innan servering — inkråmet sätter sig medan det svalnar.'],
    ],
    nutrition: nut({ calories: 191, protein: 5.4, totalFat: 3.2, saturatedFat: 0.5, polyunsaturatedFat: 1.5, monounsaturatedFat: 0.8, omega3: 0.65, omega6: 0.72, totalCarbs: 36.5, totalSugars: 0.7, fiber: 6.3, sodium: 188 }),
  },

  {
    id: 'orn-18', category: 'Breakfast', servings: 4, prepTime: 10, cookTime: 0, weight: 369,
    tags: ['ornish-green', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
    en: {
      title: 'Carob Dream Overnight Oats',
      description: 'Silky carob-date overnight oats with banana and cinnamon — tastes like dessert, scores like medicine.',
      notes: 'The secret: bloom the carob in just-boiled water first (no chalkiness), then blend it with dates into a silky carob-date cream before it ever touches the oats. For the full effect, hold back a few spoonfuls of the carob-date cream and drizzle it over the banana in the morning — it looks and tastes like chocolate sauce. You can also caramelise the banana slices 1–2 minutes in a dry non-stick pan for a warm contrast. Substitutions: banana → raspberries per serving (brighter, tarter); chia → equal weight extra flaxseed.',
    },
    no: {
      title: 'Karobdrøm overnattshavre',
      description: 'Silkemyk overnattshavre med karob og dadler, banan og kanel — smaker som dessert, scorer som medisin.',
      notes: 'Hemmeligheten: bløtlegg karoben i nykokt vann først (ingen kritt-smak), og kjør den så med dadler til en silkemyk karob-dadel-krem før den møter havren. For full effekt: hold igjen noen skjeer av karob-dadel-kremen og drypp den over bananen om morgenen — den ser ut og smaker som sjokoladesaus. Du kan også karamellisere bananskivene 1–2 minutter i en tørr non-stick-panne for en varm kontrast. Bytter: banan → bringebær per porsjon (friskere, syrligere); chia → tilsvarende vekt ekstra linfrø.',
    },
    sv: {
      title: 'Karobdröm overnight-havre',
      description: 'Silkeslen overnight-havre med karob och dadlar, banan och kanel — smakar som dessert, poängsätts som medicin.',
      notes: 'Hemligheten: blötlägg karoben i nykokt vatten först (ingen kritaktig smak), och mixa den sedan med dadlar till en silkeslen karob-dadelkräm innan den möter havren. För full effekt: spara några skedar av karob-dadelkrämen och ringla den över bananen på morgonen — den ser ut och smakar som chokladsås. Du kan även karamellisera bananskivorna 1–2 minuter i en torr non-stick-panna för en varm kontrast. Byten: banan → hallon per portion (fräschare, syrligare); chia → motsvarande vikt extra linfrö.',
    },
    ings: [
      [200, 'g', 'Rolled oats', 'Havregryn', 'Havregryn'],
      [12, 'g', 'Chia seeds', 'Chiafrø', 'Chiafrön'],
      [20, 'g', 'Ground flaxseed', 'Malt linfrø', 'Malet linfrö'],
      [24, 'g', 'Carob powder', 'Karobpulver', 'Karobpulver'],
      [96, 'g', 'Medjool dates, pitted', 'Medjooldadler, uten stein', 'Medjooldadlar, urkärnade'],
      [1, 'tsp', 'Ground cinnamon', 'Malt kanel', 'Malen kanel'],
      [800, 'ml', 'Homemade oat milk', 'Hjemmelaget havremelk', 'Hemgjord havremjölk'],
      [80, 'ml', 'Just-boiled water (for blooming the carob)', 'Nykokt vann (til å bløtlegge karoben)', 'Nykokt vatten (för att blötlägga karoben)'],
      [240, 'g', 'Banana, sliced fresh in the morning', 'Banan, skåret ferskt om morgenen', 'Banan, skivad färsk på morgonen'],
    ],
    steps: [
      ['Bloom the carob: whisk the carob powder into the just-boiled water until a smooth, glossy paste forms. Let sit 2 minutes — this eliminates any chalkiness.', 'Bløtlegg karoben: visp karobpulveret ut i det nykokte vannet til en glatt, blank pasta. La stå i 2 minutter — dette fjerner all kritt-smak.', 'Blötlägg karoben: vispa karobpulvret i det nykokta vattnet tills en slät, blank pasta bildas. Låt stå 2 minuter — detta tar bort all kritaktig smak.'],
      ['Make the carob-date cream: blend the bloomed carob, the dates and about a quarter of the oat milk until completely silky, about 45 seconds.', 'Lag karob-dadel-kremen: kjør den bløtlagte karoben, dadlene og ca. en fjerdedel av havremelken til det er helt silkemykt, ca. 45 sekunder.', 'Gör karob-dadelkrämen: mixa den blötlagda karoben, dadlarna och ca en fjärdedel av havremjölken tills helt silkeslent, ca 45 sekunder.'],
      ['In a large bowl, combine the oats, chia, flaxseed and cinnamon. Pour in the remaining oat milk and the carob-date cream and stir thoroughly.', 'I en stor bolle blander du havregryn, chia, linfrø og kanel. Hell i resten av havremelken og karob-dadel-kremen og rør godt.', 'I en stor skål blandar du havregryn, chia, linfrö och kanel. Häll i resten av havremjölken och karob-dadelkrämen och rör ordentligt.'],
      ['Divide into 4 jars and refrigerate overnight. In the morning, stir and top each jar with sliced banana.', 'Fordel i 4 glass og sett i kjøleskapet over natten. Om morgenen rører du og topper hvert glass med bananskiver.', 'Fördela i 4 burkar och ställ i kylen över natten. På morgonen rör du och toppar varje burk med bananskivor.'],
    ],
    nutrition: nut({ calories: 441, protein: 12.6, totalFat: 7.9, saturatedFat: 1.2, polyunsaturatedFat: 3.9, monounsaturatedFat: 2.0, omega3: 1.8, omega6: 2.1, totalCarbs: 86, totalSugars: 27.5, fiber: 14.4, sodium: 11, potassium: 780 }),
  },

  {
    id: 'orn-19', category: 'Breakfast', servings: 4, prepTime: 10, cookTime: 0, weight: 215,
    tags: ['ornish-green', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
    en: {
      title: 'Tropical Psyllium Pudding',
      description: 'A silky, naturally thick pudding built on psyllium husk powder — no cooking required, incredibly high in fiber, and lightly sweetened with Medjool dates and fresh pineapple. Bright, tropical and effortlessly green.',
      notes: 'Texture tip: the pudding thickens substantially in the fridge. For a softer set reduce psyllium to 18 g; for a firmer, sliceable pudding increase to 28 g. Flavour boost: a pinch of cardamom or a small piece of fresh ginger blended in takes the tropical profile further — no impact on the score. Important: use psyllium husk powder, not whole husks — powder gels more smoothly and prevents a gritty texture. Batch: makes 4 jars, ideal for meal prep; keeps refrigerated up to 4 days.',
    },
    no: {
      title: 'Tropisk psylliumpudding',
      description: 'En silkemyk, naturlig tykk pudding bygget på psylliumhusk-pulver — ingen koking, utrolig fiberrik og lett søtet med medjooldadler og fersk ananas. Frisk, tropisk og uanstrengt grønn.',
      notes: 'Teksturtips: puddingen tykner betydelig i kjøleskapet. For en mykere konsistens: reduser psyllium til 18 g; for en fastere, skjærbar pudding: øk til 28 g. Smaksløft: en klype kardemomme eller en liten bit fersk ingefær kjørt inn løfter den tropiske profilen — uten å påvirke scoren. Viktig: bruk psylliumhusk-pulver, ikke hele skall — pulver gelerer jevnere og unngår grynete tekstur. Batch: gir 4 glass, ideelt til matprep; holder seg i kjøleskap i opptil 4 dager.',
    },
    sv: {
      title: 'Tropisk psylliumpudding',
      description: 'En silkeslen, naturligt tjock pudding byggd på psylliumpulver — ingen tillagning, otroligt fiberrik och lätt sötad med medjooldadlar och färsk ananas. Fräsch, tropisk och utan ansträngning grön.',
      notes: 'Konsistenstips: puddingen tjocknar rejält i kylen. För en mjukare konsistens: minska psyllium till 18 g; för en fastare, skivbar pudding: öka till 28 g. Smaklyft: en nypa kardemumma eller en liten bit färsk ingefära mixad ger den tropiska profilen extra skjuts — utan att påverka poängen. Viktigt: använd psylliumpulver, inte hela skal — pulver gelar jämnare och undviker grynig konsistens. Batch: ger 4 burkar, perfekt för matprep; håller sig i kylen i upp till 4 dagar.',
    },
    ings: [
      [24, 'g', 'Psyllium husk powder', 'Psylliumhusk-pulver', 'Psylliumfrö-pulver'],
      [80, 'g', 'Medjool dates, pitted', 'Medjooldadler, uten stein', 'Medjooldadlar, urkärnade'],
      [200, 'g', 'Fresh or frozen pineapple chunks', 'Fersk eller frossen ananas i biter', 'Färsk eller fryst ananas i bitar'],
      [600, 'ml', 'Unsweetened oat milk (or water for lower fat)', 'Usøtet havremelk (eller vann for lavere fett)', 'Osötad havremjölk (eller vatten för lägre fett)'],
      [4, 'ml', 'Vanilla extract (alcohol-free)', 'Vaniljeekstrakt (alkoholfri)', 'Vaniljextrakt (alkoholfritt)'],
      [20, 'g', 'Ground flaxseed', 'Malt linfrø', 'Malet linfrö'],
      [15, 'ml', 'Fresh lime juice', 'Fersk limesaft', 'Färsk limejuice'],
    ],
    steps: [
      ['Blend the tropical base: blend the dates, pineapple, oat milk, vanilla and lime juice on high for 1 minute until completely smooth.', 'Kjør den tropiske basen: kjør dadler, ananas, havremelk, vanilje og limesaft på høy hastighet i 1 minutt til det er helt glatt.', 'Mixa den tropiska basen: mixa dadlar, ananas, havremjölk, vanilj och limejuice på hög hastighet i 1 minut tills helt slätt.'],
      ['Pour the mixture into a bowl and immediately whisk in the psyllium husk powder vigorously for 30–45 seconds — it thickens rapidly, so keep whisking to prevent lumps.', 'Hell blandingen i en bolle og visp umiddelbart inn psylliumhusk-pulveret kraftig i 30–45 sekunder — det tykner raskt, så fortsett å vispe for å unngå klumper.', 'Häll blandningen i en skål och vispa omedelbart ner psylliumpulvret kraftigt i 30–45 sekunder — det tjocknar snabbt, så fortsätt vispa för att undvika klumpar.'],
      ['Stir in the ground flaxseed until evenly combined.', 'Rør inn det malte linfrøet til det er jevnt blandet.', 'Rör i det malda linfröet tills jämnt blandat.'],
      ['Divide into 4 glasses or jars, cover and refrigerate at least 2 hours — ideally overnight. The pudding firms up as the psyllium gels.', 'Fordel i 4 glass, dekk til og sett i kjøleskapet i minst 2 timer — helst over natten. Puddingen setter seg mens psylliumet gelerer.', 'Fördela i 4 glas, täck och ställ i kylen i minst 2 timmar — helst över natten. Puddingen sätter sig medan psylliumet gelar.'],
      ['Serve cold, topped with a few fresh pineapple pieces or a pinch of cardamom.', 'Server kald, toppet med noen biter fersk ananas eller en klype kardemomme.', 'Servera kall, toppad med några bitar färsk ananas eller en nypa kardemumma.'],
    ],
    nutrition: nut({ calories: 152, protein: 3.0, totalFat: 3.0, saturatedFat: 0.3, polyunsaturatedFat: 2.1, monounsaturatedFat: 0.5, omega3: 1.7, omega6: 0.35, totalCarbs: 31.0, totalSugars: 17.1, fiber: 17.4, sodium: 65, potassium: 278 }),
  },

  {
    id: 'orn-20', category: 'Main', servings: 4, prepTime: 20, cookTime: 25, weight: 170,
    tags: ['main', 'vegan', 'high-fiber'],
    en: {
      title: 'Walnut Patties (Oven-Baked)',
      description: 'Toasted-walnut, carrot, onion & garlic patties — oven-baked for a hands-off, golden crust. Off-protocol, built purely for taste.',
      notes: "Makes 8 patties (2 per serving). Baking keeps them moist with almost no effort — the flip is the only thing to watch. Chef's tip: a squeeze of fresh lemon at the table wakes everything up. Want them even moister? Stir in 2 tbsp grated apple with the carrot. They reheat beautifully and deepen in flavour overnight — great for batch cooking. If you want them crispier, broil for the last 1–2 minutes after the flip, watching closely as the walnut oils brown fast. Note: this dish is off-protocol (walnut fat and a splash of oil) — built for taste rather than the GREEN score.",
    },
    no: {
      title: 'Valnøttbiff (ovnsbakt)',
      description: 'Biffer av ristede valnøtter, gulrot, løk og hvitløk — ovnsbakt for en enkel, gyllen skorpe. Utenfor protokollen, laget kun for smakens skyld.',
      notes: 'Gir 8 biffer (2 per porsjon). Ovnsbaking holder dem saftige med minimal innsats — vendingen er det eneste å passe på. Kokketips: en skvis fersk sitron ved bordet vekker alt til live. Vil du ha dem enda saftigere? Rør inn 2 ss revet eple sammen med gulroten. De varmes opp nydelig og får dypere smak over natten — flott til matprep. Vil du ha dem sprøere, grill dem de siste 1–2 minuttene etter vendingen, men følg nøye med da valnøttoljene bruner raskt. Merk: retten er utenfor protokollen (valnøttfett og en skvett olje) — laget for smak, ikke for GREEN-scoren.',
    },
    sv: {
      title: 'Valnötsbiff (ugnsbakad)',
      description: 'Biffar av rostade valnötter, morot, lök och vitlök — ugnsbakade för en enkel, gyllene skorpa. Utanför protokollet, gjord enbart för smakens skull.',
      notes: 'Ger 8 biffar (2 per portion). Ugnsbakning håller dem saftiga med minimal ansträngning — vändningen är det enda att hålla koll på. Kockens tips: en klick färsk citron vid bordet väcker allt till liv. Vill du ha dem ännu saftigare? Rör i 2 msk riven äpple tillsammans med moroten. De värms upp fint och fördjupas i smak över natten — perfekt för matprep. Vill du ha dem krispigare, grilla de sista 1–2 minuterna efter vändningen, men håll koll då valnötsoljorna bryns snabbt. Obs: rätten är utanför protokollet (valnötsfett och en skvätt olja) — gjord för smak, inte för GREEN-poängen.',
    },
    ings: [
      [120, 'g', 'Walnuts', 'Valnøtter', 'Valnötter'],
      [150, 'g', 'Carrot, grated', 'Gulrot, revet', 'Morot, riven'],
      [120, 'g', 'Onion, finely diced', 'Løk, finhakket', 'Lök, finhackad'],
      [12, 'g', 'Garlic cloves, minced', 'Hvitløksfedd, finhakket', 'Vitlöksklyftor, finhackade'],
      [240, 'g', 'Cooked cannellini (white) beans, drained', 'Kokte cannellini (hvite) bønner, avrent', 'Kokta cannellini (vita) bönor, avrunna'],
      [60, 'g', 'Panko breadcrumbs', 'Pankorasp', 'Pankoströbröd'],
      [20, 'g', 'Ground flaxseed', 'Malt linfrø', 'Malet linfrö'],
      [45, 'ml', 'Water (for the flax egg)', 'Vann (til linfrø-egget)', 'Vatten (till linfrö-ägget)'],
      [20, 'g', 'Reduced-sodium tamari / soy sauce', 'Tamari / soyasaus med lavt natriuminnhold', 'Tamari / soja med låg natriumhalt'],
      [1.5, 'tsp', 'Smoked paprika', 'Røkt paprika', 'Rökt paprika'],
      [1, 'tsp', 'Dried thyme', 'Tørket timian', 'Torkad timjan'],
      [1, 'g', 'Salt', 'Salt', 'Salt'],
      [1, 'tbsp', 'Olive oil (to sauté + brush)', 'Olivenolje (til steking + pensling)', 'Olivolja (till stekning + pensling)'],
      [8, 'g', 'Fresh parsley, chopped (optional)', 'Frisk persille, hakket (valgfritt)', 'Färsk persilja, hackad (valfritt)'],
    ],
    steps: [
      ['Heat the oven to 200°C fan and line a tray with baking paper. A genuinely hot oven gives browning instead of pale, steamed patties.', 'Varm ovnen til 200°C varmluft og kle et brett med bakepapir. En skikkelig varm ovn gir bruning i stedet for bleke, dampede biffer.', 'Värm ugnen till 200°C varmluft och klä en plåt med bakplåtspapper. En riktigt het ugn ger färg i stället för bleka, ångade biffar.'],
      ['Make the flax egg: stir the ground flaxseed into the water and leave it to gel while you prep everything else.', 'Lag linfrø-egget: rør det malte linfrøet ut i vannet og la det gele mens du forbereder resten.', 'Gör linfrö-ägget: rör det malda linfröet i vattnet och låt det gela medan du förbereder resten.'],
      ['Dry-toast the walnuts in a hot pan until fragrant and a shade darker, then chop to a coarse crumb (not powder) — this is the biggest flavour move.', 'Tørrist valnøttene i en varm panne til de dufter og er litt mørkere, og hakk dem så til en grov smule (ikke pulver) — dette er det største smakstrekket.', 'Torrosta valnötterna i en het panna tills de doftar och blivit en aning mörkare, hacka dem sedan till grovt smul (inte pulver) — detta är det största smakgreppet.'],
      ['In a splash of the olive oil, cook the onion over medium heat until soft and golden, then add the garlic for the final minute only.', 'I en skvett av olivenoljen steker du løken på middels varme til den er myk og gyllen, og tilsetter hvitløken kun det siste minuttet.', 'I en skvätt av olivoljan steker du löken på medelvärme tills den är mjuk och gyllene, och tillsätter vitlöken bara den sista minuten.'],
      ['Stir in the grated carrot and cook 2–3 minutes until it loses its raw crunch — it is the main moisture engine.', 'Rør inn den revne gulroten og stek i 2–3 minutter til den mister det rå bittet — den er hovedkilden til saftighet.', 'Rör i den rivna moroten och stek 2–3 minuter tills den tappar sitt råa tuggmotstånd — den är den huvudsakliga fuktkällan.'],
      ['Roughly mash the cannellini beans with a fork, leaving some half-whole — the bean starch is the creamy glue that lets you skip the egg.', 'Mos cannellinibønnene grovt med en gaffel, la noen være halvhele — bønnestivelsen er det kremede limet som lar deg droppe egg.', 'Mosa cannellinibönorna grovt med en gaffel, låt några vara halvhela — bönstärkelsen är det krämiga limmet som låter dig hoppa över ägg.'],
      ['Combine the toasted walnuts, mashed beans, onion-carrot-garlic, flax egg, panko, tamari, smoked paprika, thyme, salt and parsley. Mix well and rest 10 minutes so the panko and flax hydrate.', 'Bland de ristede valnøttene, de mosede bønnene, løk-gulrot-hvitløk, linfrø-egget, panko, tamari, røkt paprika, timian, salt og persille. Bland godt og la hvile i 10 minutter så panko og linfrø trekker til seg fukt.', 'Blanda de rostade valnötterna, de mosade bönorna, lök-morot-vitlök, linfrö-ägget, panko, tamari, rökt paprika, timjan, salt och persilja. Blanda väl och låt vila 10 minuter så panko och linfrö suger åt sig fukt.'],
      ['Form 8 patties about 1.5 cm thick on the tray and brush the tops lightly with the remaining olive oil — the thin brush is what lets them turn golden in dry oven heat.', 'Form 8 biffer ca. 1,5 cm tykke på brettet og pensle toppene lett med resten av olivenoljen — det tynne penselstrøket er det som gir dem gyllen farge i tørr ovnsvarme.', 'Forma 8 biffar ca 1,5 cm tjocka på plåten och pensla ovansidorna lätt med resten av olivoljan — det tunna penseldraget är det som ger dem gyllene färg i torr ugnsvärme.'],
      ['Bake 25 minutes, flipping at the halfway point so both faces brown. Pull them when deep golden and firm — they keep setting as they cool.', 'Stek i 25 minutter, snu halvveis så begge sider brunes. Ta dem ut når de er dypt gyllne og faste — de setter seg videre mens de avkjøles.', 'Grädda 25 minuter, vänd halvvägs så båda sidor får färg. Ta ut dem när de är djupt gyllene och fasta — de sätter sig medan de svalnar.'],
    ],
    nutrition: nut({ calories: 422, protein: 14.3, totalFat: 25.4, saturatedFat: 2.5, polyunsaturatedFat: 15.9, monounsaturatedFat: 5.3, omega3: 3.9, omega6: 12.2, totalCarbs: 42.6, totalSugars: 4.4, fiber: 9.6, sodium: 308, potassium: 737 }),
  },

  {
    id: 'orn-21', category: 'Side', servings: 4, prepTime: 10, cookTime: 12, weight: 190,
    tags: ['ornish-green', 'side', 'vegan', 'oil-free', 'no-added-sugar'],
    en: {
      title: 'Sautéed Red Cabbage with Lemon & Dates',
      description: 'Silky, jewel-toned cabbage with caramel-sweet dates, bright lemon and a whisper of salt. A side dish that earns its place on any plate.',
      notes: 'To make it legendary: get the pan genuinely hot before the cabbage goes in — a cold pan steams, a hot pan caramelises, and that colour change is flavour. Don\'t rush the sauté; 8–10 minutes of real heat lets the natural sugars develop a slight char at the edges that plays against the sweetness of the dates. Keep the date paste thick — it\'s a glaze, not a sauce, so it clings to the cabbage rather than pooling. Add the lemon zest last, off-heat, so it stays bright and floral rather than turning bitter.',
    },
    no: {
      title: 'Surret rødkål med sitron og dadler',
      description: 'Silkemyk, juvelfarget kål med karamellsøte dadler, frisk sitron og et hint av salt. En tilbehørsrett som fortjener plassen sin på hvilken som helst tallerken.',
      notes: 'For å gjøre den legendarisk: få pannen skikkelig varm før kålen går i — en kald panne damper, en varm panne karamelliserer, og den fargeendringen er smak. Ikke forhast surringen; 8–10 minutter med ekte varme lar de naturlige sukkerartene få en lett svidd kant som spiller mot dadlenes sødme. Hold dadelpastaen tykk — den er en glasur, ikke en saus, så den kleber seg til kålen i stedet for å samle seg i bunnen. Tilsett sitronskallet til slutt, utenom varmen, så det holder seg friskt og blomstrende i stedet for å bli bittert.',
    },
    sv: {
      title: 'Stekt rödkål med citron och dadlar',
      description: 'Silkeslen, juvelfärgad kål med karamellsöta dadlar, fräsch citron och en aning salt. En tillbehörsrätt som förtjänar sin plats på vilken tallrik som helst.',
      notes: 'För att göra den legendarisk: få pannan riktigt het innan kålen går i — en kall panna ångar, en het panna karamelliserar, och den färgförändringen är smak. Skynda inte på stekningen; 8–10 minuter av riktig värme låter de naturliga sockerarterna få en lätt bränd kant som spelar mot dadlarnas sötma. Håll dadelpastan tjock — den är en glasyr, inte en sås, så den fäster vid kålen i stället för att samlas i botten. Tillsätt citronskalet sist, utanför värmen, så det håller sig fräscht och blommigt i stället för att bli bittert.',
    },
    ings: [
      [600, 'g', 'Red cabbage, finely shredded', 'Rødkål, finstrimlet', 'Rödkål, fint strimlad'],
      [80, 'g', 'Medjool dates, pitted', 'Medjooldadler, uten stein', 'Medjooldadlar, urkärnade'],
      [60, 'ml', 'Water (for the date paste)', 'Vann (til dadelpastaen)', 'Vatten (till dadelpastan)'],
      [45, 'ml', 'Fresh lemon juice', 'Fersk sitronsaft', 'Färsk citronsaft'],
      [1, 'tsp', 'Lemon zest', 'Sitronskall', 'Citronskal'],
      [60, 'ml', 'Water (for sautéing)', 'Vann (til surring)', 'Vatten (till stekning)'],
      [0.3, 'tsp', 'Salt', 'Salt', 'Salt'],
    ],
    steps: [
      ['Make the date paste: simmer the dates with the paste water over low heat for 3–4 minutes, mashing with a fork until smooth and glossy. Set aside.', 'Lag dadelpastaen: la dadlene småkoke med pastavannet på lav varme i 3–4 minutter, mos med en gaffel til det er glatt og blankt. Sett til side.', 'Gör dadelpastan: låt dadlarna sjuda med pastavattnet på låg värme i 3–4 minuter, mosa med en gaffel tills slätt och blankt. Ställ åt sidan.'],
      ['Shred the red cabbage as finely as you can — thin 2–3 mm ribbons cook faster and give a silkier result.', 'Strimle rødkålen så fint du kan — tynne strimler på 2–3 mm koker raskere og gir et silkemykt resultat.', 'Strimla rödkålen så fint du kan — tunna strimlor på 2–3 mm kokar snabbare och ger ett silkeslent resultat.'],
      ['Heat a wide pan until quite hot, add the sauté water so it sizzles, then add the cabbage. Sauté 8–10 minutes, stirring, until wilted and slightly caramelised at the edges. Add a splash more water if it sticks.', 'Varm en vid panne til den er ganske varm, tilsett surringsvannet så det freser, og ha i kålen. Surr i 8–10 minutter mens du rører, til den har falt sammen og er lett karamellisert i kantene. Tilsett litt mer vann om den fester seg.', 'Värm en vid panna tills den är ganska het, tillsätt stekvattnet så det fräser och lägg i kålen. Stek 8–10 minuter under omrörning tills den sjunkit ihop och är lätt karamelliserad i kanterna. Tillsätt en skvätt mer vatten om den fastnar.'],
      ['Reduce the heat, add the date paste, lemon juice and salt, and stir to coat every strand. Cook 2 more minutes until glossy and unified.', 'Skru ned varmen, tilsett dadelpastaen, sitronsaften og saltet, og rør så alt dekkes. Stek 2 minutter til, til det er blankt og samlet.', 'Sänk värmen, tillsätt dadelpastan, citronsaften och saltet och rör så allt täcks. Stek 2 minuter till tills blankt och samlat.'],
      ['Remove from the heat, scatter the lemon zest over the top and toss once — added off-heat, it keeps its bright, floral lift.', 'Ta av varmen, dryss sitronskallet over toppen og vend én gang — tilsatt utenom varmen beholder det det friske, blomstrende løftet.', 'Ta av värmen, strö citronskalet över och vänd en gång — tillsatt utanför värmen behåller det sitt fräscha, blommiga lyft.'],
    ],
    nutrition: nut({ calories: 105, protein: 2.2, totalFat: 0.4, saturatedFat: 0.1, polyunsaturatedFat: 0.2, monounsaturatedFat: 0.05, omega3: 0.1, omega6: 0.1, totalCarbs: 26, totalSugars: 17, fiber: 5.2, sodium: 165, potassium: 490 }),
  },

  {
    id: 'orn-22', category: 'Soup', servings: 6, prepTime: 15, cookTime: 50, weight: 330,
    tags: ['ornish-green', 'soup', 'vegan', 'oil-free', 'no-added-sugar'],
    en: {
      title: 'Golden Vegetable Broth',
      description: 'A rich, golden, low-sodium broth built on mushrooms, sweet aromatics and anti-inflammatory turmeric. Deeply nourishing, microbiome-friendly and perfect as a cooking base or warming drink. Ornish GREEN certified.',
      notes: 'Zero-waste scrap use — second boil: return the strained solids to the pot, cover with fresh water and simmer 20–30 minutes; use as a mild cooking liquid for oats, quinoa or brown rice. Scrap soup: blend first-round scraps with cooked lentils, turmeric and lemon (remove bay leaves first). Miso rule: always add miso off the heat into warm (not boiling) broth — boiling destroys the live cultures. Microbiome tip: onion, garlic, celery, mushrooms and sweet potato each feed different beneficial gut bacteria. Drinking broth: serve hot in a mug with an extra squeeze of lemon and 1 tbsp ground flaxseed for daily omega-3.',
    },
    no: {
      title: 'Gyllen grønnsaksbuljong',
      description: 'En fyldig, gyllen, natriumfattig buljong bygget på sopp, søte aromaer og betennelsesdempende gurkemeie. Dypt nærende, mikrobiomvennlig og perfekt som kokebase eller varmende drikk. Ornish GREEN-sertifisert.',
      notes: 'Null-svinn bruk av rester — andre koking: ha de silte grønnsaksrestene tilbake i gryten, dekk med friskt vann og la småkoke i 20–30 minutter; bruk som mild kokevæske til havre, quinoa eller brun ris. Restesuppe: kjør restene fra første runde med kokte linser, gurkemeie og sitron (fjern laurbærbladene først). Miso-regel: tilsett alltid miso utenom varmen i lunken (ikke kokende) buljong — koking ødelegger de levende kulturene. Mikrobiomtips: løk, hvitløk, selleri, sopp og søtpotet mater hver sine gunstige tarmbakterier. Drikkebuljong: server varm i en kopp med en ekstra skvis sitron og 1 ss malt linfrø for daglig omega-3.',
    },
    sv: {
      title: 'Gyllene grönsaksbuljong',
      description: 'En fyllig, gyllene, natriumsnål buljong byggd på svamp, söta aromater och antiinflammatorisk gurkmeja. Djupt närande, mikrobiomvänlig och perfekt som matlagningsbas eller värmande dryck. Ornish GREEN-certifierad.',
      notes: 'Noll-svinn användning av rester — andra kok: lägg tillbaka de silade grönsaksresterna i grytan, täck med färskt vatten och sjud 20–30 minuter; använd som mild kokvätska till havre, quinoa eller brunt ris. Restsoppa: mixa resterna från första omgången med kokta linser, gurkmeja och citron (ta bort lagerbladen först). Miso-regel: tillsätt alltid miso utanför värmen i ljummen (inte kokande) buljong — kokning förstör de levande kulturerna. Mikrobiomtips: lök, vitlök, selleri, svamp och sötpotatis matar var sina nyttiga tarmbakterier. Drickbuljong: servera varm i en mugg med en extra klick citron och 1 msk malet linfrö för daglig omega-3.',
    },
    ings: [
      [1, 'pcs', 'Large onion, roughly chopped', 'Stor løk, grovhakket', 'Stor lök, grovhackad'],
      [4, 'clove', 'Garlic cloves, smashed', 'Hvitløksfedd, knust', 'Vitlöksklyftor, krossade'],
      [3, 'pcs', 'Celery stalks, roughly chopped', 'Selleristilker, grovhakket', 'Selleristjälkar, grovhackade'],
      [200, 'g', 'Mushrooms (any variety), halved', 'Sopp (valgfri sort), halvert', 'Svamp (valfri sort), halverad'],
      [2, 'pcs', 'Medium tomatoes, quartered', 'Middels tomater, i båter', 'Medelstora tomater, i klyftor'],
      [1, 'pcs', 'Red or yellow bell pepper, roughly chopped', 'Rød eller gul paprika, grovhakket', 'Röd eller gul paprika, grovhackad'],
      [1, 'pcs', 'Small sweet potato, roughly chopped (skin on)', 'Liten søtpotet, grovhakket (med skall)', 'Liten sötpotatis, grovhackad (med skal)'],
      [2, 'pcs', 'Bay leaves', 'Laurbærblad', 'Lagerblad'],
      [1, 'tsp', 'Ground turmeric', 'Malt gurkemeie', 'Malen gurkmeja'],
      [2000, 'ml', 'Cold water', 'Kaldt vann', 'Kallt vatten'],
      [1, 'tbsp', 'Fresh lemon juice (at finish)', 'Fersk sitronsaft (til slutt)', 'Färsk citronsaft (på slutet)'],
      [0.5, 'tsp', 'White miso (shiro), at finish', 'Hvit miso (shiro), til slutt', 'Vit miso (shiro), på slutet'],
    ],
    steps: [
      ['Dry-toast the aromatics: in a dry pan over medium-high heat, add the onion, garlic and mushrooms and let them sit without stirring 2–3 minutes until slightly charred at the edges — this builds deep flavour, do not skip it.', 'Tørrist aromatene: i en tørr panne på middels-høy varme har du i løk, hvitløk og sopp og lar dem ligge urørt i 2–3 minutter til de er lett svidd i kantene — dette bygger dyp smak, ikke hopp over det.', 'Torrosta aromaterna: i en torr panna på medelhög värme lägg i lök, vitlök och svamp och låt dem ligga orörda 2–3 minuter tills lätt brända i kanterna — detta bygger djup smak, hoppa inte över det.'],
      ['Transfer the toasted aromatics to a large pot. Add the celery, tomatoes, bell pepper, sweet potato, bay leaves, turmeric and the cold water. Stir to combine.', 'Overfør de ristede aromatene til en stor gryte. Tilsett selleri, tomater, paprika, søtpotet, laurbærblad, gurkemeie og det kalde vannet. Rør sammen.', 'För över de rostade aromaterna till en stor gryta. Tillsätt selleri, tomater, paprika, sötpotatis, lagerblad, gurkmeja och det kalla vattnet. Rör samman.'],
      ['Cook: bring to the boil, then simmer covered for about 45 minutes (or pressure-cook on high 30 minutes with natural release).', 'Kok: kok opp, og la småkoke under lokk i ca. 45 minutter (eller trykk-kok på høy i 30 minutter med naturlig trykkutløsning).', 'Koka: koka upp och sjud under lock i ca 45 minuter (eller tryckkoka på hög i 30 minuter med naturlig tryckutsläpp).'],
      ['Strain the broth through a fine sieve, pressing the solids gently to extract all liquid. Discard the bay leaves and set the solids aside for a second boil.', 'Sil buljongen gjennom en finmasket sil, press grønnsaksrestene forsiktig for å få ut all væske. Kast laurbærbladene og sett restene til side for en andre koking.', 'Sila buljongen genom en finmaskig sil, pressa resterna försiktigt för att få ut all vätska. Släng lagerbladen och spara resterna för ett andra kok.'],
      ['Let the broth cool to around 60–65°C. Dissolve the miso in a small ladleful of warm broth, stir it back into the batch and add the lemon juice. Taste — never boil after adding miso.', 'La buljongen avkjøle til ca. 60–65°C. Løs opp misoen i en liten øse lunken buljong, rør den tilbake i gryten og tilsett sitronsaften. Smak til — kok aldri etter at misoen er tilsatt.', 'Låt buljongen svalna till ca 60–65°C. Lös upp mison i en liten slev ljummen buljong, rör tillbaka den i grytan och tillsätt citronsaften. Smaka av — koka aldrig efter att mison tillsatts.'],
    ],
    nutrition: nut({ calories: 30, protein: 2.0, totalFat: 0.2, saturatedFat: 0.03, polyunsaturatedFat: 0.09, monounsaturatedFat: 0.03, omega3: 0.02, omega6: 0.05, totalCarbs: 6.0, totalSugars: 2.9, fiber: 0.6, sodium: 180, potassium: 390 }),
  },

  {
    id: 'orn-23', category: 'Soup', servings: 4, prepTime: 10, cookTime: 30, weight: 350,
    tags: ['ornish-green', 'soup', 'vegan', 'oil-free', 'no-added-sugar'],
    en: {
      title: 'Umami Broth',
      description: 'A golden, savory broth simmered with whole vegetables and fresh mushrooms — clear, comforting and deeply savory.',
      notes: "Chef's note: keeping the vegetables whole/large and the onion skin on keeps the broth clearer and gives it a richer golden colour — closer to a traditional stock look. Substitution: swap the fresh champignons for 15 g dried shiitake if you want a deeper, more concentrated umami. Save the cooked vegetables and mushrooms afterwards — blend into a soup base or use for a second, lighter broth run.",
    },
    no: {
      title: 'Umami-buljong',
      description: 'En gyllen, smakfull buljong trukket med hele grønnsaker og fersk sopp — klar, trøstende og dypt smakfull.',
      notes: 'Kokketips: å holde grønnsakene hele/store og løken med skall gjør buljongen klarere og gir den en rikere gyllen farge — nærmere en tradisjonell kraft. Bytte: bytt de ferske sjampinjongene med 15 g tørket shiitake om du vil ha en dypere, mer konsentrert umami. Ta vare på de kokte grønnsakene og soppen etterpå — kjør dem til en suppebase eller bruk dem til en andre, lettere buljongtrekking.',
    },
    sv: {
      title: 'Umami-buljong',
      description: 'En gyllene, smakrik buljong sjuden med hela grönsaker och färsk svamp — klar, tröstande och djupt smakrik.',
      notes: 'Kockens tips: att hålla grönsakerna hela/stora och löken med skal gör buljongen klarare och ger den en rikare gyllene färg — närmare en traditionell fond. Byte: byt de färska champinjonerna mot 15 g torkad shiitake om du vill ha en djupare, mer koncentrerad umami. Spara de kokta grönsakerna och svampen efteråt — mixa till en soppbas eller använd till ett andra, lättare buljongkok.',
    },
    ings: [
      [150, 'g', 'Onion, quartered, skin on', 'Løk, i båter, med skall', 'Lök, i klyftor, med skal'],
      [150, 'g', 'Carrot, left whole (or halved lengthwise)', 'Gulrot, hel (eller halvert på langs)', 'Morot, hel (eller halverad på längden)'],
      [100, 'g', 'Celery, broken into large chunks', 'Selleri, brukket i store biter', 'Selleri, bruten i stora bitar'],
      [12, 'g', 'Garlic cloves, smashed', 'Hvitløksfedd, knust', 'Vitlöksklyftor, krossade'],
      [15, 'g', 'Fresh ginger, sliced', 'Fersk ingefær, i skiver', 'Färsk ingefära, i skivor'],
      [150, 'g', 'Fresh champignon mushrooms, halved', 'Ferske sjampinjonger, halvert', 'Färska champinjoner, halverade'],
      [2, 'pcs', 'Bay leaves', 'Laurbærblad', 'Lagerblad'],
      [0.5, 'tsp', 'Ground turmeric', 'Malt gurkemeie', 'Malen gurkmeja'],
      [1600, 'ml', 'Water', 'Vann', 'Vatten'],
      [1.2, 'g', 'Salt (added at the end, to taste)', 'Salt (tilsatt til slutt, etter smak)', 'Salt (tillsatt på slutet, efter smak)'],
    ],
    steps: [
      ['Water-sauté the aromatics: in a large pot with a splash of water, cook the onion, carrot, celery, garlic and ginger for 4–5 minutes, stirring, until fragrant.', 'Vann-surr aromatene: i en stor gryte med en skvett vann steker du løk, gulrot, selleri, hvitløk og ingefær i 4–5 minutter mens du rører, til det dufter.', 'Vatten-stek aromaterna: i en stor gryta med en skvätt vatten steker du lök, morot, selleri, vitlök och ingefära i 4–5 minuter under omrörning tills det doftar.'],
      ['Add the mushrooms, bay leaves, turmeric and the water. Stir well.', 'Tilsett soppen, laurbærbladene, gurkemeien og vannet. Rør godt.', 'Tillsätt svampen, lagerbladen, gurkmejan och vattnet. Rör väl.'],
      ['Bring to the boil and simmer covered for about 30 minutes (or pressure-cook on high 20 minutes with natural release).', 'Kok opp og la småkoke under lokk i ca. 30 minutter (eller trykk-kok på høy i 20 minutter med naturlig trykkutløsning).', 'Koka upp och sjud under lock i ca 30 minuter (eller tryckkoka på hög i 20 minuter med naturlig tryckutsläpp).'],
      ['Strain through a fine sieve, pressing the solids gently to extract the liquid. Stir in salt to taste and serve hot.', 'Sil gjennom en finmasket sil, press restene forsiktig for å få ut væsken. Rør inn salt etter smak og server varm.', 'Sila genom en finmaskig sil, pressa resterna försiktigt för att få ut vätskan. Rör i salt efter smak och servera varm.'],
    ],
    nutrition: nut({ calories: 25, protein: 1.2, totalFat: 0.3, saturatedFat: 0, polyunsaturatedFat: 0.1, monounsaturatedFat: 0.05, omega3: 0.02, omega6: 0.05, totalCarbs: 5, totalSugars: 2, fiber: 1, sodium: 150, potassium: 220 }),
  },
]

function buildRecipe(r) {
  const baseIngredients = r.ings.map(([quantity, unit, en]) => ({ quantity, unit, name: en }))
  const mk = (idx) => ({
    title: r[idx === 1 ? 'no' : 'sv'].title,
    description: r[idx === 1 ? 'no' : 'sv'].description,
    notes: r[idx === 1 ? 'no' : 'sv'].notes,
    ingredients: r.ings.map(([quantity, unit, , no, sv]) => ({ quantity, unit, name: idx === 1 ? no : sv })),
    steps: r.steps.map(s => s[idx]),
  })
  return {
    id: r.id,
    title: r.en.title,
    category: r.category,
    servings: r.servings,
    prepTime: r.prepTime || null,
    cookTime: r.cookTime || null,
    imageUrl: null,
    description: r.en.description,
    notes: r.en.notes,
    tags: r.tags,
    kcal: Math.round(r.nutrition.calories),
    servingWeightGrams: r.weight,
    nutrition: { perServing: r.nutrition },
    translations: { no: mk(1), sv: mk(2) },
    ingredients: baseIngredients,
    steps: r.steps.map(s => s[0]),
  }
}

const out = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(out, 'utf8'))

// Preserve images + condition tags already on any of these ids (idempotent re-run).
const CONDITION_TAGS = ['diabetes-friendly', 'blood-pressure-friendly', 'heart-healthy', 'weight-loss']
const prev = {}
for (const r of pack.recipes) prev[r.id] = r
const built = RECIPES.map(buildRecipe).map(r => {
  const old = prev[r.id]
  return {
    ...r,
    imageUrl: old?.imageUrl || r.imageUrl,
    tags: [...r.tags, ...((old?.tags || []).filter(tg => CONDITION_TAGS.includes(tg)))],
  }
})

const builtIds = new Set(built.map(r => r.id))
pack.recipes = [...pack.recipes.filter(r => !builtIds.has(r.id)), ...built]
pack.version = '1.7.0'
fs.writeFileSync(out, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('Reversal pack now has', pack.recipes.length, 'recipes ->', pack.version)
console.log('Added/updated:', built.map(r => r.id).join(', '))

/*
 * Generator for the Fredheim FMD (Fasting Mimicking Diet) 5-day pack.
 *
 * Authoring all 16 recipes (daily broth + 5 days x 3 meals) in EN/NO/SV by
 * hand as raw JSON is error-prone, so we describe each recipe once in a
 * compact structure and let this script assemble the pack JSON with
 * perfectly aligned translations.
 *
 * Ingredients are [qty, unit, enName, noName, svName]; a null qty renders
 * as just the name (used for "to taste" seasonings). Steps are [en, no, sv].
 *
 * imageUrl is left null on every recipe — the user adds photos before this
 * ships. Run:  node scripts/gen_fmd_pack.cjs
 */
const fs = require('fs')
const path = require('path')

// Full per-serving nutrition panels parsed from
// Fredheim_FMD_Nutrition_Panels.docx (see parse_fmd_nutrition.cjs).
// Keyed by recipe id; the broth is not in this file and keeps its own
// lightweight macros below.
const NUTR = require('./fmd_nutrition.json')

const PACK = {
  id: 'fredheim-fmd-5day',
  name: 'Fasting Mimicking Plan — 5-Day Plan',
  description:
    'A clinically structured 5-day Fasting Mimicking Diet (FMD) based on the research of Valter Longo, PhD (USC). Three small, fully plant-based, oil-free, caffeine-free meals a day, with a vegetable broth sipped freely throughout. Designed to trigger autophagy, suppress IGF-1 and mobilise stem cells — with evidence for metabolic syndrome, pre-diabetes, cardiovascular risk, autoimmune and inflammatory conditions, and healthy ageing. ⚠ Contraindicated in pregnancy or breastfeeding, type 1 / insulin-dependent diabetes, BMI under 18.5, any eating-disorder history, and under-18s.',
  author: 'Fredheim Livsstilssenter',
  version: '1.2.0',
  tags: ['fmd', 'fasting-mimicking', 'longo', 'plant-based', 'oil-free', 'caffeine-free', 'clinical'],
  translations: {
    no: {
      name: 'Faste-imiterende plan — 5-dagers plan',
      description:
        'En klinisk strukturert 5-dagers faste-imiterende diett (FMD) basert på forskningen til Valter Longo, PhD (USC). Tre små, helt plantebaserte, oljefrie og koffeinfrie måltider om dagen, med en grønnsaksbuljong som drikkes fritt gjennom dagen. Laget for å utløse autofagi, dempe IGF-1 og mobilisere stamceller — med dokumentasjon for metabolsk syndrom, prediabetes, hjerte- og karrisiko, autoimmune og betennelsestilstander, og sunn aldring. ⚠ Frarådes ved graviditet eller amming, diabetes type 1 / insulinavhengig diabetes, BMI under 18,5, enhver historikk med spiseforstyrrelse, og under 18 år.',
    },
    sv: {
      name: 'Fastehärmande plan — 5-dagarsplan',
      description:
        'En kliniskt strukturerad 5-dagars fastehärmande diet (FMD) baserad på forskningen av Valter Longo, PhD (USC). Tre små, helt växtbaserade, oljefria och koffeinfria måltider per dag, med en grönsaksbuljong som dricks fritt under dagen. Utformad för att utlösa autofagi, dämpa IGF-1 och mobilisera stamceller — med stöd för metabolt syndrom, prediabetes, kardiovaskulär risk, autoimmuna och inflammatoriska tillstånd samt hälsosamt åldrande. ⚠ Avråds vid graviditet eller amning, typ 1- / insulinberoende diabetes, BMI under 18,5, all historik av ätstörning, och under 18 år.',
    },
  },
}

// [qty, unit, en, no, sv]
const S = [null, '', 'Sea salt, to taste', 'Havsalt, etter smak', 'Havssalt, efter smak']

const RECIPES = [
  {
    id: 'fmd-broth', category: 'Soup', servings: 5, prepTime: 10, cookTime: 50, weight: 300,
    kcal: 15, macros: { protein: 0.5, totalFat: 0.1, totalCarbs: 3, totalSugars: 1.5, fiber: 0 },
    en: { title: 'Daily Vegetable Broth', description: 'A light, savoury broth sipped freely all day to steady electrolytes and blunt hunger without breaking the fast. Makes ~1.5 L (about five 300 ml servings).' },
    no: { title: 'Daglig grønnsaksbuljong', description: 'En lett, smakfull buljong som drikkes fritt hele dagen for å holde elektrolyttene stabile og dempe sult uten å bryte fasten. Gir ca. 1,5 L (omtrent fem porsjoner à 300 ml).' },
    sv: { title: 'Daglig grönsaksbuljong', description: 'En lätt, smakrik buljong som dricks fritt hela dagen för att hålla elektrolyterna stabila och dämpa hunger utan att bryta fastan. Ger ca 1,5 L (ungefär fem portioner à 300 ml).' },
    ings: [
      [1500, 'ml', 'Water', 'Vann', 'Vatten'],
      [80, 'g', 'Celery stalks', 'Selleristilker', 'Selleristjälkar'],
      [80, 'g', 'Carrot', 'Gulrot', 'Morot'],
      [60, 'g', 'Onion, halved, skin on', 'Løk, halvert, med skall', 'Lök, halverad, med skal'],
      [9, 'g', 'Garlic cloves, whole, unpeeled', 'Hvitløksfedd, hele, uskrelte', 'Vitlöksklyftor, hela, oskalade'],
      [10, 'g', 'Fresh ginger root', 'Frisk ingefær', 'Färsk ingefära'],
      [0.5, 'g', 'Turmeric powder', 'Gurkemeie', 'Gurkmeja'],
      [5, 'g', 'Fresh parsley or thyme, optional', 'Frisk persille eller timian, valgfritt', 'Färsk persilja eller timjan, valfritt'],
      S,
    ],
    steps: [
      ['Combine all the ingredients in a large pot and bring to the boil.', 'Ha alle ingrediensene i en stor gryte og kok opp.', 'Lägg alla ingredienser i en stor gryta och koka upp.'],
      ['Reduce the heat and simmer uncovered for 40–50 minutes.', 'Skru ned varmen og la det småkoke uten lokk i 40–50 minutter.', 'Sänk värmen och låt sjuda utan lock i 40–50 minuter.'],
      ['Strain through a fine sieve and discard the solids.', 'Sil gjennom en finmasket sil og kast det faste.', 'Sila genom en finmaskig sil och släng det fasta.'],
      ['Season lightly with extra salt if needed. Keep in a flask or pot and drink warm throughout the day.', 'Smak til med litt ekstra salt om nødvendig. Oppbevar i en termos eller gryte og drikk varm gjennom dagen.', 'Smaka av med lite extra salt vid behov. Förvara i en termos eller gryta och drick varm under dagen.'],
    ],
  },

  // ---------- DAY 1 ----------
  {
    id: 'fmd-d1-breakfast', category: 'Breakfast', servings: 1, prepTime: 5, cookTime: 0, weight: 200,
    kcal: 330, macros: { protein: 5, totalFat: 28, totalCarbs: 18, totalSugars: 5, fiber: 9 },
    en: { title: 'Walnut, Olive & Avocado Plate with Flaxseed', description: 'A fat-forward, low-protein breakfast plate that mirrors the olive-and-nut composition of the original ProLon kit. No cooking required.' },
    no: { title: 'Valnøtt-, oliven- og avokadotallerken med linfrø', description: 'En fettrik frokosttallerken med lite protein som speiler oliven- og nøttesammensetningen i det opprinnelige ProLon-settet. Ingen tilberedning nødvendig.' },
    sv: { title: 'Valnöts-, oliv- och avokadotallrik med linfrö', description: 'En fettrik frukosttallrik med lite protein som speglar oliv- och nötsammansättningen i det ursprungliga ProLon-kittet. Ingen tillagning krävs.' },
    ings: [
      [70, 'g', 'Ripe avocado (½ medium)', 'Moden avokado (½ middels)', 'Mogen avokado (½ medium)'],
      [15, 'g', 'Walnut halves (about 10)', 'Valnøtthalvdeler (ca. 10)', 'Valnötshalvor (ca 10)'],
      [40, 'g', 'Kalamata or green olives, pitted', 'Kalamata- eller grønne oliven, uten stein', 'Kalamata- eller gröna oliver, urkärnade'],
      [60, 'g', 'Fresh or frozen blueberries', 'Friske eller frosne blåbær', 'Färska eller frysta blåbär'],
      [10, 'g', 'Whole flaxseed, ground fresh', 'Hele linfrø, ferskmalt', 'Hela linfrön, färskmalda'],
      [5, 'ml', 'Lemon juice', 'Sitronsaft', 'Citronsaft'],
      [0.5, 'g', 'Ceylon cinnamon', 'Ceylonkanel', 'Ceylonkanel'],
      S,
    ],
    steps: [
      ['Grind the flaxseed fresh and set aside.', 'Mal linfrøene ferskt og sett til side.', 'Mal linfröna färskt och ställ åt sidan.'],
      ['Halve and stone the avocado, fan it onto one side of a plate, squeeze over the lemon juice and season with a little salt.', 'Del avokadoen i to, fjern steinen, vift den ut på den ene siden av tallerkenen, press over sitronsaften og krydre med litt salt.', 'Halvera och kärna ur avokadon, lägg upp den i en solfjäder på ena sidan av tallriken, pressa över citronsaften och krydda med lite salt.'],
      ['Arrange the walnuts and olives alongside, and pile the blueberries in a small dish.', 'Legg valnøttene og olivenene ved siden av, og samle blåbærene i en liten skål.', 'Lägg valnötterna och oliverna bredvid och samla blåbären i en liten skål.'],
      ['Spoon the ground flaxseed over the avocado and berries and dust the cinnamon lightly over the berries. Serve immediately.', 'Dryss det malte linfrøet over avokadoen og bærene, og strø kanel lett over bærene. Server med en gang.', 'Strö det malda linfröet över avokadon och bären och pudra kanelen lätt över bären. Servera genast.'],
    ],
  },
  {
    id: 'fmd-d1-lunch', category: 'Salad', servings: 1, prepTime: 10, cookTime: 30, weight: 515,
    kcal: 385, macros: { protein: 9, totalFat: 17, totalCarbs: 50, totalSugars: 10, fiber: 10 },
    en: { title: 'Avocado & Roasted Sweet Potato Salad', description: 'Oil-free roasted sweet potato caramelised against hot baking paper, over fresh leaves with avocado and pumpkin seeds.' },
    no: { title: 'Avokado- og ovnsbakt søtpotetsalat', description: 'Oljefri ovnsbakt søtpotet karamellisert mot varmt bakepapir, over friske blader med avokado og gresskarkjerner.' },
    sv: { title: 'Avokado- och rostad sötpotatissallad', description: 'Oljefri rostad sötpotatis karamelliserad mot varmt bakplåtspapper, över färska blad med avokado och pumpakärnor.' },
    ings: [
      [200, 'g', 'Sweet potato', 'Søtpotet', 'Sötpotatis'],
      [80, 'g', "Mixed salad leaves (rocket, spinach, lamb's lettuce)", 'Blandede salatblader (ruccola, spinat, vårsalat)', 'Blandade salladsblad (ruccola, spenat, vintersallat)'],
      [60, 'g', 'Ripe avocado', 'Moden avokado', 'Mogen avokado'],
      [100, 'g', 'Cherry tomatoes', 'Cherrytomater', 'Körsbärstomater'],
      [60, 'g', 'Cucumber', 'Agurk', 'Gurka'],
      [10, 'g', 'Pumpkin seeds', 'Gresskarkjerner', 'Pumpakärnor'],
      [15, 'ml', 'Lemon juice', 'Sitronsaft', 'Citronsaft'],
      [5, 'g', 'Fresh herbs (parsley, dill or basil)', 'Friske urter (persille, dill eller basilikum)', 'Färska örter (persilja, dill eller basilika)'],
      S,
    ],
    steps: [
      ['Heat the oven to 200°C. Cut the sweet potato into 2 cm cubes and spread on a lined tray. Roast dry — no oil — for 25–30 minutes, turning once, until tender and caramelised. Leave to cool to warm.', 'Varm ovnen til 200°C. Skjær søtpoteten i 2 cm terninger og fordel på et brett med bakepapir. Stek tørt — uten olje — i 25–30 minutter, snu én gang, til den er mør og karamellisert. La avkjøle til lunken.', 'Värm ugnen till 200°C. Skär sötpotatisen i 2 cm tärningar och bred ut på en plåt med bakplåtspapper. Rosta torrt — utan olja — i 25–30 minuter, vänd en gång, tills mjuk och karamelliserad. Låt svalna till ljummen.'],
      ['Slice the avocado and cucumber and halve the cherry tomatoes.', 'Skjær avokado og agurk i skiver og del cherrytomatene i to.', 'Skiva avokado och gurka och halvera körsbärstomaterna.'],
      ['Arrange the salad leaves in a wide bowl and add the sweet potato, avocado, tomatoes and cucumber.', 'Legg salatbladene i en vid bolle og ha i søtpotet, avokado, tomater og agurk.', 'Lägg salladsbladen i en vid skål och tillsätt sötpotatis, avokado, tomater och gurka.'],
      ['Squeeze the lemon juice over everything, scatter the pumpkin seeds and herbs, season and toss gently at the table.', 'Press sitronsaften over alt, dryss over gresskarkjerner og urter, krydre og vend forsiktig ved bordet.', 'Pressa citronsaften över allt, strö över pumpakärnor och örter, krydda och vänd försiktigt vid bordet.'],
    ],
  },
  {
    id: 'fmd-d1-dinner', category: 'Soup', servings: 1, prepTime: 15, cookTime: 25, weight: 790,
    kcal: 285, macros: { protein: 9, totalFat: 11, totalCarbs: 42, totalSugars: 7, fiber: 11 },
    en: { title: 'White Bean & Vegetable Minestrone', description: 'A light minestrone built on the daily broth, with a small portion of white beans, served with rye crispbread and a little avocado.' },
    no: { title: 'Minestrone med hvite bønner og grønnsaker', description: 'En lett minestrone laget på den daglige buljongen, med en liten porsjon hvite bønner, servert med rugknekkebrød og litt avokado.' },
    sv: { title: 'Minestrone med vita bönor och grönsaker', description: 'En lätt minestrone gjord på den dagliga buljongen, med en liten portion vita bönor, serverad med rågknäckebröd och lite avokado.' },
    ings: [
      [400, 'ml', 'Vegetable broth (from the daily broth)', 'Grønnsaksbuljong (fra den daglige buljongen)', 'Grönsaksbuljong (från den dagliga buljongen)'],
      [80, 'g', 'Courgette', 'Squash', 'Zucchini'],
      [60, 'g', 'Carrot', 'Gulrot', 'Morot'],
      [60, 'g', 'Kale or savoy cabbage, shredded', 'Grønnkål eller savoykål, finstrimlet', 'Grönkål eller savojkål, strimlad'],
      [40, 'g', 'Canned white beans (cannellini), drained and rinsed', 'Hermetiske hvite bønner (cannellini), avrent og skylt', 'Vita bönor på burk (cannellini), avrunna och sköljda'],
      [100, 'g', 'Canned whole tomatoes', 'Hele hermetiske tomater', 'Hela tomater på burk'],
      [6, 'g', 'Garlic cloves', 'Hvitløksfedd', 'Vitlöksklyftor'],
      [2, 'g', 'Fresh rosemary or thyme', 'Frisk rosmarin eller timian', 'Färsk rosmarin eller timjan'],
      [16, 'g', 'Dark rye crispbreads (2)', 'Mørkt rugknekkebrød (2)', 'Mörkt rågknäckebröd (2)'],
      [30, 'g', 'Ripe avocado, sliced, to serve', 'Moden avokado, i skiver, til servering', 'Mogen avokado, skivad, till servering'],
      S,
    ],
    steps: [
      ['Crush and finely chop the garlic, spread it on the board and leave to rest for exactly 10 minutes — this is the allicin activation step, do not skip it.', 'Knus og finhakk hvitløken, fordel den på fjøla og la den hvile i nøyaktig 10 minutter — dette er allicin-aktiveringen, ikke hopp over den.', 'Krossa och finhacka vitlöken, bred ut den på skärbrädan och låt vila i exakt 10 minuter — detta är allicinaktiveringen, hoppa inte över den.'],
      ['Dice the carrot and courgette into 1 cm cubes and shred the kale or cabbage finely.', 'Skjær gulrot og squash i 1 cm terninger og finstrimle grønnkålen eller kålen.', 'Tärna morot och zucchini i 1 cm tärningar och strimla grönkålen eller kålen fint.'],
      ['Heat a little of the broth in a pot over medium heat, add the rested garlic and rosemary and cook 1–2 minutes until fragrant, stirring constantly.', 'Varm litt av buljongen i en gryte på middels varme, ha i den hvilte hvitløken og rosmarinen og fres 1–2 minutter til det dufter, mens du rører hele tiden.', 'Värm lite av buljongen i en gryta på medelvärme, tillsätt den vilade vitlöken och rosmarinen och fräs 1–2 minuter tills det doftar, under ständig omrörning.'],
      ['Add the carrot, courgette and tomatoes, stir to break up the tomatoes, pour in the remaining broth and bring to a simmer.', 'Ha i gulrot, squash og tomater, rør for å dele opp tomatene, hell i resten av buljongen og la det småkoke.', 'Tillsätt morot, zucchini och tomater, rör för att dela tomaterna, häll i resten av buljongen och låt sjuda.'],
      ['After 10 minutes add the kale and white beans and simmer a further 8–10 minutes until just tender. Season.', 'Etter 10 minutter har du i grønnkålen og de hvite bønnene og lar det småkoke videre i 8–10 minutter til alt er såvidt mørt. Smak til.', 'Efter 10 minuter tillsätt grönkålen och de vita bönorna och låt sjuda ytterligare 8–10 minuter tills precis mjukt. Smaka av.'],
      ['Serve hot with the rye crispbreads and sliced avocado on the side.', 'Server varm med rugknekkebrødet og avokadoskivene ved siden av.', 'Servera varm med rågknäckebrödet och avokadoskivorna vid sidan.'],
    ],
  },

  // ---------- DAY 2 ----------
  {
    id: 'fmd-d2-breakfast', category: 'Breakfast', servings: 1, prepTime: 5, cookTime: 0, weight: 150,
    kcal: 240, macros: { protein: 5, totalFat: 20, totalCarbs: 14, totalSugars: 4, fiber: 8 },
    en: { title: 'Almond, Olive & Avocado Plate with Berries', description: 'Intentionally fat-forward and low in protein to suppress IGF-1 on the first full low-calorie day. Almonds and olives mirror the ProLon nut bar.' },
    no: { title: 'Mandel-, oliven- og avokadotallerken med bær', description: 'Bevisst fettrik og proteinfattig for å dempe IGF-1 på den første hele lavkaloridagen. Mandler og oliven speiler ProLon-nøttebaren.' },
    sv: { title: 'Mandel-, oliv- och avokadotallrik med bär', description: 'Medvetet fettrik och proteinfattig för att dämpa IGF-1 på den första hela lågkaloridagen. Mandlar och oliver speglar ProLon-nötbaren.' },
    ings: [
      [15, 'g', 'Raw almonds', 'Rå mandler', 'Råa mandlar'],
      [32, 'g', 'Kalamata or green olives, pitted (8)', 'Kalamata- eller grønne oliven, uten stein (8)', 'Kalamata- eller gröna oliver, urkärnade (8)'],
      [40, 'g', 'Ripe avocado (¼ medium)', 'Moden avokado (¼ middels)', 'Mogen avokado (¼ medium)'],
      [50, 'g', 'Fresh or frozen raspberries or blueberries', 'Friske eller frosne bringebær eller blåbær', 'Färska eller frysta hallon eller blåbär'],
      [10, 'g', 'Whole flaxseed, ground fresh', 'Hele linfrø, ferskmalt', 'Hela linfrön, färskmalda'],
      [2, 'ml', 'Lemon juice', 'Sitronsaft', 'Citronsaft'],
      S,
    ],
    steps: [
      ['Grind the flaxseed fresh and set aside.', 'Mal linfrøene ferskt og sett til side.', 'Mal linfröna färskt och ställ åt sidan.'],
      ['Slice the avocado, fan it onto a plate and add a tiny pinch of salt and the lemon juice.', 'Skjær avokadoen i skiver, vift den ut på en tallerken og tilsett en liten klype salt og sitronsaften.', 'Skiva avokadon, lägg upp den i en solfjäder på en tallrik och tillsätt en liten nypa salt och citronsaften.'],
      ['Arrange the almonds and olives alongside and pile the berries in a small dish.', 'Legg mandlene og olivenene ved siden av og samle bærene i en liten skål.', 'Lägg mandlarna och oliverna bredvid och samla bären i en liten skål.'],
      ['Spoon the ground flaxseed over the avocado and serve immediately.', 'Dryss det malte linfrøet over avokadoen og server med en gang.', 'Strö det malda linfröet över avokadon och servera genast.'],
    ],
  },
  {
    id: 'fmd-d2-lunch', category: 'Soup', servings: 1, prepTime: 10, cookTime: 40, weight: 650,
    kcal: 255, macros: { protein: 6, totalFat: 11, totalCarbs: 35, totalSugars: 9, fiber: 8 },
    en: { title: 'Roasted Pumpkin Soup with Avocado', description: 'Squash roasted dry until completely soft, blended smooth with ginger and cumin, finished with avocado and pumpkin seeds.' },
    no: { title: 'Ovnsbakt gresskarsuppe med avokado', description: 'Gresskar bakt tørt til det er helt mykt, kjørt glatt med ingefær og spisskummen, toppet med avokado og gresskarkjerner.' },
    sv: { title: 'Rostad pumpasoppa med avokado', description: 'Pumpa rostad torr tills helt mjuk, mixad slät med ingefära och spiskummin, toppad med avokado och pumpakärnor.' },
    ings: [
      [300, 'g', 'Butternut squash or pumpkin', 'Butternutsquash eller gresskar', 'Butternutpumpa eller pumpa'],
      [300, 'ml', 'Vegetable broth (from the daily broth)', 'Grønnsaksbuljong (fra den daglige buljongen)', 'Grönsaksbuljong (från den dagliga buljongen)'],
      [35, 'g', 'Ripe avocado', 'Moden avokado', 'Mogen avokado'],
      [6, 'g', 'Garlic cloves', 'Hvitløksfedd', 'Vitlöksklyftor'],
      [5, 'g', 'Fresh ginger root, grated', 'Frisk ingefær, revet', 'Färsk ingefära, riven'],
      [1, 'g', 'Ground cumin', 'Malt spisskummen', 'Malen spiskummin'],
      [5, 'g', 'Pumpkin seeds', 'Gresskarkjerner', 'Pumpakärnor'],
      S,
    ],
    steps: [
      ['Heat the oven to 200°C. Halve the squash, remove the seeds and roast cut-side down on a lined tray for 35–40 minutes until completely soft. Scoop out the flesh and discard the skin.', 'Varm ovnen til 200°C. Del gresskaret i to, fjern frøene og stek det med snittflaten ned på et brett med bakepapir i 35–40 minutter til det er helt mykt. Skrap ut fruktkjøttet og kast skallet.', 'Värm ugnen till 200°C. Halvera pumpan, ta ur kärnorna och rosta med snittytan nedåt på en plåt med bakplåtspapper i 35–40 minuter tills helt mjuk. Skrapa ur fruktköttet och släng skalet.'],
      ['Crush and chop the garlic and rest it on the board for 10 minutes.', 'Knus og hakk hvitløken og la den hvile på fjøla i 10 minutter.', 'Krossa och hacka vitlöken och låt den vila på skärbrädan i 10 minuter.'],
      ['Heat a little broth in a pot, add the rested garlic, grated ginger and cumin and stir over medium heat for 1–2 minutes.', 'Varm litt buljong i en gryte, ha i den hvilte hvitløken, revet ingefær og spisskummen og rør på middels varme i 1–2 minutter.', 'Värm lite buljong i en gryta, tillsätt den vilade vitlöken, riven ingefära och spiskummin och rör på medelvärme i 1–2 minuter.'],
      ['Add the roasted squash and remaining broth, stir, simmer 5 minutes, then blend completely smooth, adding more broth if too thick. Season.', 'Ha i det bakte gresskaret og resten av buljongen, rør, la det småkoke i 5 minutter og kjør så helt glatt, tilsett mer buljong om det er for tykt. Smak til.', 'Tillsätt den rostade pumpan och resten av buljongen, rör, låt sjuda i 5 minuter och mixa sedan helt slät, tillsätt mer buljong om det är för tjockt. Smaka av.'],
      ['Pour into a bowl, top with diced avocado and scatter over the pumpkin seeds. Serve immediately.', 'Hell opp i en bolle, topp med avokado i terninger og dryss over gresskarkjernene. Server med en gang.', 'Häll upp i en skål, toppa med tärnad avokado och strö över pumpakärnorna. Servera genast.'],
    ],
  },
  {
    id: 'fmd-d2-dinner', category: 'Main', servings: 1, prepTime: 10, cookTime: 5, weight: 350,
    kcal: 255, macros: { protein: 10, totalFat: 14, totalCarbs: 24, totalSugars: 3, fiber: 10 },
    en: { title: 'Steamed Broccoli & Spinach Bowl with Avocado', description: 'Lightly steamed greens to preserve the glucosinolates, dressed with rested garlic, lemon and sesame, with rye crispbread.' },
    no: { title: 'Dampet brokkoli- og spinatbolle med avokado', description: 'Lett dampede grønnsaker for å bevare glukosinolatene, vendt med hvilt hvitløk, sitron og sesam, med rugknekkebrød.' },
    sv: { title: 'Ångad broccoli- och spenatskål med avokado', description: 'Lätt ångade gröna grönsaker för att bevara glukosinolaterna, vända med vilad vitlök, citron och sesam, med rågknäckebröd.' },
    ings: [
      [150, 'g', 'Broccoli florets', 'Brokkolibuketter', 'Broccolibuketter'],
      [100, 'g', 'Fresh spinach', 'Frisk spinat', 'Färsk spenat'],
      [60, 'g', 'Ripe avocado', 'Moden avokado', 'Mogen avokado'],
      [5, 'g', 'Sesame seeds', 'Sesamfrø', 'Sesamfrön'],
      [15, 'ml', 'Lemon juice', 'Sitronsaft', 'Citronsaft'],
      [3, 'g', 'Garlic clove', 'Hvitløksfedd', 'Vitlöksklyfta'],
      [16, 'g', 'Dark rye crispbreads (2)', 'Mørkt rugknekkebrød (2)', 'Mörkt rågknäckebröd (2)'],
      S,
    ],
    steps: [
      ['Crush and chop the garlic and rest it on the board for 10 minutes.', 'Knus og hakk hvitløken og la den hvile på fjøla i 10 minutter.', 'Krossa och hacka vitlöken och låt den vila på skärbrädan i 10 minuter.'],
      ['Steam the broccoli over boiling water for 3–4 minutes maximum, until just tender but still bright green. Do not boil. Transfer to a bowl.', 'Damp brokkolien over kokende vann i maks 3–4 minutter, til den er såvidt mør men fortsatt knallgrønn. Ikke kok den. Ha den over i en bolle.', 'Ånga broccolin över kokande vatten i högst 3–4 minuter, tills precis mjuk men fortfarande klargrön. Koka den inte. Lägg över i en skål.'],
      ['Steam the spinach in the same basket for 60–90 seconds until just wilted, then squeeze out excess water gently.', 'Damp spinaten i samme kurv i 60–90 sekunder til den så vidt har falt sammen, og klem forsiktig ut overflødig vann.', 'Ånga spenaten i samma korg i 60–90 sekunder tills den precis sjunkit ihop, och krama försiktigt ur överflödigt vatten.'],
      ['Add the rested garlic directly over the warm vegetables — the residual heat softens it without destroying the allicin.', 'Ha den hvilte hvitløken rett over de varme grønnsakene — restvarmen mykner den uten å ødelegge allicinet.', 'Lägg den vilade vitlöken direkt över de varma grönsakerna — restvärmen mjukar upp den utan att förstöra allicinet.'],
      ['Lay sliced avocado over the top, squeeze the lemon juice over everything, scatter the sesame seeds and season. Serve with the rye crispbreads.', 'Legg avokadoskiver over, press sitronsaften over alt, dryss over sesamfrø og krydre. Server med rugknekkebrødet.', 'Lägg avokadoskivor över, pressa citronsaften över allt, strö över sesamfrön och krydda. Servera med rågknäckebrödet.'],
    ],
  },

  // ---------- DAY 3 ----------
  {
    id: 'fmd-d3-breakfast', category: 'Breakfast', servings: 1, prepTime: 5, cookTime: 5, weight: 330,
    kcal: 230, macros: { protein: 7, totalFat: 11, totalCarbs: 27, totalSugars: 8, fiber: 13 },
    en: { title: 'Warm Chia Pudding with Stewed Berries', description: 'Chia soaked overnight in oat milk, gently warmed and topped with a loose warm berry sauce, flax and cardamom.' },
    no: { title: 'Varm chiapudding med stuede bær', description: 'Chia bløtlagt over natten i havremelk, lunet forsiktig og toppet med en løs varm bærsaus, linfrø og kardemomme.' },
    sv: { title: 'Varm chiapudding med stuvade bär', description: 'Chia blötlagd över natten i havremjölk, försiktigt uppvärmd och toppad med en lös varm bärsås, linfrö och kardemumma.' },
    ings: [
      [30, 'g', 'Chia seeds', 'Chiafrø', 'Chiafrön'],
      [180, 'ml', 'Unsweetened oat milk', 'Usøtet havremelk', 'Osötad havremjölk'],
      [50, 'ml', 'Water', 'Vann', 'Vatten'],
      [60, 'g', 'Fresh or frozen berries (blueberries, raspberries)', 'Friske eller frosne bær (blåbær, bringebær)', 'Färska eller frysta bär (blåbär, hallon)'],
      [10, 'g', 'Whole flaxseed, ground fresh', 'Hele linfrø, ferskmalt', 'Hela linfrön, färskmalda'],
      [0.5, 'g', 'Ground cardamom', 'Malt kardemomme', 'Malen kardemumma'],
      [0.5, 'g', 'Ceylon cinnamon', 'Ceylonkanel', 'Ceylonkanel'],
    ],
    steps: [
      ['The evening before, stir the chia seeds into the oat milk and water, cover and refrigerate overnight (at least 6 hours).', 'Kvelden før rører du chiafrøene ut i havremelken og vannet, dekker til og setter i kjøleskapet over natten (minst 6 timer).', 'Kvällen innan rör du ut chiafröna i havremjölken och vattnet, täck över och ställ i kylen över natten (minst 6 timmar).'],
      ['In the morning, gently warm the set pudding in a small saucepan over low heat for 3–4 minutes, stirring — it should be warm, not hot.', 'Om morgenen lunes den ferdige puddingen forsiktig i en liten kjele på lav varme i 3–4 minutter mens du rører — den skal være lun, ikke varm.', 'På morgonen värmer du försiktigt den färdiga puddingen i en liten kastrull på låg värme i 3–4 minuter under omrörning — den ska vara ljummen, inte het.'],
      ['In a separate pan, heat the berries with a little water for 3–4 minutes until they burst into a loose sauce.', 'I en annen panne varmer du bærene med litt vann i 3–4 minutter til de sprekker og blir en løs saus.', 'I en annan panna värmer du bären med lite vatten i 3–4 minuter tills de spricker och blir en lös sås.'],
      ['Grind the flax fresh. Spoon the warm pudding into a bowl, pour over the berry sauce, top with the ground flax and dust with cardamom and cinnamon.', 'Mal linfrøet ferskt. Ha den lune puddingen i en bolle, hell over bærsausen, topp med det malte linfrøet og dryss med kardemomme og kanel.', 'Mal linfröet färskt. Lägg den ljumna puddingen i en skål, häll över bärsåsen, toppa med det malda linfröet och pudra med kardemumma och kanel.'],
    ],
  },
  {
    id: 'fmd-d3-lunch', category: 'Soup', servings: 1, prepTime: 10, cookTime: 25, weight: 765,
    kcal: 230, macros: { protein: 8, totalFat: 11, totalCarbs: 30, totalSugars: 7, fiber: 10 },
    en: { title: 'Red Lentil & Tomato Soup', description: 'A small portion of red lentils simmered with tomato and spices, half-blended for texture, with avocado and walnuts on the side.' },
    no: { title: 'Suppe med røde linser og tomat', description: 'En liten porsjon røde linser kokt med tomat og krydder, halvkjørt for tekstur, med avokado og valnøtter ved siden av.' },
    sv: { title: 'Soppa med röda linser och tomat', description: 'En liten portion röda linser kokt med tomat och kryddor, halvmixad för konsistens, med avokado och valnötter vid sidan.' },
    ings: [
      [30, 'g', 'Red lentils (dry weight)', 'Røde linser (tørrvekt)', 'Röda linser (torrvikt)'],
      [400, 'ml', 'Vegetable broth (from the daily broth)', 'Grønnsaksbuljong (fra den daglige buljongen)', 'Grönsaksbuljong (från den dagliga buljongen)'],
      [200, 'g', 'Ripe tomatoes', 'Modne tomater', 'Mogna tomater'],
      [50, 'g', 'Celery stalk', 'Selleristilk', 'Selleristjälk'],
      [6, 'g', 'Garlic cloves', 'Hvitløksfedd', 'Vitlöksklyftor'],
      [1, 'g', 'Ground cumin', 'Malt spisskummen', 'Malen spiskummin'],
      [1, 'g', 'Ground coriander', 'Malt koriander', 'Malen koriander'],
      [0.5, 'g', 'Smoked paprika', 'Røkt paprika', 'Rökt paprika'],
      [15, 'ml', 'Lemon juice', 'Sitronsaft', 'Citronsaft'],
      [5, 'g', 'Fresh parsley', 'Frisk persille', 'Färsk persilja'],
      [50, 'g', 'Avocado, diced, to serve', 'Avokado, i terninger, til servering', 'Avokado, tärnad, till servering'],
      [8, 'g', 'Walnuts, broken, to serve', 'Valnøtter, knust, til servering', 'Valnötter, krossade, till servering'],
      S,
    ],
    steps: [
      ['Rinse the lentils until the water runs clear. Crush and chop the garlic and rest it on the board for 10 minutes.', 'Skyll linsene til vannet er klart. Knus og hakk hvitløken og la den hvile på fjøla i 10 minutter.', 'Skölj linserna tills vattnet är klart. Krossa och hacka vitlöken och låt den vila på skärbrädan i 10 minuter.'],
      ['Dice the tomatoes and celery. Heat a little broth in a pot, add the rested garlic, cumin, coriander and paprika and stir 1–2 minutes until fragrant.', 'Skjær tomater og selleri i terninger. Varm litt buljong i en gryte, ha i hvilt hvitløk, spisskummen, koriander og paprika og rør i 1–2 minutter til det dufter.', 'Tärna tomater och selleri. Värm lite buljong i en gryta, tillsätt vilad vitlök, spiskummin, koriander och paprika och rör 1–2 minuter tills det doftar.'],
      ['Add the tomatoes and celery, cook 3 minutes, then add the lentils and remaining broth. Bring to the boil, then simmer 20–25 minutes until the lentils are completely soft.', 'Ha i tomater og selleri, kok i 3 minutter, og tilsett så linsene og resten av buljongen. Kok opp og la det småkoke i 20–25 minutter til linsene er helt myke.', 'Tillsätt tomater och selleri, koka 3 minuter, och tillsätt sedan linserna och resten av buljongen. Koka upp och låt sjuda 20–25 minuter tills linserna är helt mjuka.'],
      ['Blend about half the soup, leaving some texture. Stir in the lemon juice and season.', 'Kjør omtrent halvparten av suppen, så det fortsatt er litt tekstur. Rør inn sitronsaften og smak til.', 'Mixa ungefär halva soppan så att det finns kvar lite konsistens. Rör i citronsaften och smaka av.'],
      ['Serve topped with parsley, with the diced avocado and broken walnuts on the side.', 'Server toppet med persille, med avokadoterningene og de knuste valnøttene ved siden av.', 'Servera toppad med persilja, med den tärnade avokadon och de krossade valnötterna vid sidan.'],
    ],
  },
  {
    id: 'fmd-d3-dinner', category: 'Main', servings: 1, prepTime: 15, cookTime: 35, weight: 420,
    kcal: 240, macros: { protein: 6, totalFat: 11, totalCarbs: 31, totalSugars: 11, fiber: 9 },
    en: { title: 'Roasted Root Vegetables with Steamed Kale & Walnuts', description: 'Carrot, beetroot and parsnip roasted dry with herbs until caramelised, over lemon-dressed steamed kale with walnuts and avocado.' },
    no: { title: 'Ovnsbakte rotgrønnsaker med dampet grønnkål og valnøtter', description: 'Gulrot, rødbete og pastinakk bakt tørt med urter til de er karamellisert, over sitrondresset dampet grønnkål med valnøtter og avokado.' },
    sv: { title: 'Rostade rotfrukter med ångad grönkål och valnötter', description: 'Morot, rödbeta och palsternacka rostade torra med örter tills karamelliserade, över citrondressad ångad grönkål med valnötter och avokado.' },
    ings: [
      [80, 'g', 'Carrot', 'Gulrot', 'Morot'],
      [70, 'g', 'Beetroot (raw)', 'Rødbete (rå)', 'Rödbeta (rå)'],
      [60, 'g', 'Parsnip', 'Pastinakk', 'Palsternacka'],
      [80, 'g', 'Kale, stems removed', 'Grønnkål, stilker fjernet', 'Grönkål, stjälkar borttagna'],
      [12, 'g', 'Walnuts, roughly broken', 'Valnøtter, grovt knust', 'Valnötter, grovt krossade'],
      [30, 'g', 'Avocado, diced', 'Avokado, i terninger', 'Avokado, tärnad'],
      [15, 'ml', 'Lemon juice', 'Sitronsaft', 'Citronsaft'],
      [2, 'g', 'Fresh rosemary', 'Frisk rosmarin', 'Färsk rosmarin'],
      [2, 'g', 'Fresh thyme', 'Frisk timian', 'Färsk timjan'],
      S,
    ],
    steps: [
      ['Heat the oven to 200°C. Peel the beetroot (it stains) and cut all the root vegetables into 2–3 cm chunks, keeping the beetroot separate as its colour bleeds.', 'Varm ovnen til 200°C. Skrell rødbeten (den farger) og skjær alle rotgrønnsakene i 2–3 cm biter, hold rødbeten for seg selv siden fargen smitter.', 'Värm ugnen till 200°C. Skala rödbetan (den färgar) och skär alla rotfrukter i 2–3 cm bitar, håll rödbetan för sig då färgen smittar.'],
      ['Spread the vegetables in a single layer on a lined tray, scatter over the rosemary and thyme, season and roast dry for 30–35 minutes, turning once, until caramelised and tender.', 'Fordel grønnsakene i ett lag på et brett med bakepapir, dryss over rosmarin og timian, krydre og stek tørt i 30–35 minutter, snu én gang, til de er karamellisert og møre.', 'Bred ut grönsakerna i ett lager på en plåt med bakplåtspapper, strö över rosmarin och timjan, krydda och rosta torrt i 30–35 minuter, vänd en gång, tills karamelliserade och mjuka.'],
      ['With 5 minutes to go, steam the kale over boiling water for 3–4 minutes until tender, then squeeze gently and dress with the lemon juice and a pinch of salt.', 'Når det er 5 minutter igjen, damp grønnkålen over kokende vann i 3–4 minutter til den er mør, klem den forsiktig og vend den med sitronsaften og en klype salt.', 'När det är 5 minuter kvar, ånga grönkålen över kokande vatten i 3–4 minuter tills mjuk, krama försiktigt och vänd med citronsaften och en nypa salt.'],
      ['Arrange the kale in a bowl, place the roasted roots on top and scatter over the walnuts and diced avocado. Serve immediately.', 'Legg grønnkålen i en bolle, ha de bakte rotgrønnsakene på toppen og dryss over valnøtter og avokadoterninger. Server med en gang.', 'Lägg grönkålen i en skål, placera de rostade rotfrukterna ovanpå och strö över valnötter och tärnad avokado. Servera genast.'],
    ],
  },

  // ---------- DAY 4 ----------
  {
    id: 'fmd-d4-breakfast', category: 'Breakfast', servings: 1, prepTime: 5, cookTime: 10, weight: 230,
    kcal: 215, macros: { protein: 4, totalFat: 11, totalCarbs: 27, totalSugars: 16, fiber: 6 },
    en: { title: 'Warm Stewed Apple with Walnuts & Flaxseed', description: 'Apple stewed soft with warming spices, topped with walnuts and fresh-ground flaxseed. Comforting and naturally sweet.' },
    no: { title: 'Varm stuet eple med valnøtter og linfrø', description: 'Eple stuet mykt med varmende krydder, toppet med valnøtter og ferskmalt linfrø. Trøstende og naturlig søtt.' },
    sv: { title: 'Varmt stuvat äpple med valnötter och linfrö', description: 'Äpple stuvat mjukt med värmande kryddor, toppat med valnötter och färskmalet linfrö. Tröstande och naturligt sött.' },
    ings: [
      [150, 'g', 'Apple (firm variety — Granny Smith or Cox)', 'Eple (fast sort — Granny Smith eller Cox)', 'Äpple (fast sort — Granny Smith eller Cox)'],
      [60, 'ml', 'Water', 'Vann', 'Vatten'],
      [12, 'g', 'Walnuts, roughly broken (about 8 halves)', 'Valnøtter, grovt knust (ca. 8 halvdeler)', 'Valnötter, grovt krossade (ca 8 halvor)'],
      [10, 'g', 'Whole flaxseed, ground fresh', 'Hele linfrø, ferskmalt', 'Hela linfrön, färskmalda'],
      [0.5, 'g', 'Ceylon cinnamon', 'Ceylonkanel', 'Ceylonkanel'],
      [0.5, 'g', 'Ground cardamom', 'Malt kardemomme', 'Malen kardemumma'],
      [null, '', 'Ground cloves, tiny pinch', 'Malt nellik, en liten klype', 'Malen kryddnejlika, en liten nypa'],
    ],
    steps: [
      ['Peel, core and dice the apple into 1 cm cubes.', 'Skrell, fjern kjernehuset og skjær eplet i 1 cm terninger.', 'Skala, kärna ur och tärna äpplet i 1 cm tärningar.'],
      ['Place in a small saucepan with the water and spices, cover and cook over low-medium heat for 8–10 minutes, stirring occasionally, until completely soft and most of the liquid has absorbed. Add a splash more water if it dries out.', 'Ha det i en liten kjele med vannet og krydderne, legg på lokk og kok på lav-middels varme i 8–10 minutter, rør innimellom, til det er helt mykt og det meste av væsken er trukket inn. Tilsett litt mer vann om det tørker ut.', 'Lägg i en liten kastrull med vattnet och kryddorna, lägg på lock och koka på låg-medelvärme i 8–10 minuter, rör då och då, tills helt mjukt och det mesta av vätskan absorberats. Tillsätt en skvätt mer vatten om det torkar ut.'],
      ['Grind the flax fresh. Spoon the stewed apple into a bowl, scatter over the walnuts and spoon the ground flax on last. Serve warm.', 'Mal linfrøet ferskt. Ha det stuede eplet i en bolle, dryss over valnøttene og ha det malte linfrøet på til slutt. Server varmt.', 'Mal linfröet färskt. Lägg det stuvade äpplet i en skål, strö över valnötterna och lägg det malda linfröet sist. Servera varmt.'],
    ],
  },
  {
    id: 'fmd-d4-lunch', category: 'Soup', servings: 1, prepTime: 10, cookTime: 18, weight: 670,
    kcal: 195, macros: { protein: 6, totalFat: 9, totalCarbs: 24, totalSugars: 8, fiber: 7 },
    en: { title: 'Courgette & Cauliflower Soup with Avocado', description: 'Cauliflower blends to a creamy soup with no dairy at all, gently spiced with nutmeg and finished with avocado.' },
    no: { title: 'Squash- og blomkålsuppe med avokado', description: 'Blomkål kjøres til en kremet suppe helt uten meieriprodukter, mildt krydret med muskat og toppet med avokado.' },
    sv: { title: 'Zucchini- och blomkålssoppa med avokado', description: 'Blomkål mixas till en krämig soppa helt utan mejeriprodukter, milt kryddad med muskot och toppad med avokado.' },
    ings: [
      [150, 'g', 'Courgette', 'Squash', 'Zucchini'],
      [120, 'g', 'Cauliflower florets', 'Blomkålbuketter', 'Blomkålsbuketter'],
      [350, 'ml', 'Vegetable broth (from the daily broth)', 'Grønnsaksbuljong (fra den daglige buljongen)', 'Grönsaksbuljong (från den dagliga buljongen)'],
      [6, 'g', 'Garlic cloves', 'Hvitløksfedd', 'Vitlöksklyftor'],
      [8, 'g', 'Fresh flat-leaf parsley', 'Frisk bladpersille', 'Färsk slätbladig persilja'],
      [null, '', 'Ground nutmeg, tiny pinch', 'Malt muskat, en liten klype', 'Malen muskot, en liten nypa'],
      [35, 'g', 'Ripe avocado, sliced, to serve', 'Moden avokado, i skiver, til servering', 'Mogen avokado, skivad, till servering'],
      [null, '', 'Sea salt, to taste', 'Havsalt, etter smak', 'Havssalt, efter smak'],
    ],
    steps: [
      ['Crush and chop the garlic and rest it on the board for 10 minutes.', 'Knus og hakk hvitløken og la den hvile på fjøla i 10 minutter.', 'Krossa och hacka vitlöken och låt den vila på skärbrädan i 10 minuter.'],
      ['Cut the courgette into rounds and break the cauliflower into small florets.', 'Skjær squashen i skiver og del blomkålen i små buketter.', 'Skär zucchinin i skivor och dela blomkålen i små buketter.'],
      ['Heat a little broth in a pot, add the rested garlic and stir for 1 minute.', 'Varm litt buljong i en gryte, ha i den hvilte hvitløken og rør i 1 minutt.', 'Värm lite buljong i en gryta, tillsätt den vilade vitlöken och rör i 1 minut.'],
      ['Add the courgette, cauliflower and remaining broth, bring to a simmer and cook covered for 15–18 minutes until the cauliflower is completely tender.', 'Ha i squash, blomkål og resten av buljongen, la det småkoke og kok under lokk i 15–18 minutter til blomkålen er helt mør.', 'Tillsätt zucchini, blomkål och resten av buljongen, låt sjuda och koka under lock i 15–18 minuter tills blomkålen är helt mjuk.'],
      ['Add the parsley and nutmeg and blend completely smooth. Season with salt.', 'Ha i persille og muskat og kjør helt glatt. Smak til med salt.', 'Tillsätt persilja och muskot och mixa helt slät. Smaka av med salt.'],
      ['Serve in a bowl with thin slices of avocado across the top.', 'Server i en bolle med tynne avokadoskiver på toppen.', 'Servera i en skål med tunna avokadoskivor över.'],
    ],
  },
  {
    id: 'fmd-d4-dinner', category: 'Main', servings: 1, prepTime: 15, cookTime: 25, weight: 440,
    kcal: 310, macros: { protein: 13, totalFat: 4, totalCarbs: 56, totalSugars: 8, fiber: 11 },
    en: { title: 'Quinoa-Stuffed Roasted Pepper with Steamed Spinach', description: 'A roasted pepper filled with quinoa, black beans and tomato, served with garlic-and-lemon steamed spinach. The most substantial dinner of the week.' },
    no: { title: 'Quinoafylt ovnsbakt paprika med dampet spinat', description: 'En ovnsbakt paprika fylt med quinoa, sorte bønner og tomat, servert med hvitløks- og sitrondampet spinat. Ukens mest solide middag.' },
    sv: { title: 'Quinoafylld rostad paprika med ångad spenat', description: 'En rostad paprika fylld med quinoa, svarta bönor och tomat, serverad med vitlöks- och citronångad spenat. Veckans matigaste middag.' },
    ings: [
      [180, 'g', 'Red bell pepper (1 large)', 'Rød paprika (1 stor)', 'Röd paprika (1 stor)'],
      [40, 'g', 'Quinoa (dry weight)', 'Quinoa (tørrvekt)', 'Quinoa (torrvikt)'],
      [40, 'g', 'Canned black beans, drained and rinsed', 'Hermetiske sorte bønner, avrent og skylt', 'Svarta bönor på burk, avrunna och sköljda'],
      [60, 'g', 'Cherry tomatoes', 'Cherrytomater', 'Körsbärstomater'],
      [100, 'g', 'Fresh spinach', 'Frisk spinat', 'Färsk spenat'],
      [3, 'g', 'Garlic clove', 'Hvitløksfedd', 'Vitlöksklyfta'],
      [1, 'g', 'Ground cumin', 'Malt spisskummen', 'Malen spiskummin'],
      [1, 'g', 'Ground coriander', 'Malt koriander', 'Malen koriander'],
      [15, 'ml', 'Lemon juice', 'Sitronsaft', 'Citronsaft'],
      S,
    ],
    steps: [
      ['Rinse the quinoa and cook in a little water or broth with a pinch of salt: bring to the boil, cover and simmer 12–15 minutes until the liquid is absorbed and the germ has unwound. Fluff with a fork.', 'Skyll quinoaen og kok den i litt vann eller buljong med en klype salt: kok opp, legg på lokk og la småkoke i 12–15 minutter til væsken er trukket inn og kimen har løsnet. Luft den opp med en gaffel.', 'Skölj quinoan och koka den i lite vatten eller buljong med en nypa salt: koka upp, lägg på lock och låt sjuda 12–15 minuter tills vätskan absorberats och grodden vecklat ut sig. Lucka upp med en gaffel.'],
      ['Heat the oven to 200°C. Halve the pepper lengthways, remove the seeds and membrane and roast cut-side up for 15 minutes until slightly softened.', 'Varm ovnen til 200°C. Del paprikaen i to på langs, fjern frø og hinner og stek den med snittflaten opp i 15 minutter til den er litt myknet.', 'Värm ugnen till 200°C. Halvera paprikan på längden, ta bort kärnor och hinnor och rosta med snittytan uppåt i 15 minuter tills den mjuknat något.'],
      ['Mix the cooked quinoa with the black beans, halved cherry tomatoes, cumin and coriander, and season.', 'Bland den kokte quinoaen med sorte bønner, halverte cherrytomater, spisskummen og koriander, og smak til.', 'Blanda den kokta quinoan med svarta bönor, halverade körsbärstomater, spiskummin och koriander, och smaka av.'],
      ['Fill the pepper halves with the quinoa mixture and return to the oven for a further 10 minutes.', 'Fyll paprikahalvdelene med quinoablandingen og sett tilbake i ovnen i 10 minutter til.', 'Fyll paprikahalvorna med quinoablandningen och sätt tillbaka i ugnen i ytterligare 10 minuter.'],
      ['Crush and chop the garlic and rest 10 minutes. Steam the spinach for 60–90 seconds until just wilted, then toss with the rested garlic and lemon juice.', 'Knus og hakk hvitløken og la den hvile i 10 minutter. Damp spinaten i 60–90 sekunder til den så vidt har falt sammen, og vend den med hvilt hvitløk og sitronsaft.', 'Krossa och hacka vitlöken och låt vila 10 minuter. Ånga spenaten i 60–90 sekunder tills den precis sjunkit ihop, och vänd med den vilade vitlöken och citronsaften.'],
      ['Serve the stuffed pepper alongside the dressed spinach.', 'Server den fylte paprikaen ved siden av den vendte spinaten.', 'Servera den fyllda paprikan vid sidan av den vända spenaten.'],
    ],
  },

  // ---------- DAY 5 ----------
  {
    id: 'fmd-d5-breakfast', category: 'Breakfast', servings: 1, prepTime: 5, cookTime: 0, weight: 200,
    kcal: 225, macros: { protein: 7, totalFat: 9, totalCarbs: 31, totalSugars: 7, fiber: 8 },
    en: { title: 'Overnight Oats with Almond Butter & Berries', description: 'Oats and chia soaked overnight, served cold or gently warmed, with a little almond butter, berries and fresh-ground flax.' },
    no: { title: 'Overnatts-havregryn med mandelsmør og bær', description: 'Havregryn og chia bløtlagt over natten, servert kaldt eller lunt, med litt mandelsmør, bær og ferskmalt linfrø.' },
    sv: { title: 'Overnight-havregryn med mandelsmör och bär', description: 'Havregryn och chia blötlagda över natten, serverade kalla eller ljumma, med lite mandelsmör, bär och färskmalet linfrö.' },
    ings: [
      [30, 'g', 'Rolled oats (dry weight)', 'Havregryn (tørrvekt)', 'Havregryn (torrvikt)'],
      [100, 'ml', 'Water', 'Vann', 'Vatten'],
      [5, 'g', 'Chia seeds', 'Chiafrø', 'Chiafrön'],
      [8, 'g', 'Natural almond butter (no added oil or sugar)', 'Naturlig mandelsmør (uten tilsatt olje eller sukker)', 'Naturligt mandelsmör (utan tillsatt olja eller socker)'],
      [50, 'g', 'Fresh or frozen berries', 'Friske eller frosne bær', 'Färska eller frysta bär'],
      [10, 'g', 'Whole flaxseed, ground fresh', 'Hele linfrø, ferskmalt', 'Hela linfrön, färskmalda'],
      [0.5, 'g', 'Ceylon cinnamon', 'Ceylonkanel', 'Ceylonkanel'],
    ],
    steps: [
      ['The evening before, combine the oats, chia and water in a jar, stir well, cover and refrigerate overnight.', 'Kvelden før blander du havregryn, chia og vann i et glass, rører godt, dekker til og setter i kjøleskapet over natten.', 'Kvällen innan blandar du havregryn, chia och vatten i en burk, rör väl, täck över och ställ i kylen över natten.'],
      ['In the morning, serve at room temperature, or warm gently in a saucepan for 3–4 minutes with a splash of water if you prefer it hot.', 'Om morgenen serverer du det romtemperert, eller varmer det forsiktig i en kjele i 3–4 minutter med en skvett vann om du vil ha det varmt.', 'På morgonen serverar du det rumstempererat, eller värmer det försiktigt i en kastrull i 3–4 minuter med en skvätt vatten om du vill ha det varmt.'],
      ['Spoon the almond butter over and stir in partially, add the berries, grind the flax fresh over the top and dust with cinnamon.', 'Ha mandelsmøret over og rør det delvis inn, tilsett bærene, mal linfrøet ferskt over og dryss med kanel.', 'Lägg mandelsmöret över och rör in det delvis, tillsätt bären, mal linfröet färskt över och pudra med kanel.'],
    ],
  },
  {
    id: 'fmd-d5-lunch', category: 'Soup', servings: 1, prepTime: 10, cookTime: 30, weight: 815,
    kcal: 175, macros: { protein: 4, totalFat: 7, totalCarbs: 26, totalSugars: 12, fiber: 8 },
    en: { title: 'Roasted Tomato & Fennel Soup with Avocado', description: 'Roasting the tomatoes, fennel and carrot first concentrates the flavour dramatically before they are blended smooth with basil.' },
    no: { title: 'Ovnsbakt tomat- og fennikelsuppe med avokado', description: 'Å bake tomatene, fennikelen og gulroten først konsentrerer smaken kraftig før de kjøres glatt med basilikum.' },
    sv: { title: 'Rostad tomat- och fänkålssoppa med avokado', description: 'Att rosta tomaterna, fänkålen och moroten först koncentrerar smaken rejält innan de mixas släta med basilika.' },
    ings: [
      [300, 'g', 'Ripe tomatoes (about 3 medium)', 'Modne tomater (ca. 3 middels)', 'Mogna tomater (ca 3 medium)'],
      [100, 'g', 'Fennel bulb (½ bulb)', 'Fennikel (½ knoll)', 'Fänkål (½ stånd)'],
      [70, 'g', 'Carrot (1 small)', 'Gulrot (1 liten)', 'Morot (1 liten)'],
      [300, 'ml', 'Vegetable broth (from the daily broth)', 'Grønnsaksbuljong (fra den daglige buljongen)', 'Grönsaksbuljong (från den dagliga buljongen)'],
      [6, 'g', 'Garlic cloves', 'Hvitløksfedd', 'Vitlöksklyftor'],
      [6, 'g', 'Fresh basil leaves', 'Friske basilikumblader', 'Färska basilikablad'],
      [35, 'g', 'Ripe avocado, sliced, to serve', 'Moden avokado, i skiver, til servering', 'Mogen avokado, skivad, till servering'],
      S,
    ],
    steps: [
      ['Heat the oven to 200°C. Halve the tomatoes, cut the fennel into wedges and the carrot into chunks, spread on a lined tray and roast dry for 25–30 minutes until the tomatoes are collapsed and slightly charred — this is the key flavour step.', 'Varm ovnen til 200°C. Del tomatene i to, skjær fennikelen i båter og gulroten i biter, fordel på et brett med bakepapir og stek tørt i 25–30 minutter til tomatene har falt sammen og er lett brunet — dette er det viktigste smakstrinnet.', 'Värm ugnen till 200°C. Halvera tomaterna, skär fänkålen i klyftor och moroten i bitar, bred ut på en plåt med bakplåtspapper och rosta torrt i 25–30 minuter tills tomaterna fallit ihop och fått lite färg — detta är det viktigaste smaksteget.'],
      ['Crush and chop the garlic and rest it on the board for 10 minutes while the vegetables roast.', 'Knus og hakk hvitløken og la den hvile på fjøla i 10 minutter mens grønnsakene steker.', 'Krossa och hacka vitlöken och låt den vila på skärbrädan i 10 minuter medan grönsakerna rostar.'],
      ['Heat a little broth in a pot, add the rested garlic and cook for 1 minute, then add all the roasted vegetables and remaining broth and simmer 5 minutes.', 'Varm litt buljong i en gryte, ha i den hvilte hvitløken og fres i 1 minutt, tilsett så alle de bakte grønnsakene og resten av buljongen og la det småkoke i 5 minutter.', 'Värm lite buljong i en gryta, tillsätt den vilade vitlöken och fräs 1 minut, tillsätt sedan alla rostade grönsaker och resten av buljongen och låt sjuda 5 minuter.'],
      ['Add the basil and blend completely smooth, adding more broth if too thick. Season.', 'Ha i basilikumen og kjør helt glatt, tilsett mer buljong om det er for tykt. Smak til.', 'Tillsätt basilikan och mixa helt slät, tillsätt mer buljong om det är för tjockt. Smaka av.'],
      ['Serve in a bowl with thin slices of avocado on top.', 'Server i en bolle med tynne avokadoskiver på toppen.', 'Servera i en skål med tunna avokadoskivor över.'],
    ],
  },
  {
    id: 'fmd-d5-dinner', category: 'Salad', servings: 1, prepTime: 10, cookTime: 5, weight: 595,
    kcal: 310, macros: { protein: 8, totalFat: 22, totalCarbs: 24, totalSugars: 6, fiber: 12 },
    en: { title: 'Celebration Green Bowl with Avocado', description: 'A generous final-day bowl of steamed greens, cucumber and tomato with plenty of avocado, walnuts and a tamari-lime dressing.' },
    no: { title: 'Feiringsbolle med grønt og avokado', description: 'En raus siste-dags bolle med dampede grønnsaker, agurk og tomat med rikelig avokado, valnøtter og en tamari-lime-dressing.' },
    sv: { title: 'Firandeskål med grönt och avokado', description: 'En generös sista-dagen-skål med ångade grönsaker, gurka och tomat med rikligt av avokado, valnötter och en tamari-lime-dressing.' },
    ings: [
      [150, 'g', 'Broccoli florets', 'Brokkolibuketter', 'Broccolibuketter'],
      [80, 'g', 'Fresh spinach', 'Frisk spinat', 'Färsk spenat'],
      [100, 'g', 'Cherry tomatoes', 'Cherrytomater', 'Körsbärstomater'],
      [160, 'g', 'Cucumber (1 medium)', 'Agurk (1 middels)', 'Gurka (1 medium)'],
      [90, 'g', 'Ripe avocado (¾ medium)', 'Moden avokado (¾ middels)', 'Mogen avokado (¾ medium)'],
      [10, 'g', 'Walnuts, roughly broken', 'Valnøtter, grovt knust', 'Valnötter, grovt krossade'],
      [5, 'g', 'Sesame seeds', 'Sesamfrø', 'Sesamfrön'],
      [5, 'ml', 'Tamari (wheat-free soy sauce)', 'Tamari (hvetefri soyasaus)', 'Tamari (veteri soja)'],
      [15, 'ml', 'Lime juice (about ½ lime)', 'Limesaft (ca. ½ lime)', 'Limejuice (ca ½ lime)'],
      [null, '', 'Sea salt, to taste', 'Havsalt, etter smak', 'Havssalt, efter smak'],
    ],
    steps: [
      ['Steam the broccoli over boiling water for 3–4 minutes until just tender and still bright green, then transfer to a wide bowl.', 'Damp brokkolien over kokende vann i 3–4 minutter til den så vidt er mør og fortsatt knallgrønn, og ha den over i en vid bolle.', 'Ånga broccolin över kokande vatten i 3–4 minuter tills precis mjuk och fortfarande klargrön, och lägg över i en vid skål.'],
      ['Steam the spinach for 60 seconds until wilted, squeeze gently and add to the bowl.', 'Damp spinaten i 60 sekunder til den faller sammen, klem den forsiktig og ha den i bollen.', 'Ånga spenaten i 60 sekunder tills den sjunker ihop, krama försiktigt och tillsätt i skålen.'],
      ['Slice the cucumber thickly, halve the cherry tomatoes and add to the bowl. Slice the avocado generously and fan over the top.', 'Skjær agurken i tykke skiver, del cherrytomatene i to og ha i bollen. Skjær avokadoen rikelig og vift den ut på toppen.', 'Skär gurkan i tjocka skivor, halvera körsbärstomaterna och tillsätt i skålen. Skiva avokadon generöst och lägg upp i en solfjäder över.'],
      ['Mix the tamari and lime juice and drizzle over the whole bowl, then scatter the sesame seeds and walnuts and season with salt if needed. Serve immediately.', 'Bland tamari og limesaft og skvett over hele bollen, dryss så over sesamfrø og valnøtter og smak til med salt om nødvendig. Server med en gang.', 'Blanda tamari och limejuice och ringla över hela skålen, strö sedan över sesamfrön och valnötter och smaka av med salt vid behov. Servera genast.'],
    ],
  },
]

function tagsFor(cat) {
  const base = ['fmd', 'plant-based', 'oil-free', 'caffeine-free']
  const byCat = {
    Breakfast: ['breakfast'], Soup: ['soup'], Salad: ['salad'], Main: ['main', 'dinner'],
  }
  return [...base, ...(byCat[cat] || [])]
}

// Spices and small spoon-measured items are easier to measure by volume
// than weight, so we present those in tsp/tbsp instead of grams. Bulk
// ingredients (avocado, vegetables, beans, oats, fruit, etc.) stay in
// grams/ml. Returns [quantity, unit]; pumpkin seeds and chia carry two
// portion sizes across the plan, so they key off the original gram weight.
function displayUnit(name, qty, unit) {
  const n = name.toLowerCase()
  if (/flaxseed/.test(n)) return [1, 'tbsp']
  if (/cinnamon/.test(n)) return [0.25, 'tsp']
  if (/cardamom/.test(n)) return [0.25, 'tsp']
  if (/cumin/.test(n)) return [0.5, 'tsp']
  if (/coriander/.test(n)) return [0.5, 'tsp']
  if (/smoked paprika/.test(n)) return [0.25, 'tsp']
  if (/turmeric/.test(n)) return [0.25, 'tsp']
  if (/sesame seeds/.test(n)) return [1, 'tsp']
  if (/almond butter/.test(n)) return [1, 'tsp']
  if (/pumpkin seeds/.test(n)) return qty >= 10 ? [1, 'tbsp'] : [1, 'tsp']
  if (/chia/.test(n)) return qty >= 30 ? [3, 'tbsp'] : [1, 'tsp']
  return [qty, unit]
}

function buildRecipe(r) {
  // Resolve the display quantity/unit for each ingredient once (from the
  // English name + original grams) so the base recipe and every
  // translation stay perfectly aligned on amounts.
  const amounts = r.ings.map(([qty, unit, en]) => displayUnit(en, qty, unit))
  const baseIngredients = r.ings.map(([, , en], i) => ({ quantity: amounts[i][0], unit: amounts[i][1], name: en }))
  const baseSteps = r.steps.map(s => s[0])
  const mk = (idx) => ({
    title: r[idx === 1 ? 'no' : 'sv'].title,
    description: r[idx === 1 ? 'no' : 'sv'].description,
    ingredients: r.ings.map(([, , , no, sv], i) => ({ quantity: amounts[i][0], unit: amounts[i][1], name: idx === 1 ? no : sv })),
    steps: r.steps.map(s => s[idx]),
  })

  // Full per-serving panel when we have it (the 15 meals); the broth falls
  // back to its lightweight macros with cholesterol/added-sugar = 0.
  const panel = NUTR[r.id]
  const perServing = panel
    ? { ...panel.perServing }
    : {
        calories: r.kcal,
        protein: r.macros.protein,
        totalFat: r.macros.totalFat,
        totalCarbs: r.macros.totalCarbs,
        totalSugars: r.macros.totalSugars,
        addedSugar: 0,
        fiber: r.macros.fiber,
        cholesterol: 0,
      }
  const kcal = Math.round(perServing.calories)
  const servingWeightGrams = panel ? panel.servingWeightGrams : r.weight

  return {
    id: r.id,
    title: r.en.title,
    category: r.category,
    servings: r.servings,
    prepTime: r.prepTime || null,
    // No-cook recipes use null (not 0) so the detail view omits the cook
    // chip instead of showing a bare "0".
    cookTime: r.cookTime || null,
    imageUrl: null,
    description: r.en.description,
    tags: tagsFor(r.category),
    kcal,
    servingWeightGrams,
    nutrition: { perServing },
    translations: { no: mk(1), sv: mk(2) },
    ingredients: baseIngredients,
    steps: baseSteps,
  }
}

const out = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-fmd-5day.json')

// Preserve any images already added to the existing JSON. The user adds
// base64 photos to each recipe by hand after generation; re-running this
// script must NOT wipe them. We map id -> imageUrl from the current file
// and reuse it for any recipe that already has one.
let existingImages = {}
try {
  const prev = JSON.parse(fs.readFileSync(out, 'utf8'))
  for (const r of prev.recipes || []) if (r.imageUrl) existingImages[r.id] = r.imageUrl
} catch { /* first run — no existing file */ }

const recipes = RECIPES.map(buildRecipe).map(r => ({ ...r, imageUrl: existingImages[r.id] || r.imageUrl }))
const pack = { ...PACK, recipes }
fs.writeFileSync(out, JSON.stringify(pack, null, 2) + '\n', 'utf8')
const withImg = recipes.filter(r => r.imageUrl).length
console.log('Wrote', out, 'with', recipes.length, 'recipes (' + withImg + ' have images preserved)')

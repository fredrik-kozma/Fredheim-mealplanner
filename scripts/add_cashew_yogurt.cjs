/* Adds orn-60, Cashew Yogurt — EN + NO + SV, author-supplied nutrition.
 *
 * Steps are de-quantified per house style. Two source-draft fixes, the
 * same class of problem corrected in the pea soup:
 *   - "stir 7 g of 28 grams ... into each portion" only holds at exactly
 *     4 servings; now "divide between the portions".
 *   - "Set aside 45 g for your next batch" restates the starter weight;
 *     now "set aside the same amount again", which stays right at any
 *     batch size.
 *
 * Deliberately NOT tagged `oil-free`, and no `ornish-green`. The source
 * scores this RED on total fat (25.2 g against the 8 g ceiling — that's
 * the cashews, and it doesn't move), and flags that most commercial oat
 * yogurts carry rapeseed oil, which marks the added-oil row orange for
 * batch one. Condition tags are left to audit_condition_tags.cjs.
 *
 * The starter is the one ingredient that must NOT scale proportionally —
 * it's an inoculum, not an ingredient: the final culture density is set
 * by time and temperature, not by how much you seed. The app's servings
 * slider scales everything linearly, so the ingredient name carries a
 * pointer and the note carries the author's per-batch table. This is the
 * content-level guard; a proper per-ingredient scaling rule would be an
 * app change.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.some(r => r.id === 'orn-60')) throw new Error('orn-60 already exists')

const recipe = {
  id: 'orn-60',
  title: 'Cashew Yogurt',
  category: 'Breakfast',
  servings: 4,
  prepTime: 45,
  cookTime: 960,
  imageUrl: null,
  description: 'Thick, silky, properly tangy cultured cashew yogurt, started with a spoonful of any live plant-based yogurt. Instant Pot incubation, blender for the texture.',
  tags: ['breakfast', 'vegan', 'no-added-sugar', 'fermented'],
  kcal: 329,
  servingWeightGrams: 208,
  ingredients: [
    { quantity: 200, unit: 'g', name: 'raw cashews (unsalted, unroasted)' },
    { quantity: 480, unit: 'ml', name: 'filtered water, lukewarm' },
    { quantity: 12, unit: 'g', name: 'Medjool date, pitted' },
    { quantity: 45, unit: 'g', name: 'live plant-based yogurt, unsweetened — starter (does not scale proportionally, see notes)' },
    { quantity: 0.3, unit: 'tsp', name: 'fine sea salt' },
    { quantity: 28, unit: 'g', name: 'ground flaxseed, stirred in at serving' },
  ],
  steps: [
    'Warm the starter: Take the live yogurt out of the fridge now and let it come to room temperature while you work. A cold starter stalls the first hours of the ferment.',
    'Soften the cashews: Put the cashews in a bowl and cover with boiling water. Leave 30 minutes, then drain and discard the soaking water. A cold 6-hour soak works identically if you plan ahead.',
    'Sterilise the pot: While the cashews soak, swirl boiling water around the Instant Pot inner pot and the lid seal, tip it out, and dry with a clean cloth. Wild bacteria are the only real failure mode in this recipe — do not skip this.',
    'Blend until silky: Blend the drained cashews with the lukewarm water and the date, starting low and ramping to full speed. Run 60–90 seconds, until there is no trace of grain when you rub it between your fingers. Stop and check the temperature: it must be under 43 °C before the starter goes in. If friction has pushed it higher, let it stand until it drops.',
    'Stir in the starter: Whisk the live yogurt into the blended base by hand until fully dispersed — do not re-blend, the blades will heat it again and kill the culture. Pour into the sterilised inner pot.',
    'Incubate: Lid on, Yogurt function, Normal (43 °C), 10 hours. A spoonful of yogurt carries far fewer live cells than a capsule, so give it longer than you would with probiotics. Taste at 10 hours: you want a clean lactic tang, not a sharp one. Push to 12–14 if it is still flat.',
    'Chill — this is where it sets: Transfer to a jar and refrigerate at least 6 hours, ideally overnight. It thickens dramatically as it cools; judging the texture warm will mislead you every time.',
    'Season and serve: Whisk the salt into the cold yogurt — salt after fermentation, never before, or it slows the culture. Set aside the same amount again as starter for your next batch, then divide the ground flaxseed between the portions, stirring it in as you serve.',
  ],
  notes: "Scaling the starter — the one thing not to double. The starter is an inoculum, not an ingredient: its job is to seed the batch with enough live cells to outcompete anything wild in the first few hours, after which the population grows on its own. Final culture density is set by time and temperature, not by how much you seeded, so a double batch does not need double the seed. Use roughly 45 g at a single batch, 60–70 g at double, 80–90 g at triple. Everything else — cashews, water, date, salt, flax — scales straight 1:1, including the date, because that one is substrate rather than seed: it is food for the culture, proportional to how much base there is to ferment. Two boundaries: past about 10% of batch weight the acid curve steepens and the set turns thinner and slightly grainy, and below about 30 g the inoculum is hard to disperse evenly and gives wild bacteria a window. Note that the servings slider scales the starter proportionally along with everything else — override it to the figures above. The extra hour or two on a larger batch is thermal, not cultural: a deeper mass takes longer to reach 43 °C throughout, so stir once at the halfway mark on a triple batch with a scalded spoon.\n\nChoosing the starter: the tub must say live or active cultures. Heat-treated yogurts (shelf-stable, or labelled pasteurised after culturing) contain nothing alive and will not ferment. Unsweetened is essential. Soy yogurt is the strongest starter of the three, oat works well, coconut is the weakest and may need the full 12 hours.\n\nSelf-sustaining from here: save a starter's worth of your own finished yogurt for the next batch. From generation 2 onward there is no commercial yogurt in the recipe at all, the culture adapts to the cashew substrate, and batches 2 and 3 are noticeably better than the first. This also retires the one caveat in the scorecard — most commercial oat yogurts contain rapeseed oil, which at 45 g in an 835 g batch is 0.34 g per serving, trace territory rather than a real breach, but enough to mark the added-oil row. Seeded with your own, that row is clean permanently.\n\nWhy the date: cashews are low in free sugars and the cultures need something to eat. 12 g feeds the ferment without leaving detectable sweetness — most of it is consumed, so measured sugars will read below the figure listed here.\n\nTroubleshooting: grainy means under-blended, not under-fermented. Thin means you judged it warm; chill fully first. No tang after 12 hours means a dead starter — try a different tub, or use probiotic capsules (2 × 20–50 billion CFU) instead.\n\nVariations: whisk in vanilla powder and mashed berries after chilling, or thin with water to a drinkable kefir texture. For a labneh-style spread, strain through cheesecloth for 4 hours.\n\nYield is about 835 g, four servings of roughly 208 g. Total fat is the binding constraint at 25.2 g per serving — that is the cashews, and it does not move, so this scores RED on the Ornish scale despite everything else being clean.",
  nutrition: { perServing: {
    calories: 329, protein: 10.6, totalFat: 25.2, saturatedFat: 4.2, polyunsaturatedFat: 6.0,
    monounsaturatedFat: 12.6, omega3: 1.64, omega6: 4.37, cholesterol: 0, totalCarbs: 20.0,
    totalSugars: 5.2, addedSugar: 0, fiber: 3.9, calcium: 52, potassium: 411, copper: 1.19,
    iron: 3.8, magnesium: 176, manganese: 1.01, selenium: 11.7, phosphorus: 348, zinc: 3.2,
    sodium: 158, vitaminA: 0, vitaminB6: 0.25, vitaminB12: 0.04, vitaminC: 0.3, vitaminD: 0.09,
    vitaminE: 0.47, vitaminK: 17.4, folate: 19, thiamin: 0.33, riboflavin: 0.07, niacin: 0.79, choline: 36,
  } },
  translations: {
    no: {
      title: 'Cashewyoghurt',
      description: 'Tykk, silkemyk og skikkelig syrlig kulturell cashewyoghurt, startet med en skje levende plantebasert yoghurt. Inkubering i trykkoker, blender for teksturen.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'rå cashewnøtter (usaltede, uristede)' },
        { quantity: 480, unit: 'ml', name: 'filtrert vann, lunkent' },
        { quantity: 12, unit: 'g', name: 'Medjool-daddel, uten stein' },
        { quantity: 45, unit: 'g', name: 'levende plantebasert yoghurt, usøtet — starter (skaleres ikke proporsjonalt, se tips)' },
        { quantity: 0.3, unit: 'tsp', name: 'fint havsalt' },
        { quantity: 28, unit: 'g', name: 'malt linfrø, røres inn ved servering' },
      ],
      steps: [
        'Temperer starteren: Ta den levende yoghurten ut av kjøleskapet nå og la den bli romtemperert mens du jobber. En kald starter bremser de første timene av fermenteringen.',
        'Bløtlegg cashewnøttene: Ha cashewnøttene i en bolle og dekk med kokende vann. La dem stå i 30 minutter, hell så av og kast bløtevannet. En kald bløtlegging på 6 timer fungerer helt likt om du planlegger i forveien.',
        'Steriliser gryta: Mens nøttene bløtlegges, skyll innergryta og lokkpakningen til trykkokeren med kokende vann, hell det ut, og tørk med en ren klut. Ville bakterier er den eneste virkelige feilkilden i denne oppskriften — ikke hopp over dette.',
        'Kjør silkemykt: Blend de avrente cashewnøttene med det lunkne vannet og daddelen, start lavt og øk til full hastighet. Kjør i 60–90 sekunder, til det ikke er spor av gryn når du gnir det mellom fingrene. Stopp og sjekk temperaturen: den må være under 43 °C før starteren skal i. Har friksjonen presset den høyere, la den stå til den faller.',
        'Rør inn starteren: Visp den levende yoghurten inn i den blendede basen for hånd til den er helt fordelt — ikke blend på nytt, bladene varmer den opp igjen og dreper kulturen. Hell over i den steriliserte innergryta.',
        'Inkuber: Lokk på, yoghurtfunksjon, Normal (43 °C), 10 timer. En skje yoghurt bærer langt færre levende celler enn en kapsel, så gi den lengre tid enn du ville gjort med probiotika. Smak etter 10 timer: du vil ha en ren melkesyrlighet, ikke en skarp en. Kjør videre til 12–14 timer om den fortsatt smaker flatt.',
        'Avkjøl — det er her den setter seg: Ha den over i et glass og sett kaldt i minst 6 timer, helst over natten. Den tykner dramatisk mens den kjøles ned; å bedømme teksturen mens den er varm vil lure deg hver gang.',
        'Smak til og server: Visp saltet inn i den kalde yoghurten — salt etter fermenteringen, aldri før, ellers bremser det kulturen. Sett av like mye igjen som starter til neste omgang, og fordel så det malte linfrøet mellom porsjonene og rør det inn etter hvert som du serverer.',
      ],
      notes: 'Skalering av starteren — det ene du ikke skal doble. Starteren er et podestoff, ikke en ingrediens: jobben dens er å så batchen med nok levende celler til å utkonkurrere alt vilt de første timene, og deretter vokser populasjonen av seg selv. Endelig kulturtetthet bestemmes av tid og temperatur, ikke av hvor mye du podet med, så en dobbel batch trenger ikke dobbelt så mye starter. Bruk cirka 45 g ved enkel batch, 60–70 g ved dobbel, 80–90 g ved trippel. Alt annet — cashewnøtter, vann, daddel, salt, linfrø — skaleres rett 1:1, også daddelen, for den er substrat og ikke pode: den er mat for kulturen, proporsjonal med hvor mye base det er å fermentere. To grenser: over cirka 10 % av batchvekten blir syrekurven brattere og resultatet tynnere og litt grynete, og under cirka 30 g er podestoffet vanskelig å fordele jevnt og gir ville bakterier et vindu. Merk at porsjonsvelgeren skalerer starteren proporsjonalt sammen med alt annet — overstyr den til tallene over. Den ekstra timen eller to på en større batch handler om varme, ikke kultur: en dypere masse bruker lengre tid på å nå 43 °C hele veien gjennom, så rør én gang halvveis på en trippel batch med en skåldet skje.\n\nValg av starter: boksen må si levende eller aktive kulturer. Varmebehandlet yoghurt (holdbar utenfor kjøl, eller merket pasteurisert etter kultivering) inneholder ingenting levende og vil rett og slett ikke fermentere. Usøtet er avgjørende. Soyayoghurt er den sterkeste starteren av de tre, havre fungerer godt, kokos er den svakeste og kan trenge hele 12 timer.\n\nSelvforsynt herfra: sett av en starterporsjon av din egen ferdige yoghurt til neste omgang. Fra generasjon 2 og utover er det ingen kommersiell yoghurt i oppskriften i det hele tatt, kulturen tilpasser seg cashewsubstratet, og batch 2 og 3 er merkbart bedre enn den første. Dette rydder også opp i det ene forbeholdet i scorekortet — de fleste kommersielle havreyoghurter inneholder rapsolje, som ved 45 g i en batch på 835 g blir 0,34 g per porsjon, sporemengde snarere enn et reelt brudd, men nok til å markere olje-raden. Podet med din egen er den raden ren permanent.\n\nHvorfor daddelen: cashewnøtter har lite frie sukkerarter, og kulturene trenger noe å spise. 12 g mater fermenteringen uten å etterlate merkbar sødme — det meste blir spist opp, så målt sukker vil ligge under tallet som er oppgitt her.\n\nFeilsøking: grynete betyr underblendet, ikke underfermentert. Tynn betyr at du bedømte den varm; kjøl den helt ned først. Ingen syrlighet etter 12 timer betyr død starter — prøv en annen boks, eller bruk probiotikakapsler (2 × 20–50 milliarder CFU) i stedet.\n\nVariasjoner: visp inn vaniljepulver og mosede bær etter nedkjøling, eller spe med vann til drikkbar kefirkonsistens. For en labneh-aktig bredbar variant, sil gjennom osteklut i 4 timer.\n\nUtbyttet er cirka 835 g, fire porsjoner på rundt 208 g. Totalt fett er den bindende begrensningen med 25,2 g per porsjon — det er cashewnøttene, og det lar seg ikke flytte, så denne scorer RED på Ornish-skalaen selv om alt annet er rent.',
    },
    sv: {
      title: 'Cashewyoghurt',
      description: 'Tjock, silkeslen och ordentligt syrlig kultiverad cashewyoghurt, startad med en sked levande växtbaserad yoghurt. Inkubering i tryckkokare, mixer för konsistensen.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'råa cashewnötter (osaltade, orostade)' },
        { quantity: 480, unit: 'ml', name: 'filtrerat vatten, ljummet' },
        { quantity: 12, unit: 'g', name: 'Medjooldadel, urkärnad' },
        { quantity: 45, unit: 'g', name: 'levande växtbaserad yoghurt, osötad — starter (skalas inte proportionellt, se tips)' },
        { quantity: 0.3, unit: 'tsp', name: 'fint havssalt' },
        { quantity: 28, unit: 'g', name: 'malda linfrön, rörs i vid servering' },
      ],
      steps: [
        'Tempererа startern: Ta ut den levande yoghurten ur kylen nu och låt den bli rumstempererad medan du arbetar. En kall starter bromsar fermenteringens första timmar.',
        'Blötlägg cashewnötterna: Lägg cashewnötterna i en skål och täck med kokande vatten. Låt stå i 30 minuter, häll sedan av och släng blötvattnet. En kall blötläggning på 6 timmar fungerar precis likadant om du planerar i förväg.',
        'Sterilisera grytan: Medan nötterna blötläggs, skölj tryckkokarens innergryta och lockpackning med kokande vatten, häll ut det, och torka med en ren duk. Vilda bakterier är den enda verkliga felkällan i det här receptet — hoppa inte över detta.',
        'Mixa silkeslent: Mixa de avrunna cashewnötterna med det ljumna vattnet och dadeln, börja långsamt och öka till full hastighet. Kör i 60–90 sekunder, tills det inte finns spår av gryn när du gnuggar det mellan fingrarna. Stanna och kontrollera temperaturen: den måste vara under 43 °C innan startern ska i. Har friktionen pressat upp den, låt den stå tills den sjunker.',
        'Rör i startern: Vispa ner den levande yoghurten i den mixade basen för hand tills den är helt fördelad — mixa inte om, bladen värmer upp den igen och dödar kulturen. Häll över i den steriliserade innergrytan.',
        'Inkubera: Lock på, yoghurtfunktion, Normal (43 °C), 10 timmar. En sked yoghurt bär långt färre levande celler än en kapsel, så ge den längre tid än du skulle med probiotika. Smaka efter 10 timmar: du vill ha en ren mjölksyrlighet, inte en skarp. Kör vidare till 12–14 timmar om den fortfarande smakar platt.',
        'Kyl — det är här den sätter sig: Häll över i en burk och ställ kallt i minst 6 timmar, helst över natten. Den tjocknar dramatiskt när den kyls ner; att bedöma konsistensen medan den är varm lurar dig varje gång.',
        'Smaka av och servera: Vispa ner saltet i den kalla yoghurten — salta efter fermenteringen, aldrig före, annars bromsar det kulturen. Sätt undan lika mycket igen som starter till nästa sats, och fördela sedan de malda linfröna mellan portionerna och rör ner dem allteftersom du serverar.',
      ],
      notes: 'Skalning av startern — det enda du inte ska dubbla. Startern är ett ympmaterial, inte en ingrediens: dess uppgift är att så satsen med tillräckligt många levande celler för att konkurrera ut allt vilt de första timmarna, och därefter växer populationen av sig själv. Slutlig kulturtäthet bestäms av tid och temperatur, inte av hur mycket du ympade med, så en dubbel sats behöver inte dubbelt så mycket starter. Använd cirka 45 g vid enkel sats, 60–70 g vid dubbel, 80–90 g vid trippel. Allt annat — cashewnötter, vatten, dadel, salt, linfrö — skalas rakt 1:1, även dadeln, för den är substrat och inte ymp: den är mat åt kulturen, proportionell mot hur mycket bas det finns att fermentera. Två gränser: över cirka 10 % av satsvikten blir syrakurvan brantare och resultatet tunnare och något grynigt, och under cirka 30 g är ympmaterialet svårt att fördela jämnt och ger vilda bakterier ett fönster. Observera att portionsväljaren skalar startern proportionellt tillsammans med allt annat — åsidosätt den till siffrorna ovan. Den extra timmen eller två på en större sats handlar om värme, inte kultur: en djupare massa tar längre tid på sig att nå 43 °C hela vägen igenom, så rör om en gång halvvägs på en trippelsats med en skållad sked.\n\nVal av starter: burken måste ange levande eller aktiva kulturer. Värmebehandlad yoghurt (hållbar utanför kyl, eller märkt pastöriserad efter kultivering) innehåller ingenting levande och kommer helt enkelt inte att fermentera. Osötad är avgörande. Sojayoghurt är den starkaste startern av de tre, havre fungerar bra, kokos är den svagaste och kan behöva hela 12 timmar.\n\nSjälvförsörjande härifrån: sätt undan en starterportion av din egen färdiga yoghurt till nästa sats. Från generation 2 och framåt finns ingen kommersiell yoghurt i receptet alls, kulturen anpassar sig till cashewsubstratet, och sats 2 och 3 är märkbart bättre än den första. Detta rensar också upp det enda förbehållet i poängkortet — de flesta kommersiella havreyoghurter innehåller rapsolja, vilket vid 45 g i en sats på 835 g blir 0,34 g per portion, spårmängd snarare än ett verkligt brott, men nog för att markera oljeraden. Ympad med din egen är den raden ren permanent.\n\nVarför dadeln: cashewnötter har lite fria sockerarter, och kulturerna behöver något att äta. 12 g matar fermenteringen utan att lämna märkbar sötma — det mesta äts upp, så uppmätt socker kommer att ligga under siffran som anges här.\n\nFelsökning: grynigt betyder undermixat, inte underfermenterat. Tunn betyder att du bedömde den varm; kyl den helt först. Ingen syrlighet efter 12 timmar betyder död starter — prova en annan burk, eller använd probiotikakapslar (2 × 20–50 miljarder CFU) i stället.\n\nVariationer: vispa i vaniljpulver och mosade bär efter kylning, eller späd med vatten till drickbar kefirkonsistens. För en labnehliknande bredbar variant, sila genom ostduk i 4 timmar.\n\nUtbytet är cirka 835 g, fyra portioner på runt 208 g. Totalt fett är den bindande begränsningen med 25,2 g per portion — det är cashewnötterna, och det går inte att flytta, så den här får RED på Ornish-skalan trots att allt annat är rent.',
    },
  },
}

pack.recipes.push(recipe)

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${recipe.id} (${recipe.servings} servings, ${recipe.servingWeightGrams} g). Pack -> ${pack.version}. Total: ${pack.recipes.length}`)

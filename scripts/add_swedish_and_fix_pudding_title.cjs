/* Two fixes to the 12 recipes added in the previous commit:
 *
 *  1. The Norwegian title for orn-33/orn-34 said "chiapudding" when the
 *     recipe is a PSYLLIUM pudding — the description underneath already
 *     said "psylliumhusk" correctly, so only the title was wrong. Chia
 *     and psyllium are different ingredients with different behaviour
 *     (and orn-36 is a genuine chia pudding), so this was actively
 *     misleading.
 *
 *  2. Added the missing Swedish translations. The reversal pack was 100%
 *     Swedish before this batch landed; adding 12 EN+NO-only recipes
 *     broke that, so this restores it.
 *
 * Swedish ingredient lists are built by copying each English row and
 * swapping only the name — quantity and unit are never retyped, so the
 * three language arrays cannot drift out of alignment by construction.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

// ── 1. Norwegian title fix ───────────────────────────────────────────────
const TITLE_FIX = {
  'orn-33': 'Vanilje-carob-psylliumpudding (vannbasert) med blåbær',
  'orn-34': 'Vanilje-carob-psylliumpudding med blåbær',
}
const titleFixes = []
for (const [id, noTitle] of Object.entries(TITLE_FIX)) {
  const r = pack.recipes.find(x => x.id === id)
  if (!r) throw new Error(`missing ${id}`)
  titleFixes.push(`${id}: "${r.translations.no.title}" -> "${noTitle}"`)
  r.translations.no.title = noTitle
}

// ── 2. Swedish translations ──────────────────────────────────────────────
// { title, description, notes, names: [...same length as EN...], steps: [...] }
const SV = {}

const ciorbaNames = unsoaked => [
  `torkade borlottibönor (cranberrybönor)${unsoaked ? ', oblötlagda' : ''}`,
  'lök, tärnad',
  'morot, tärnad',
  'stjälkselleri, tärnad',
  'vitlök, finhackad',
  'tomatpuré, utan tillsatt salt',
  'rökt paprikapulver',
  'Lagerblad, torkade (2–3 blad)',
  'grönsaksbuljong med låg natriumhalt',
  'vatten',
  'färsk citronsaft, till soppan',
  'färsk persilja, hackad',
  'Fint havssalt, till de syltade löken, efter smak',
  'malda linfrön (tillsätts utanför värmen, per portion)',
  'rödlök, tunt skivad',
  'färsk citronsaft, till syltningen',
]

SV['orn-30'] = {
  title: 'Ciorbă de Fasole med citronsyltad rödlök — på spisen',
  description: 'En rik, sammetslen rumänsk bönsoppa byggd på borlottibönor, lagerblad och rökt paprika som ersättning för det traditionella rökta köttet — toppad med syrlig, citronsyltad rödlök för krispighet och friskhet.',
  notes: 'En lång, försiktig sjudning är det som ger ciorbă de fasole sin klassiska sammetslena buljong — stressa inte. Den syltade löken gör mycket av smakarbetet här, så smaka av innan du sträcker dig efter mer salt. Passar utmärkt för storkok och fryser fint (tillsätt linfrön och syltad lök färska vid servering, inte före infrysning).',
  names: ciorbaNames(false),
  steps: [
    'Skölj de torkade borlottibönorna och blötlägg i rikligt med kallt vatten i minst 8 timmar, eller över natten. Häll av och skölj väl före kokning.',
    'Skiva rödlöken tunt och blanda i en liten skål med citronsaften och saltet. Låt stå i rumstemperatur, rör om då och då, tills den är klarrosa och något mjukare. Ställ kallt tills det är dags att servera.',
    'Fräs lök, morot och selleri i en stor gryta med några matskedar vatten över medelvärme, rör ofta, tills allt är mjukt och lätt gyllene.',
    'Tillsätt vitlök, tomatpuré, rökt paprika och lagerblad. Rör i 1 minut tills det doftar.',
    'Tillsätt de blötlagda, avrunna bönorna, buljongen och vattnet. Koka upp, sänk sedan till försiktig sjudning med locket på glänt, tills bönorna är krämiga och mjuka. Rör om då och då och fyll på med en skvätt vatten om det blir för tjockt.',
    'Ta bort lagerbladen. Rör i citronsaften och persiljan. Smaka av och justera kryddningen vid behov.',
    'Ös upp i skålar, strö de malda linfröna över varje portion utanför värmen, och avsluta med en sked av den avrunna syltade löken på toppen.',
  ],
}

SV['orn-31'] = {
  title: 'Ciorbă de Fasole med citronsyltad rödlök — Instant Pot, utan blötläggning',
  description: 'Samma soppa, utan behov av blötläggning, toppad med citronsyltad rödlök.',
  notes: 'Oblötlagda bönor behöver den extra vätskan och längre tid för att bli helt hydrerade — korta inte ner trycktiden. Den syltade löken bär mycket av smaken här, så smaka av innan du tillsätter mer salt.',
  names: ciorbaNames(true),
  steps: [
    'Skölj de torkade borlottibönorna väl — ingen blötläggning behövs.',
    'Skiva rödlöken tunt och blanda i en liten skål med citronsaften och saltet. Låt stå i rumstemperatur, rör om då och då, tills den är klarrosa och något mjukare. Ställ kallt tills det är dags att servera — det finns gott om tid medan bönorna tryckkokas.',
    'Ställ in Instant Pot på Sauté. Fräs lök, morot och selleri med några matskedar vatten, rör ofta, tills allt är mjukt.',
    'Tillsätt vitlök, tomatpuré, rökt paprika och lagerblad. Rör i 1 minut tills det doftar. Tryck Cancel för att avsluta Sauté-läget.',
    'Tillsätt de sköljda bönorna, buljongen och vattnet. Stäng locket, ställ in på Pressure Cook på High i 40 minuter, och låt sedan trycket sjunka naturligt i minst 20 minuter innan du öppnar. Kontrollera en böna — den ska vara helt krämig utan kritig kärna.',
    'Ta bort lagerbladen. Rör i citronsaften och persiljan. Smaka av och justera kryddningen vid behov.',
    'Ös upp i skålar, strö de malda linfröna över varje portion utanför värmen, och avsluta med en sked av den avrunna syltade löken på toppen.',
  ],
}

SV['orn-32'] = {
  title: 'Kalciumboost-sallad',
  description: 'Masserad grönkål med en krämig tahini-vitbönsdressing, toppad med chia och torkad fikon — byggd för att maximera kalcium och samtidigt hålla sig Ornish GREEN.',
  notes: 'Låt den dressade salladen stå 10–15 min före servering — grönkålen mjuknar ytterligare och fikonsötman fördelar sig jämnt. Ersättning: byt tahini mot solrosfrösmör om du inte har sesam hemma (kalciumhalten sjunker något, fettprofilen är liknande).',
  names: [
    'grönkål, stjälkarna borttagna och finhackad',
    'vita bönor (cannellini), kokta',
    'tahini',
    'färsk citronsaft',
    'vitlök',
    'rökt paprikapulver',
    'torkade fikon, hackade',
    'chiafrön',
    'fint salt',
  ],
  steps: [
    'Massera grönkålen med en skvätt av citronsaften i en stor skål, med händerna, tills den mjuknar och blir mörkare grön — cirka 2 minuter.',
    'Mixa de vita bönorna, tahini, resten av citronsaften, vitlök, rökt paprika och salt med några matskedar vatten i en mixer. Kör tills det är slätt och krämigt, justera med vatten till önskad konsistens.',
    'Häll dressingen över den masserade grönkålen och vänd tills alla blad är täckta.',
    'Strö de torkade fikonen och chiafröna över toppen. Servera direkt, eller ställ kallt en stund så smakerna får sätta sig.',
  ],
}

const psylliumNames = base => [
  base,
  'carobpulver',
  'kokande vatten (för att blöta upp carobpulvret)',
  'Medjooldadlar, urkärnade',
  'vaniljextrakt',
  'malen kanel',
  'Fint havssalt, nypa, efter smak',
  'psylliumfröskal, pulver',
  'malda linfrön (tillsätts per portion, utanför värmen)',
  'färska blåbär (tillsätts per portion, på toppen)',
]

const psylliumSteps = (baseName, blendTime, waterBased) => [
  'Vispa carobpulvret med det kokande vattnet tills du har en slät, blank pasta utan klumpar. Ställ åt sidan några minuter för att svalna något — detta steg tar bort den råa, kritiga smaken och fördjupar aromen.',
  `Blanda ${baseName}, carobpastan, dadlar, vaniljextrakt, kanel och salt i mixern. Kör på hög hastighet tills det är helt slätt och dadlarna har försvunnit helt i vätskan, cirka ${blendTime}${waterBased ? ' — lite längre än vanligt eftersom det inte finns någon havremjölk som hjälper till att emulgera' : ''}.`,
  'Med mixern igång på låg hastighet, strö i psylliumfröskalen och kör bara 5–10 sekunder för att fördela jämnt. Det börjar gela nästan omedelbart, så arbeta snabbt och mixa inte för länge.',
  'Häll omedelbart upp i serveringsglas eller burkar, och fördela jämnt innan det stelnar ytterligare.',
  waterBased
    ? 'Ställ kallt i minst 2 timmar, gärna över natten, tills det har stelnat helt.'
    : 'Ställ kallt i minst 2 timmar, gärna över natten, tills det har stelnat till en tjock, silkeslen pudding.',
  'Precis före servering, vänd ner de malda linfröna i varje portion, och toppa med de färska blåbären.',
]

SV['orn-33'] = {
  title: 'Vanilj-carob-psylliumpudding (vattenbaserad) med blåbär',
  description: 'En lätt, silkeslen pudding byggd på gelade psylliumfröskal i vatten — rik på uppblött carob, Medjooldadlar och varm kanel, avslutad med färska blåbär. Utan olja, utan tillsatt socker. Magrare och mindre krämig än havremjölksversionen.',
  notes: 'Utan havremjölkens fett och protein stelnar puddingen lite tunnare — mixa dadlarna extra noga så att de emulgerar helt och ger lite mer kropp. Hastighet spelar fortfarande roll i psylliumsteget: strö i det medan mixern går, så att det inte klumpar sig. Ersättning: byt vatten mot osötad havremjölk (480 ml) när du vill ha en rikare, krämigare version.',
  names: psylliumNames('vatten'),
  steps: psylliumSteps('vattnet', '60–75 sekunder', true),
}

SV['orn-34'] = {
  title: 'Vanilj-carob-psylliumpudding med blåbär',
  description: 'En silkeslen, skedbar pudding byggd på gelade psylliumfröskal — rik på uppblött carob, Medjooldadlar och varm kanel, avslutad med färska blåbär. Utan olja, utan tillsatt socker.',
  notes: 'Hastighet spelar roll i psylliumsteget — strö i det medan mixern redan går, låt det inte ligga stilla ovanpå vätskan eller det klumpar sig. Låt blåbären vara en färsk topping i stället för att mixa ner dem — det bevarar den rena, mörka carobfärgen och ger en fin texturkontrast mot den släta puddingen. Ersättning: byt carob mot rått kakaopulver (samma mängd) för en djupare, beskare "choklad"-version — fortfarande GREEN.',
  names: psylliumNames('osötad havremjölk'),
  steps: psylliumSteps('havremjölken', '45–60 sekunder', false),
}

SV['orn-35'] = {
  title: 'Gyllene majssoppa (silkeslen-tuggig curryversion)',
  description: 'En gyllene majssoppa med gurkmeja-curry, delvis silkeslen och delvis tuggig, med värme från ingefära och en aning cashewkräm — legendarisk komfortmat med riktig textur.',
  notes: 'Att mixa bara hälften ger det bästa av två världar — en silkeslen, cashewkrämig bas som bär hela, tuggiga majskorn genom varje sked. Passar bra för storkok och fryser fint i upp till 3 månader (tillsätt linfrön och gräslök färska vid uppvärmning). Ersättning: byt cashewnötter mot kokta vita bönor för en magrare version — lite mindre silkeslen, fortfarande krämig. Om ditt currypulver innehåller salt, smaka av innan du tillsätter mer.',
  names: [
    'frysta majskorn',
    'gul lök, tärnad',
    'vitlök, finhackad',
    'färsk ingefära, riven',
    'currypulver',
    'råa cashewnötter, blötlagda i varmt vatten 10 min',
    'grönsaksbuljong med låg natriumhalt',
    'näringsjäst',
    'färsk citronsaft',
    'salt',
    'malda linfrön (tillsätts per portion, utanför värmen)',
    'färsk gräslök eller persilja, hackad, till garnering',
  ],
  steps: [
    'Täck cashewnötterna med nykokt vatten och låt stå medan du förbereder resten.',
    'Fräs lök, vitlök och ingefära i en gryta över medelhög värme med en skvätt av buljongen (2–3 msk), rör ofta, tills allt är mjukt och gyllene.',
    'Rör i currypulvret och rosta i 30 sekunder tills det doftar.',
    'Tillsätt majsen och resten av buljongen. Koka upp, sänk sedan värmen och låt sjuda.',
    'Ös cirka hälften av soppan (vätska, majs och smaksättare) till en mixer tillsammans med de avrunna cashewnötterna. Mixa tills det är helt slätt och blankt gyllene, rör sedan tillbaka det i grytan med den omixade tuggiga hälften.',
    'Rör i näringsjästen och saltet. Smaka av och justera.',
    'Ta av värmen och rör i citronsaften — det håller citrusen fräsch i stället för att dämpas av kokningen.',
    'Ös upp i skålar. Toppa varje portion med de malda linfröna (tillsatta färska per portion, aldrig nedkokta) och lite gräslök eller persilja.',
  ],
}

SV['orn-36'] = {
  title: 'Tahini-mandel-chiapudding med bär',
  description: 'En krämig, naturligt söt chiapudding byggd på hemmagjord, osilad mandelmjölk, virvlad med tahini och toppad med frysta blåbär — en genuint kalciumrik frukost.',
  notes: 'Den osilade mandelmjölken är det som lyfter kalcium och fiber — sila inte bort fruktköttet. Låt blåbären stå i rumstemperatur några minuter före servering så att de mjuknar lite mot den kalla puddingen. Ersättning: byt dadlar mot en mycket mogen banan om du vill ha en mildare sötma, eller använd frysta blandade bär i stället för blåbär för variation.',
  names: [
    'råa mandlar',
    'vatten',
    'chiafrön',
    'tahini',
    'Medjooldadlar, urkärnade',
    'malen kanel',
    'frysta blåbär',
  ],
  steps: [
    'Mixa mandlarna och vattnet på hög hastighet tills det är helt slätt — detta är din färska, osilade mandelmjölk. Genom att inte sila bevarar du all fiber, kalcium och fett, så inget går till spillo.',
    'Tillsätt dadlarna och kanelen i mixern. Mixa igen tills det är helt slätt och sött.',
    'Tillsätt tahini och mixa kort, bara tills det är inblandat.',
    'Häll blandningen över chiafröna i en burk eller skål. Vispa väl för att bryta upp klumpar.',
    'Täck över och ställ kallt. Rör om en gång efter 4 timmar för att förhindra klumpning, låt sedan stå och stelna.',
    'Rör om en gång till, fördela i skålar, och toppa varje med de frysta blåbären. Servera direkt medan bären fortfarande är kalla och lite isiga.',
  ],
}

SV['orn-37'] = {
  title: 'Rågsurdegsgrund — så bygger du en från grunden',
  description: 'En steg-för-steg-guide till att etablera din egen rågsurdegsgrund med bara fullkornsrågmjöl och vatten — grunden för receptet på rågsurdegsbröd.',
  notes: 'Du behöver bara fullkornsrågmjöl och vatten — rågsurdegar är de allra enklaste att etablera, eftersom kornet bär med sig gott om naturlig jäst och mjölksyrabakterier på egen hand. Släng inte avfallsdegen: rör ner den i gröt, eller bred ut den tunt på bakplåtspapper med frön och salt och grädda i 160 °C till knäckebröd.',
  names: [
    'fullkornsrågmjöl (per matning)',
    'vatten, ljummet (per matning)',
  ],
  steps: [
    'Dag 1: Blanda fullkornsrågmjöl med ljummet vatten i en burk till en tjock pasta. Täck löst och låt stå i 24 timmar vid 24–28 °C (en avstängd ugn med lampan på fungerar bra).',
    'Dag 2: Det kan finnas några bubblor, eller kanske ingenting än. Släng allt utom ett par matskedar, mata sedan med färskt mjöl och vatten i samma förhållande. Rör om väl.',
    'Dag 3: Ofta den mest förvirrande dagen — mycket aktivitet, sedan blir det tyst och luktar lite ostigt eller obehagligt. Det är normalt: fel bakterier blommar först och konkurreras ut. Släng ner och mata igen som förut.',
    'Dag 4: Lukten ska övergå till att bli rent syrlig, fräsch, nästan fruktig. Släng ner och mata igen.',
    'Dag 5: Den ska nu ungefär fördubblas inom 4–6 timmar efter matning och vara tydligt kupolformad och luftig — det är en mogen surdegsgrund. Om den inte är där än, fortsätt mata dagligen; en långsam grund är vanlig i ett svalt kök och behöver oftast bara en varmare plats.',
    'Underhåll: mata en gång i veckan om den förvaras i kylen (släng ner, mata med färskt mjöl och vatten, låt stå ute i 2 timmar, ställ sedan kallt). Före bak, ta ut den och ge den två matningar i rumstemperatur så att den är helt vaken.',
  ],
}

const ryeSeedNamesSv = [
  'solrosfrön',
  'pumpafrön',
  'hela linfrön',
  'kummin- eller fänkålsfrön, lätt krossade',
]

SV['orn-38'] = {
  title: 'Rågsurdegsbröd',
  description: 'Ett äkta rågsurdegsbröd — kompakt, saftigt, svagt syrligt, med rostade frön. Utan olja, utan sötning, utan jäst, utan knådning. Två dagar från levain till skiva.',
  notes: 'Spara lite av den färdiga levainen innan du blandar degen — det blir din surdegsgrund till nästa gång. Mata den och ställ kallt. Syran i en äkta surdeg är det som gör den här versionen mer pålitlig än jästversionen: den slår effektivt ner rågens amylasenzym, så kladdig inkråm blir mycket svårare att få. För surt? Korta ner levainen till 10 timmar och håll den svalare (20 °C). Inte surt nog? Förläng till 18 timmar och håll den varm. Den enda variabeln är din viktigaste smakratt. Håller sig en hel vecka inslaget i duk och blir genuint bättre dag 2–3.',
  names: [
    'mogen rågsurdegsgrund',
    'fullkornsrågmjöl (till levainen)',
    'vatten, ljummet (till levainen)',
    'fullkornsrågmjöl (till huvuddegen)',
    'vatten, ljummet (till huvuddegen)',
    'fint havssalt',
    ...ryeSeedNamesSv,
  ],
  steps: [
    'Bygg levainen (kvällen före): Vispa ihop surdegsgrunden, rågmjölet och det ljumma vattnet till en jämn, tjock smet. Täck över och låt stå vid 22–24 °C i cirka 14 timmar. På morgonen ska den vara kupolformad, full av bubblor, och lukta skarpt syrligt och fruktigt. Om den redan har toppat och fallit ihop till en platt, alkohollukande smet är den överjäst — fortfarande användbar, men brödet blir kompaktare och surare.',
    'Rosta fröna: Torrosta solrosfrön, pumpafrön och kummin- eller fänkålsfrön över medelvärme, skaka ofta, tills de doftar och är lätt färgade. Svalna på en tallrik. Låt linfröna vara orostade — värme oxiderar deras omega-3.',
    'Blanda degen: Spara en del av levainen i en ren burk som nästa veckas surdegsgrund. Rör ner vatten och salt i resten av levainen tills den är lös, arbeta sedan in rågmjölet tills inget torrt mjöl återstår. Vänd ner de svalnade, rostade fröna och linfröna. Det är en tung, klibbig pasta, aldrig en knådbar deg — tillsätt inte mer mjöl.',
    'Fyll formen: Skrapa ner i en 1 kg brödform klädd med bakplåtspapper. Fukta handen eller en slickepott och jämna till ytan helt, tryck ner i hörnen för att få bort luftfickor. Pudra rikligt med rågmjöl.',
    'Jäs tills den spricker: Täck löst och låt stå vid 26–28 °C. Rågsurdeg jäser långt långsammare än jästbröd — räkna med 3 till 4 timmar. Den är klar när degen har jäst med ungefär en tredjedel och mjölet på ytan har spruckit i fina sprickor över hela ytan. Grädda omedelbart då; råg tål inte överjäsning.',
    'Grädda hett, sedan lågt: Grädda i 250 °C i 70 minuter, sänk sedan till 180 °C utan att öppna luckan och grädda ytterligare 55–65 minuter. Rågsurdeg behöver något längre tid än jästversionen. Klar vid 96–98 °C innertemperatur — kontrollera med termometer, inte efter färg.',
    'Vila i 24 timmar: Stjälp upp, svalna helt på galler, slå sedan in i en ren kökshandduk och vänta ett helt dygn före första skivan. Inkråmet sätter sig fortfarande under den tiden. Att skära för tidigt är det absolut vanligaste sättet att förstöra ett bra rågbröd.',
  ],
}

SV['orn-39'] = {
  title: 'Fullkornsrågbröd',
  description: 'Ett kompakt, saftigt och djupt smakrikt 100 % fullkornsrågbröd med rostade frön — utan olja, utan sötning, utan knådning.',
  notes: 'Surdegsuppgradering: ersätt all jäst med aktiv rågsurdegsgrund (se guiden Rågsurdegsgrund), använd lite mindre vatten, och förläng tiderna för fördeg och slutjäsning. Skarpare smak, bättre hållbarhet, och syran ger dig en verklig säkerhetsmarginal mot kladdighet. Förvaring: slå in i en ren duk, med snittytan nedåt, i rumstemperatur. Det blir bättre i 2–3 dagar och håller sig en vecka. Fryser bra färdigskivat. Varför ingen sirap: nästan alla rågrecept använder det. Fördegen över natten och de rostade fröna ger dig samma mörka, maltiga djup utan något tillsatt socker.',
  names: [
    'fullkornsrågmjöl (till fördegen)',
    'vatten, ljummet (till fördegen)',
    'torrjäst (till fördegen)',
    'fullkornsrågmjöl (till huvuddegen)',
    'vatten, ljummet (till huvuddegen)',
    'torrjäst (till huvuddegen)',
    'fint havssalt',
    ...ryeSeedNamesSv,
  ],
  steps: [
    'Fördeg (kvällen före): Vispa ihop rågmjölet, vattnet och jästen till en tjock, jämn smet. Täck över och låt stå i rumstemperatur över natten. Den ska lukta behagligt syrligt och fräscht på morgonen — den syran gör strukturellt arbete, inte bara smak.',
    'Rosta fröna: Torrosta solrosfrön, pumpafrön och kummin- eller fänkålsfrön i en panna över medelvärme, skaka ofta, tills de doftar och är lätt färgade. Häll upp på en tallrik för att svalna. Rosta inte linfröna — värme skadar deras omega-3.',
    'Blanda degen: Rör ner vatten, jäst och salt i fördegen, arbeta sedan in rågmjölet med en stadig sked eller blöta händer tills inget torrt mjöl återstår. Vänd ner de svalnade, rostade fröna och linfröna. Det blir en klibbig pasta, inte en deg — knåda inte och tillsätt inte mer mjöl för att fixa klibbigheten.',
    'Forma i formen: Skrapa ner i en 1 kg brödform klädd med bakplåtspapper. Jämna till ytan med en blöt slickepott eller blöt hand tills den är jämn — vatten är ditt enda verktyg mot klibbighet. Pudra ytan med lite rågmjöl.',
    'Jäs tills den spricker: Täck löst och låt stå på en varm plats tills degen har jäst med ungefär en tredjedel och fina sprickor syns över den mjölade ytan. Håll utkik efter sprickorna, inte klockan — och låt den inte överjäsa.',
    'Grädda hett, sedan lågt: Grädda i 250 °C i 65 minuter, sänk sedan ugnen till 180 °C utan att öppna luckan och grädda ytterligare 50–60 minuter. Den är klar vid en innertemperatur på 96–98 °C — använd termometer, skorpan säger dig ingenting.',
    'Vila i 24 timmar: Stjälp upp på ett galler och svalna helt, slå sedan in i en ren kökshandduk och låt stå ett helt dygn före du skär i det. Det här är steget alla hoppar över, och anledningen till att de flesta hemmagjorda rågbröd blir kladdiga.',
  ],
}

SV['orn-40'] = {
  title: 'Broccolisallad med rostade valnötter och vitbönsdressing',
  description: 'Broccolisallad med rostade valnötter och en krämig vitbönsdressing, byggd kring en djupt rostad tomatpuré i stället för soltorkade tomater. Utan olja, utan tillsatt socker — Ornish GREEN.',
  notes: 'Den rostade tomatpurén är det som ersätter soltorkade tomater — hoppa inte över den, och stressa inte. Om den fastnar, skvätt i en matsked vatten och skrapa loss. Salt: 1 g är rekommenderad nivå; du har utrymme upp till cirka 2,4 g totalt innan du lämnar GREEN, men det förbrukar större delen av dagens natriumbudget på en enda rätt. Ersättningar: 15 g torkad karljohansvamp (blötlagd, hackad, blötvattnet slängs) i stället för purén om du vill ha tuggiga bitar; använd vita bönor till både dressing och salladskropp för att bara öppna en burk.',
  names: [
    'broccoli, i små buketter',
    'svarta bönor, kokta, avrunna och sköljda (utan tillsatt salt)',
    'tomatpuré, utan tillsatt salt',
    'rödlök, tunt skivad',
    'valnötter',
    'vita bönor (cannellini), kokta, avrunna och sköljda (utan tillsatt salt)',
    'färsk citronsaft',
    'näringsjäst',
    'Medjooldadel, urkärnad',
    'vitlök',
    'rökt paprikapulver',
    'fint havssalt',
    'vatten, till dressingen',
    'malda linfrön, till garnering',
  ],
  steps: [
    'Rosta valnötterna: Värm ugnen till 170 °C. Sprid ut valnötterna på en plåt klädd med bakplåtspapper och rosta i 9 minuter tills de doftar. Ta ut direkt, svalna i rumstemperatur, och hacka sedan grovt.',
    'Torrosta tomatpurén: Lägg tomatpurén i en torr panna över medelvärme. Rör konstant i 3 minuter tills den mörknar från klarröd till djupt tegelröd och luktar sött i stället för skarpt. Skrapa ner i en skål och svalna.',
    'Blötlägg löken: Blötlägg den skivade rödlöken i kallt vatten i 10 minuter för att ta bort den råa skärpan, låt sedan rinna av ordentligt.',
    'Blanchera broccolin: Koka upp en stor gryta med osaltat vatten till full kokning. Lägg i broccolibuketterna och blanchera i 1 minut, tills de är intensivt gröna och precis mjuka vid stjälken.',
    'Chocka och torka: Häll av och skölj under kallt vatten i 2 minuter. Torka noggrant — salladsslunga, klappa sedan torrt med en handduk. Blöt broccoli späder ut dressingen.',
    'Mixa dressingen: Mixa den rostade tomatpurén med de vita bönorna, citronsaft, näringsjäst, dadel, vitlök, rökt paprika, salt och vatten i mixern tills det är helt slätt — minst 60 sekunder. Den ska vara hällbar och blank.',
    'Sätt ihop: Blanda broccoli, svarta bönor, lök och valnötter i en stor skål. Häll över dressingen och vänd tills alla buketter är täckta.',
    'Kyl och avsluta: Ställ kallt i minst 30 minuter. Servera kall eller i rumstemperatur, och strö de malda linfröna över varje portion precis före servering — aldrig nedrörda i förväg.',
  ],
}

SV['orn-41'] = {
  title: 'Fredriks rostade bovete- och daddelgranola',
  description: 'Djuprostade havregryn, karamellik daddelpasta och bovetegryn bakade till riktiga knapriga klasar. Utan olja, utan tillsatt socker — Ornish GREEN.',
  notes: 'De två oförhandlingsbara sakerna är att pressa plattan hårt och svalna den helt orörd. Tillsammans är det skillnaden mellan klasar och smulor. Ersättningar: bovetegryn → quinoaflingor eller puffad hirs (lite mindre knaprigt); Medjooldadlar → Deglet Noor-dadlar plus lite extra vatten; kanel → hälften kardemumma, hälften kanel för en nordisk profil. Servera med osötad sojamjölk och bär per portion — det ger också C-vitamin, som ökar järnupptaget från havren.',
  names: [
    'havregryn (vanliga, inte snabbgryn)',
    'råa bovetegryn',
    'Medjooldadlar, urkärnade',
    'kokande vatten',
    'malen kanel',
    'vaniljextrakt',
    'Fint havssalt, efter smak',
    'malda linfrön (tillsätts utanför värmen)',
  ],
  steps: [
    'Torrosta havregrynen: Värm en stor torr panna över medelvärme. Tillsätt havregrynen och rosta, rör ofta, tills de doftar nötigt och blir en nyans mörkare — cirka 6 minuter. Det är här större delen av smaken kommer från; stressa inte. Häll över i en stor skål.',
    'Rosta bovetet: I samma torra panna, rosta bovetegrynen i 3 minuter tills de doftar och är lätt gyllene. Tillsätt i skålen med havregrynen.',
    'Blöt upp dadlarna: Lägg dadlarna i en mixer med det kokande vattnet och låt dem mjukna i 5 minuter. Mixa till en helt slät, blank pasta — den ska se ut som karamell. Mixa i kanel, vaniljextrakt och salt.',
    'Kombinera: Häll daddelpastan över de rostade havregrynen och bovetet. Blanda noggrant med en slickepott tills varje flinga är täckt och blandningen håller ihop när du kramar den i handen.',
    'Pressa ut till en platta: Värm ugnen till 150 °C. Klä en plåt med bakplåtspapper. Häll ut blandningen och pressa ner den ordentligt till en jämn platta på cirka 1 cm tjocklek — hårt tryck är det som skapar klasar i stället för lösa smulor.',
    'Grädda orörd: Grädda i 25 minuter utan att röra den.',
    'Bryt och avsluta gräddningen: Bryt plattan i stora bitar med en slickepott, vänd dem, och grädda ytterligare 15 minuter tills de är torra och djupt gyllene.',
    'Svalna helt: Dra över bakplåtspappret på ett galler och låt granolan stå helt orörd i minst 45 minuter. Den blir knaprig medan den svalnar — att flytta den medan den är varm är den absolut vanligaste anledningen till att granola blir mjuk.',
    'Rör i linfröna: När den är helt sval, rör ner de malda linfröna i granolan. Att tillsätta dem utanför värmen skyddar ALA-omega-3 mot oxidation. Förvara i en lufttät burk i upp till 2 veckor.',
  ],
}

// ── apply ────────────────────────────────────────────────────────────────
const applied = []
const problems = []
for (const [id, sv] of Object.entries(SV)) {
  const r = pack.recipes.find(x => x.id === id)
  if (!r) { problems.push(`recipe not found: ${id}`); continue }
  if (sv.names.length !== r.ingredients.length) {
    problems.push(`${id}: ${sv.names.length} SV names vs ${r.ingredients.length} EN ingredients`)
    continue
  }
  if (sv.steps.length !== r.steps.length) {
    problems.push(`${id}: ${sv.steps.length} SV steps vs ${r.steps.length} EN steps`)
    continue
  }
  // Copy quantity/unit from EN, swap only the name — alignment by construction.
  r.translations.sv = {
    title: sv.title,
    description: sv.description,
    ingredients: r.ingredients.map((row, i) => ({ ...row, name: sv.names[i] })),
    steps: sv.steps,
  }
  if (sv.notes) r.translations.sv.notes = sv.notes
  applied.push(id)
}

if (problems.length) {
  console.error('PROBLEMS — nothing written:')
  problems.forEach(p => console.error('  ' + p))
  process.exit(1)
}

pack.version = '1.18.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log('Norwegian title fixes:')
titleFixes.forEach(f => console.log('  ' + f))
console.log(`\nSwedish translations added: ${applied.length} (${applied.join(', ')})`)
console.log('pack ->', pack.version)

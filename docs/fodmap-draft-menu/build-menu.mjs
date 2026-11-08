/**
 * Draft week. Nutrition is calculated, not typed in.
 * Does not write recipe packs and does not mark anything eligible for Make my week.
 *
 * Run: node docs/fodmap-draft-menu/build-menu.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipe, round } from '../../scripts/lib/recipeNutritionEstimate.mjs'
import { microPer100 } from '../../scripts/lib/micronutrients.mjs'
import { NNR_ADULT } from '../../src/utils/healthGoals.js'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const row = (ingredient, quantity, unit, note = '') => ({ ingredient, quantity, unit, note })
const MICRO_KEYS = ['calcium', 'iron', 'vitaminB12', 'vitaminD', 'omega3']

const RECIPES = [
  {
    id: 'B1',
    title: 'Lemon tofu and potato skillet',
    meal: 'breakfast',
    flavour: 'savoury',
    servings: 1,
    time: { prepMin: 15, cookMin: 25, tempC: null },
    method: [
      'Peel the potato and cut it into 1.5 cm dice.',
      'Put the potato and the water in a wide pan, cover, and cook over a medium heat for about 12 minutes, until a cube is tender. Pour off the water you do not want in the bowl.',
      'Crumble in the tofu. Add the oil, turmeric, cumin, ginger, chives and salt. Cook uncovered for about 8 minutes, stirring, until the tofu is hot and the edges colour.',
      'Fold in the spinach and cook for 2 minutes. Take the pan off the heat and stir in the lemon juice.',
    ],
    yield: 'The whole skillet is one serving. Cooked weight has not been measured.',
    tags: ['soy', 'nut-free'],
    standardSaltG: 1,
    ingredients: [
      row('potatoes', 280, 'g', 'raw, peeled'),
      row('tofu', 150, 'g', 'firm, calcium-set, drained weight'),
      row('olive-oil', 15, 'g', 'plain'),
      row('spinach', 50, 'g', 'raw leaves'),
      row('chives', 12, 'g', 'green leaves, not a bulb'),
      row('ginger-fresh', 10, 'g', 'peeled, grated'),
      row('lemon-juice', 15, 'ml', 'fresh'),
      row('turmeric-ground', 1, 'g', ''),
      row('cumin-ground', 1, 'g', ''),
      row('salt', 0.4, 'g', 'low-salt amount'),
      row('water', 80, 'g', 'potable, for the potato'),
    ],
    evidence: 'Firm tofu is the drained kind a Monash blog describes as low FODMAP at a standard serve, unlike silken tofu (https://www.monashfodmap.com/blog/talking-tofu/, retrieved 8 Nov 2026). The gram cut-off is in the app and is not copied. 150 g is a kitchen portion. Potato at 280 g raw is far above the 75 g staple serve on their shopping list (3 Feb 2025), so that potato portion is not claimed. Plain oil and potable water are not given a FODMAP number here, and they are not treated as foods that need their own laboratory assay before you can cook.',
  },
  {
    id: 'B2',
    title: 'Chickpea, kale and tofu hash',
    meal: 'breakfast',
    flavour: 'savoury',
    servings: 1,
    time: { prepMin: 15, cookMin: 25, tempC: null },
    method: [
      'Dice the peeled potato. Cover it with the water and cook, covered, for about 12 minutes. Pour off the water.',
      'Add the oil, cumin, paprika, chives and salt. Cook for 5 minutes.',
      'Stir in the drained chickpeas, the crumbled tofu and the kale. Cook for 5 minutes, until the tofu is hot and the kale has wilted. Finish with the lemon juice.',
    ],
    yield: 'The whole pan is one serving. Cooked weight has not been measured.',
    tags: ['soy', 'nut-free'],
    standardSaltG: 1,
    ingredients: [
      row('potatoes', 220, 'g', 'raw, peeled'),
      row('chickpeas-canned', 42, 'g', 'drained, ordinary salt level of the table, not forced no-salt'),
      row('tofu', 130, 'g', 'firm, calcium-set, drained weight'),
      row('kale', 50, 'g', 'raw leaves, stems trimmed'),
      row('olive-oil', 12, 'g', 'plain'),
      row('lemon-juice', 15, 'ml', 'fresh'),
      row('cumin-ground', 1, 'g', ''),
      row('paprika-powder', 1, 'g', 'sweet, not hot chili'),
      row('chives', 8, 'g', 'green leaves'),
      row('salt', 0.4, 'g', 'low-salt amount'),
      row('water', 50, 'g', 'potable, for the potato'),
    ],
    evidence: 'The chickpeas stay at 42 g drained, the ¼ cup figure named on the Monash legumes blog (https://www.monashfodmap.com/blog/including-legumes-on-low-fodmap-diet/, retrieved 8 Nov 2026). They are a flavour, not the protein. Firm tofu carries the protein and is a kitchen portion, not an app gram. Potato is above the 75 g staple serve and is not claimed. The canned chickpea sodium is the ordinary drained row in the nutrition table.',
  },
  {
    id: 'B3',
    title: 'Cinnamon rice with orange',
    meal: 'breakfast',
    flavour: 'sweet',
    servings: 1,
    time: { prepMin: 5, cookMin: 40, tempC: null },
    method: [
      'Rinse the rice. Simmer it in the water, covered, on low heat for about 35–40 minutes, until the grains are tender and the water is absorbed. Add a splash more if the pan dries. Do not rinse the cooked rice.',
      'Stir in the cinnamon. Top with the orange and the pumpkin seeds.',
    ],
    yield: 'The pot of rice plus the fruit and seeds is one serving. Cooked rice weight has not been measured.',
    tags: ['soy-free', 'nut-free'],
    standardSaltG: null,
    ingredients: [
      row('brown-rice', 90, 'g', 'dry'),
      row('water', 270, 'g', 'potable, absorbed'),
      row('oranges', 150, 'g', 'raw, peeled segments'),
      row('cinnamon-ground', 0.5, 'g', ''),
      row('pumpkin-seeds', 10, 'g', 'hulled, raw'),
    ],
    evidence: 'Chumpitazi and others, Journal of Pediatrics 2018 (doi:10.1016/j.jpeds.2018.03.038), reported no detected FODMAPs in the cooked brown and white rice samples they assayed. That is not an upper limit and not this brand. 90 g dry is a bowl, left uncertified. Orange composition in Liljebo and others, BMC Nutrition 2020 (doi:10.1186/s40795-020-00374-3), includes 0.03 g fructan per 100 g and is not a serving limit. Pumpkin seeds, 10 g, were not in that supplement and are unassessed.',
  },
  {
    id: 'B4',
    title: 'Strawberry oats with tofu',
    meal: 'breakfast',
    flavour: 'sweet',
    servings: 1,
    time: { prepMin: 8, cookMin: 12, tempC: null },
    method: [
      'Simmer the oats in the water for about 8–10 minutes, stirring, until creamy. Keep that liquid in the bowl. Stir in the cinnamon and top with the strawberries and sunflower seeds.',
      'In a small pan, warm the tofu in the oil with the chives and a pinch of the salt for about 4 minutes, until hot. Eat it beside the oats, not stirred in unless you like it that way.',
    ],
    yield: 'The bowl of oats and the small pan of tofu together are one serving. Cooked weights have not been measured.',
    tags: ['soy', 'nut-free', 'oats-portion-pending'],
    standardSaltG: 0.6,
    ingredients: [
      row('rolled-oats', 60, 'g', 'dry, plain'),
      row('water', 240, 'g', 'potable, for the oats'),
      row('strawberries', 120, 'g', 'raw, hulled'),
      row('cinnamon-ground', 0.5, 'g', ''),
      row('sunflower-seeds', 10, 'g', 'hulled'),
      row('tofu', 120, 'g', 'firm, calcium-set, drained weight'),
      row('olive-oil', 5, 'g', 'plain, for the tofu'),
      row('chives', 6, 'g', 'green leaves'),
      row('salt', 0.2, 'g', 'low-salt amount, on the tofu'),
    ],
    evidence: '60 g dry oats is a normal porridge, larger than a token sprinkle, and it is not an assessed low-FODMAP serve. Rolled oats were absent from the selected BMC 2020 supplement. Sunflower seeds, 10 g, are unassessed. Firm tofu beside the bowl is the protein; its gram boundary was not copied from the app. This breakfast is not a gluten-free claim.',
  },
  {
    id: 'D1',
    title: 'Unsweetened soy drink',
    meal: 'drink',
    flavour: 'plain',
    servings: 1,
    time: { prepMin: 1, cookMin: 0, tempC: null },
    method: [
      'Pour 200 ml and drink it cold, or warm it in a pan without boiling.',
      'Read the carton. These numbers are the app’s unsweetened soy-drink row, which is not a fortified label. If the carton lists added calcium, vitamin D or vitamin B12, use that label for those nutrients and do not add it on top of this row.',
    ],
    yield: '200 ml, one drink. No cooked weight.',
    tags: ['soy', 'nut-free', 'unfortified-table-row'],
    standardSaltG: null,
    ingredients: [
      row('soy-milk', 200, 'ml', 'unsweetened soy drink as in the nutrition table, not a named fortified brand'),
    ],
    evidence: 'The composition row is “unsweetened soy drink” (about 36 kcal and 3.2 g protein per 100 g; density 1.03). The micronutrient row used with it lists about 25 mg calcium per 100 g, vitamin B12 0 and vitamin D 0. That is this table, not a promise about every carton. A Monash shopping list (3 Feb 2025) mentions soy-protein drinks and says to check the ingredient list; it does not give a millilitre serve, and this row does not say whether the drink is made from soy protein or from whole beans. 200 ml is therefore included as food, with FODMAP eligibility left false.',
  },
  {
    id: 'M1',
    title: 'Ginger tofu, zucchini and rice',
    meal: 'dinner',
    flavour: 'savoury',
    servings: 2,
    time: { prepMin: 15, cookMin: 45, tempC: null },
    method: [
      'Rinse the rice and simmer it in its water, covered, for about 35–40 minutes, until tender. Keep the absorbed liquid in the rice.',
      'Cut the zucchini into half-moons. Dice the tofu.',
      'Warm the oil in a pan. Add the ginger, turmeric and tofu and cook for 6–8 minutes. Add the zucchini and chives and cook for another 6 minutes, until the zucchini is tender.',
      'Stir in the lemon juice and salt. Serve half the rice with half the pan.',
    ],
    yield: 'Divide the rice and the pan evenly into two servings. One is dinner, one is next-day lunch. Cooked weights have not been measured.',
    tags: ['soy', 'nut-free', 'contains-rice'],
    standardSaltG: 2,
    ingredients: [
      row('brown-rice', 200, 'g', 'dry, for two servings'),
      row('water', 600, 'g', 'potable, for the rice'),
      row('tofu', 300, 'g', 'firm, calcium-set, drained, for two servings'),
      row('zucchini', 200, 'g', 'raw'),
      row('olive-oil', 30, 'g', 'plain'),
      row('ginger-fresh', 20, 'g', 'peeled, grated'),
      row('turmeric-ground', 2, 'g', ''),
      row('chives', 20, 'g', 'green leaves'),
      row('lemon-juice', 30, 'ml', 'fresh'),
      row('salt', 0.8, 'g', 'low-salt amount for two servings'),
    ],
    evidence: 'Per person: 100 g dry brown rice and 150 g firm tofu. Rice follows the 2018 assay note on B3, without an upper limit copied from anywhere. Tofu is a kitchen portion. Zucchini, 100 g per person, has no serving classification in this packet. The plate is not a stacking assessment.',
  },
  {
    id: 'M2',
    title: 'Rosemary potato, carrot and tofu tray',
    meal: 'dinner',
    flavour: 'savoury',
    servings: 2,
    time: { prepMin: 15, cookMin: 40, tempC: 200 },
    method: [
      'Heat the oven to 200°C. Cut the peeled potatoes and the carrots into wedges.',
      'Toss them with the oil, rosemary, paprika and salt. Spread on a tray and roast for 25 minutes.',
      'Add the tofu in chunks and the chives. Roast for another 12–15 minutes, until the potatoes are soft and the tofu is hot.',
      'Add the lemon juice and divide the tray in two.',
    ],
    yield: 'The whole tray divided evenly into two servings. Cooked weight has not been measured.',
    tags: ['soy', 'nut-free'],
    standardSaltG: 2,
    ingredients: [
      row('potatoes', 500, 'g', 'raw, peeled, for two servings'),
      row('carrots', 150, 'g', 'raw, peeled'),
      row('tofu', 300, 'g', 'firm, calcium-set, drained, for two servings'),
      row('olive-oil', 30, 'g', 'plain'),
      row('rosemary', 2, 'g', 'leaves'),
      row('paprika-powder', 2, 'g', 'sweet, not hot chili'),
      row('chives', 16, 'g', 'green leaves'),
      row('lemon-juice', 30, 'ml', 'fresh'),
      row('salt', 0.8, 'g', 'low-salt amount for two servings'),
    ],
    evidence: 'Per person: 250 g raw potato and 75 g raw carrot. Carrot matches the 75 g staple serve on the Monash blog shopping list (3 Feb 2025). Potato is well above that serve and is not claimed. Firm tofu, 150 g, is a kitchen portion. Rosemary has flavour here; it has no FODMAP note in this packet.',
  },
  {
    id: 'M3',
    title: 'Polenta with chickpea, pepper and eggplant',
    meal: 'dinner',
    flavour: 'savoury',
    servings: 2,
    time: { prepMin: 15, cookMin: 30, tempC: null },
    method: [
      'Bring the polenta water to a simmer, whisk in the polenta, and cook, stirring often, for about 15–20 minutes, until thick. Stir in half the oil and half the salt.',
      'Dice the eggplant, pepper and tomato. Cook them in the rest of the oil with the cumin and paprika, covered for 8 minutes, then uncovered for about 5, until the eggplant is soft.',
      'Add the drained chickpeas, the diced tofu, the parsley and the rest of the salt. Warm for 4 minutes. Finish with the lemon juice.',
      'Serve half the polenta with half the pan.',
    ],
    yield: 'Polenta and pan divided evenly into two servings. Cooked weights have not been measured.',
    tags: ['soy', 'nut-free'],
    standardSaltG: 2,
    ingredients: [
      row('cornmeal-polenta', 150, 'g', 'dry, for two servings'),
      row('water', 700, 'g', 'potable, for the polenta'),
      row('chickpeas-canned', 84, 'g', 'drained, for two servings'),
      row('tofu', 280, 'g', 'firm, calcium-set, drained, for two servings'),
      row('eggplant', 150, 'g', 'raw'),
      row('bell-peppers', 140, 'g', 'raw'),
      row('tomatoes', 140, 'g', 'raw'),
      row('olive-oil', 28, 'g', 'plain'),
      row('cumin-ground', 3, 'g', ''),
      row('paprika-powder', 2, 'g', 'sweet'),
      row('parsley', 16, 'g', 'leaves'),
      row('lemon-juice', 30, 'ml', 'fresh'),
      row('salt', 0.8, 'g', 'low-salt amount for two servings'),
    ],
    evidence: 'Chickpeas stay at 42 g drained per person, the published ¼ cup figure. They do not carry the meal. Firm tofu does. Polenta has no FODMAP serve in this packet. Eggplant is 75 g per person and pepper 70 g, in line with the 75 g staple serve named for those vegetables on the 3 Feb 2025 shopping list. Fresh tomato is unassessed. This is a polenta plate, not another rice plate.',
  },
  {
    id: 'M4',
    title: 'Lemon lentil, potato and tofu plate',
    meal: 'dinner',
    flavour: 'savoury',
    servings: 2,
    time: { prepMin: 20, cookMin: 35, tempC: null },
    method: [
      'Boil the dry lentils in plenty of unsalted water until just tender, then drain and throw away that water.',
      'Dice the potatoes and carrots. Boil them in fresh water until tender, then drain.',
      'Warm the tofu in half the oil for 4 minutes. Toss potatoes, carrots, lentils and tofu with the rest of the oil, the lemon juice, parsley, chives, cumin and salt.',
    ],
    yield: 'The whole bowl divided evenly into two servings. Lentil weight in the list is dry. Cooked lentil weight has not been measured.',
    tags: ['soy', 'nut-free', 'pulse-portion-pending'],
    standardSaltG: 2,
    ingredients: [
      row('lentils-green-brown', 40, 'g', 'dry; boiled and drained; cooking water discarded; for two servings'),
      row('potatoes', 440, 'g', 'raw, peeled, for two servings'),
      row('carrots', 150, 'g', 'raw, peeled'),
      row('tofu', 280, 'g', 'firm, calcium-set, drained, for two servings'),
      row('olive-oil', 24, 'g', 'plain'),
      row('lemon-juice', 30, 'ml', 'fresh'),
      row('parsley', 20, 'g', 'leaves'),
      row('chives', 16, 'g', 'green leaves'),
      row('cumin-ground', 2, 'g', ''),
      row('salt', 0.8, 'g', 'low-salt amount for two servings'),
    ],
    evidence: 'Lentils stay at 20 g dry per person, boiled and drained. Nutrition uses the dry row (about 352 kcal and 24.6 g protein per 100 g). BMC Nutrition 2020 reports 0.46 g GOS per 100 g boiled green lentils and no serving limit. A Monash blog mentions ½ cup tinned lentils without grams. This is not that product, and the amount was not increased to manufacture protein. Firm tofu is the protein. Potato is 220 g raw per person and is not claimed against the 75 g staple serve. Carrot is 75 g.',
  },
  {
    id: 'M5',
    title: 'Polenta with tofu, peppers and zucchini',
    meal: 'dinner',
    flavour: 'savoury',
    servings: 2,
    time: { prepMin: 15, cookMin: 30, tempC: null },
    method: [
      'Simmer the polenta water, whisk in the polenta, and cook, stirring, for about 15–20 minutes. Stir in half the oil and half the salt.',
      'Cook the pepper, zucchini and tomato in the rest of the oil with paprika, cumin and chives for about 12 minutes, until soft. Add the tofu and warm it for 4 minutes.',
      'Finish with lemon juice and the rest of the salt. Divide polenta and vegetables. Put the pumpkin seeds on each plate.',
    ],
    yield: 'Divided evenly into two servings, seeds included. Cooked weights have not been measured.',
    tags: ['soy', 'nut-free', 'seed-portion-pending'],
    standardSaltG: 2,
    ingredients: [
      row('cornmeal-polenta', 150, 'g', 'dry, for two servings'),
      row('water', 700, 'g', 'potable, for the polenta'),
      row('tofu', 300, 'g', 'firm, calcium-set, drained, for two servings'),
      row('bell-peppers', 140, 'g', 'raw'),
      row('zucchini', 180, 'g', 'raw'),
      row('tomatoes', 120, 'g', 'raw'),
      row('olive-oil', 24, 'g', 'plain'),
      row('paprika-powder', 2, 'g', 'sweet'),
      row('cumin-ground', 2, 'g', ''),
      row('chives', 16, 'g', 'green leaves'),
      row('lemon-juice', 20, 'ml', 'fresh'),
      row('pumpkin-seeds', 20, 'g', 'hulled, raw, for two servings'),
      row('salt', 0.8, 'g', 'low-salt amount for two servings'),
    ],
    evidence: 'Pepper is 70 g per person, inside the 75 g staple serve on the 3 Feb 2025 shopping list. Zucchini, tomato, polenta and 10 g pumpkin seeds have no serving classification here. Firm tofu, 150 g per person, is the protein so this plate is not a low-protein soy-free day. Seeds were not piled up to fake a protein target.',
  },
  {
    id: 'M6',
    title: 'Spinach, potato and tofu',
    meal: 'dinner',
    flavour: 'savoury',
    servings: 2,
    time: { prepMin: 15, cookMin: 30, tempC: null },
    method: [
      'Dice the peeled potatoes. Boil them until tender, then drain.',
      'Crumble the tofu into a wide pan with the oil, ginger, cumin and half the salt. Cook for 6 minutes.',
      'Add the potatoes, spinach and chives. Stir until the spinach wilts and the potato is hot, about 4 minutes. Add the lemon juice and the rest of the salt. Divide in two.',
    ],
    yield: 'The pan divided evenly into two servings. Cooked potato weight has not been measured. There is no rice in this dish.',
    tags: ['soy', 'nut-free'],
    standardSaltG: 2,
    ingredients: [
      row('potatoes', 500, 'g', 'raw, peeled, for two servings'),
      row('tofu', 300, 'g', 'firm, calcium-set, drained, for two servings'),
      row('spinach', 160, 'g', 'raw leaves'),
      row('olive-oil', 24, 'g', 'plain'),
      row('ginger-fresh', 16, 'g', 'peeled'),
      row('cumin-ground', 2, 'g', ''),
      row('chives', 16, 'g', 'green leaves'),
      row('lemon-juice', 30, 'ml', 'fresh'),
      row('salt', 0.8, 'g', 'low-salt amount for two servings'),
    ],
    evidence: 'A potato plate, so the week is not rice at every meal. Potato is 250 g raw per person and is not claimed against the 75 g staple serve. Spinach has no FODMAP serve in this packet. Firm tofu is 150 g per person, a kitchen portion.',
  },
  {
    id: 'M7',
    title: 'Ginger cabbage and tofu with rice',
    meal: 'dinner',
    flavour: 'savoury',
    servings: 2,
    time: { prepMin: 15, cookMin: 45, tempC: null },
    method: [
      'Cook the rice in its water, covered, for about 35–40 minutes.',
      'Shred the cabbage and slice the carrot. Warm the oil with the ginger and turmeric, add the tofu, and cook for 6 minutes.',
      'Add the cabbage, carrot and chives. Cover and cook for about 8 minutes, until the cabbage is tender but still green. Stir in the lemon juice and salt.',
      'Serve half the rice with half the pan.',
    ],
    yield: 'Divided evenly into two servings. If Monday lunch is the second serving, cook this on Sunday evening so the rice is eaten within a day.',
    tags: ['soy', 'nut-free', 'contains-rice'],
    standardSaltG: 2,
    ingredients: [
      row('brown-rice', 180, 'g', 'dry, for two servings'),
      row('water', 540, 'g', 'potable, for the rice'),
      row('tofu', 280, 'g', 'firm, calcium-set, drained, for two servings'),
      row('cabbage', 160, 'g', 'raw, shredded'),
      row('carrots', 150, 'g', 'raw, peeled'),
      row('olive-oil', 24, 'g', 'plain'),
      row('ginger-fresh', 20, 'g', 'peeled'),
      row('turmeric-ground', 2, 'g', ''),
      row('chives', 16, 'g', 'green leaves'),
      row('lemon-juice', 30, 'ml', 'fresh'),
      row('salt', 0.8, 'g', 'low-salt amount for two servings'),
    ],
    evidence: 'Carrot is 75 g per person, the staple serve named on the 3 Feb 2025 shopping list. Cabbage on that list is grouped with leafy vegetables at 75 g; this draft uses 80 g per person, so the cabbage is not claimed. Rice is 90 g dry per person. Firm tofu is 140 g per person.',
  },
  {
    id: 'S1',
    title: 'Lemon carrots',
    meal: 'side',
    flavour: 'savoury',
    servings: 1,
    time: { prepMin: 5, cookMin: 12, tempC: null },
    method: [
      'Slice the carrot. Simmer it in the water for about 8 minutes, until just tender. Drain.',
      'Toss with the oil, lemon juice, chives and salt.',
    ],
    yield: 'One plate. Cooked weight has not been measured. Counted in the day’s total.',
    tags: ['soy-free', 'nut-free'],
    standardSaltG: 0.6,
    ingredients: [
      row('carrots', 75, 'g', 'raw, peeled'),
      row('water', 80, 'g', 'potable'),
      row('olive-oil', 8, 'g', 'plain'),
      row('lemon-juice', 8, 'ml', 'fresh'),
      row('chives', 4, 'g', 'green leaves'),
      row('salt', 0.2, 'g', 'low-salt amount'),
    ],
    evidence: '75 g raw carrot matches the staple serve named for carrot on the Monash blog shopping list (3 Feb 2025). That is not a test of this side.',
  },
  {
    id: 'N1',
    title: 'Orange',
    meal: 'snack',
    flavour: 'sweet',
    servings: 1,
    time: { prepMin: 2, cookMin: 0, tempC: null },
    method: ['Peel and eat the orange.'],
    yield: 'One snack, counted in the day’s total.',
    tags: ['soy-free', 'nut-free'],
    standardSaltG: null,
    ingredients: [row('oranges', 150, 'g', 'raw, peeled')],
    evidence: 'BMC Nutrition 2020 gives an orange composition, including a small fructan figure, and no serving limit. 150 g peeled fruit is one snack, not a certified serve.',
  },
  {
    id: 'N2',
    title: 'Carrot and peanut butter',
    meal: 'snack',
    flavour: 'savoury',
    servings: 1,
    time: { prepMin: 5, cookMin: 0, tempC: null },
    method: ['Cut the carrot into sticks. Eat it with the peanut butter.'],
    yield: 'One snack. Used on one day only, not stacked through the week.',
    tags: ['soy-free', 'contains-peanut'],
    standardSaltG: null,
    ingredients: [
      row('carrots', 75, 'g', 'raw, peeled'),
      row('peanut-butter', 16, 'g', 'peanuts only, smooth'),
    ],
    evidence: 'Carrot 75 g as on S1. Peanut butter has no serving limit in the sources used here. The 2018 US assay found some fructose and fructo-oligosaccharides in the peanut butter they tested; that is not a green-serve rating. 16 g is one smear, not a handful of nuts. Skip it if peanuts are excluded; that day then uses an orange instead, and the total drops by the difference.',
  },
]

const WEEK = [
  { day: 'Monday', breakfast: 'B1', drink: 'D1', lunch: 'M7', dinner: 'M2', side: 'S1', snack: 'N1', lunchNote: 'Second serving of Sunday’s rice dish. Cool the rice within an hour and eat it by Monday lunch, reheated once until steaming.' },
  { day: 'Tuesday', breakfast: 'B2', drink: 'D1', lunch: 'M2', dinner: 'M1', side: 'S1', snack: 'N1', lunchNote: 'Second serving of Monday’s potato tray. Eat it the next day.' },
  { day: 'Wednesday', breakfast: 'B3', drink: 'D1', lunch: 'M1', dinner: 'M3', side: 'S1', snack: 'N1', lunchNote: 'Second serving of Tuesday’s rice dish, within 24 hours.' },
  { day: 'Thursday', breakfast: 'B1', drink: 'D1', lunch: 'M3', dinner: 'M4', side: 'S1', snack: 'N1', lunchNote: 'Second serving of Wednesday’s polenta. Next day, not later in the week.' },
  { day: 'Friday', breakfast: 'B4', drink: 'D1', lunch: 'M4', dinner: 'M5', side: 'S1', snack: 'N1', lunchNote: 'Second serving of Thursday’s lentil plate.' },
  { day: 'Saturday', breakfast: 'B3', drink: 'D1', lunch: 'M5', dinner: 'M6', side: 'S1', snack: 'N2', lunchNote: 'Second serving of Friday’s polenta. Snack is the peanut one; use an orange instead if peanuts are out.' },
  { day: 'Sunday', breakfast: 'B2', drink: 'D1', lunch: 'M6', dinner: 'M7', side: 'S1', snack: 'N1', lunchNote: 'Second serving of Saturday’s potato dish. Cook Sunday’s rice in the evening if Monday lunch depends on it.' },
]

function perServing(recipe, { standard = false } = {}) {
  const ingredients = recipe.ingredients.map(r => {
    if (r.ingredient !== 'salt' || !standard || recipe.standardSaltG == null) return { ...r }
    return { ...r, quantity: recipe.standardSaltG, note: 'standard-salt amount' }
  })
  const est = estimateRecipe({ ingredients }, { sodiumMode: 'asWritten' })
  const div = recipe.servings
  const core = {}
  for (const [field, total] of Object.entries(est.totals)) core[field] = round(total / div, field)
  const summed = Object.fromEntries(MICRO_KEYS.map(k => [k, 0]))
  const missingIds = new Set()
  const sourcedZero = Object.fromEntries(MICRO_KEYS.map(k => [k, true]))
  for (const r of ingredients) {
    let per100
    try { per100 = microPer100(r) } catch { missingIds.add(r.ingredient); continue }
    const grams = est.rows.find(x => x.id === r.ingredient)?.grams
    if (grams == null) continue
    for (const k of MICRO_KEYS) {
      const per = per100[k] || 0
      summed[k] += per * grams / 100
      if (per !== 0) sourcedZero[k] = false
    }
  }
  for (const k of MICRO_KEYS) {
    const v = summed[k] / div
    summed[k] = k === 'calcium' || k === 'iron' ? Math.round(v * 10) / 10 : Math.round(v * 1000) / 1000
  }
  return {
    core,
    micros: summed,
    microsMissingIds: [...missingIds],
    microsSourcedZero: sourcedZero,
    weightInputG: Math.round(est.weight / div),
    problems: est.problems,
  }
}

const cooked = RECIPES.map(r => ({
  ...r,
  nutritionLowSalt: perServing(r, { standard: false }),
  nutritionStandardSalt: r.standardSaltG == null ? null : perServing(r, { standard: true }),
}))
const byId = Object.fromEntries(cooked.map(r => [r.id, r]))

function dayFigures(day, { standard = false } = {}) {
  const ids = [day.breakfast, day.drink, day.lunch, day.dinner, day.side, day.snack].filter(Boolean)
  const core = {}
  const micros = Object.fromEntries(MICRO_KEYS.map(k => [k, 0]))
  const missing = new Set()
  const sawMapped = Object.fromEntries(MICRO_KEYS.map(k => [k, false]))
  const sawNonZero = Object.fromEntries(MICRO_KEYS.map(k => [k, false]))
  for (const id of ids) {
    const nut = standard && byId[id].nutritionStandardSalt ? byId[id].nutritionStandardSalt : byId[id].nutritionLowSalt
    for (const k of Object.keys(nut.core)) core[k] = (core[k] || 0) + nut.core[k]
    for (const k of MICRO_KEYS) {
      micros[k] += nut.micros[k]
      if (nut.micros[k] !== 0) sawNonZero[k] = true
      sawMapped[k] = true
    }
    for (const idMissing of nut.microsMissingIds) missing.add(idMissing)
  }
  for (const k of ['kcal', 'sodium', 'potassium']) core[k] = Math.round(core[k])
  for (const k of ['protein', 'fat', 'satFat', 'carbs', 'fiber', 'sugars', 'added']) {
    if (core[k] != null) core[k] = Math.round(core[k] * 10) / 10
  }
  for (const k of MICRO_KEYS) {
    micros[k] = k === 'calcium' || k === 'iron' ? Math.round(micros[k] * 10) / 10 : Math.round(micros[k] * 1000) / 1000
  }
  return { core, micros, microsMissingIds: [...missing], sawNonZero }
}

const days = WEEK.map(d => ({
  ...d,
  fullLow: dayFigures(d, { standard: false }),
  fullStandard: dayFigures(d, { standard: true }),
}))

const packet = {
  schema: 'fredheim-fodmap-menu-draft',
  schemaVersion: 2,
  status: 'draft',
  clinical_review_status: 'not_reviewed',
  low_fodmap_status: null,
  eligible_for_trial_menu: false,
  meal_fodmap_assessment: null,
  production_dataset: null,
  purpose: 'A substantial original plant-based week to cook. Not an approved therapeutic menu. Not eligible for low-FODMAP Make my week.',
  built: '2026-11-08',
  energyTarget: {
    kcal: NNR_ADULT.calories,
    protein: NNR_ADULT.protein,
    note: '2000 kcal and about 60 g protein are the app’s adult display figures, not a prescription. Day totals below include breakfast, the soy drink, lunch, dinner, the side and the snack.',
  },
  soyFreeWeek: 'not_provided',
  references: {
    nnr: 'Display figures already in src/utils/healthGoals.js from Nordic Nutrition Recommendations 2023: about 60 g protein at ~70 kg, fibre 30 g, calcium 950 mg, iron 9 mg for men and about 15 mg for women of reproductive age, vitamin B12 4 µg, vitamin D 10 µg, omega-3 ALA guide 2 g. Energy 2000 kcal is a conventional base, not an NNR prescription.',
    nutritionMethod: 'estimateRecipe() on scripts/data/food-composition-core.json, divided by servings. Calcium, iron, vitamin B12, vitamin D and omega-3 ALA from scripts/lib/micronutrients.mjs on the same weights. A missing micronutrient row is listed and is not entered as zero. A stored 0 is a sourced zero for that row only.',
    fodmap: [
      'https://www.monashfodmap.com/blog/talking-tofu/',
      'https://www.monashfodmap.com/blog/including-legumes-on-low-fodmap-diet/',
      'https://www.monashfodmap.com/blog/low-fodmap-shopping-list/',
      'https://doi.org/10.1016/j.jpeds.2018.03.038',
      'https://doi.org/10.1186/s40795-020-00374-3',
    ],
    foodSafety: [
      'https://www.nhs.uk/baby/weaning-and-feeding/childrens-food-safety-and-hygiene/',
      'https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker',
      'https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely',
    ],
  },
  recipes: cooked.map(r => ({
    id: r.id,
    title: r.title,
    meal: r.meal,
    flavour: r.flavour,
    servings: r.servings,
    time: r.time,
    method: r.method,
    yield: r.yield,
    tags: r.tags,
    ingredients: r.ingredients,
    standardSaltG: r.standardSaltG,
    evidence: r.evidence,
    eligible_for_trial_menu: false,
    eligible_for_make_my_week_fodmap_mode: false,
    low_fodmap_status: null,
    clinical_review_status: 'not_reviewed',
    nutrients_per_serving_low_salt: r.nutritionLowSalt.core,
    nutrients_per_serving_standard_salt: r.nutritionStandardSalt ? r.nutritionStandardSalt.core : null,
    micros_per_serving: r.nutritionLowSalt.micros,
    micros_missing_ids: r.nutritionLowSalt.microsMissingIds,
    input_weight_g_per_serving: r.nutritionLowSalt.weightInputG,
    nutrition_problems: r.nutritionLowSalt.problems,
  })),
  week: days,
}

fs.writeFileSync(path.join(DIR, 'menu.json'), JSON.stringify(packet, null, 2) + '\n')

function n(recipe, field, salt = 'low') {
  const block = salt === 'standard' && recipe.nutritionStandardSalt ? recipe.nutritionStandardSalt : recipe.nutritionLowSalt
  return block.core[field]
}

function fmtIng(r) {
  return r.ingredients.map(i => {
    const q = Math.round((i.quantity / r.servings) * 100) / 100
    const std = i.ingredient === 'salt' && r.standardSaltG != null
      ? ` (low salt ${q} ${i.unit}; standard salt ${Math.round((r.standardSaltG / r.servings) * 100) / 100} ${i.unit})`
      : ''
    return `- ${q} ${i.unit} ${i.ingredient}${i.note ? `, ${i.note}` : ''}${std}`
  }).join('\n')
}

let md = `# A week of plant-based food (draft)

This is a menu you can cook. It is **not** an approved low-FODMAP plan, **not** a Monash diet, and **not** eligible for the app’s low-FODMAP Make my week mode. No clinician has signed it. The recipes are original. FODMAP eligibility of every dish is false. Where a public source names a serve, that serve is cited and was not enlarged in order to keep the citation. Potato, oats, zucchini, polenta, spinach, seeds and the soy drink are used in kitchen amounts and are **not** described as assessed low-FODMAP serves.

**What “a full day” means here.** Breakfast, one 200 ml soy drink, lunch, dinner, the carrot side and the snack. Lunch is the second serving of the previous dinner, the same size. The table below is that whole day, not a plate with the snack left off.

**Illustrative adult figures, not a prescription.** ${NNR_ADULT.calories} kcal and about ${NNR_ADULT.protein} g protein are the display figures already in this app. Nordic Nutrition Recommendations 2023 set energy by age, sex and activity, and protein near 0.83 g per kg (about 60 g at 70 kg). One person may need more or less. These servings were built as a normal adult day. They were not inflated afterward to paint a perfect score, and they were not shrunk to protect a low-FODMAP claim the file does not make.

**How the numbers were made.** Dictionary ids, \`estimateRecipe()\` and \`scripts/data/food-composition-core.json\`, divided by servings. Calcium, iron, vitamin B12, vitamin D and omega-3 ALA use \`scripts/lib/micronutrients.mjs\` on the same weights. If an ingredient has no micronutrient row, it is named and left out. It is not stored as zero. If the row contains 0, that zero is what the table says for that food. Iodine is not a column in that file, so iodine is not estimated at all. Water is 0 kcal. Dry rice, oats, polenta and lentils are dry weights. Cooked weights were not measured.

**Calcium and the soy drink.** Tofu calcium uses the app’s firm, calcium-set row (350 mg per 100 g). If your block is not calcium-set, that calcium is not there. The drink is 200 ml of the table’s unsweetened soy drink: about 25 mg calcium per 100 g, vitamin B12 0, vitamin D 0. A carton that says fortified is a different product. Use its label for those nutrients. Do not add the label on top of these figures, and do not treat the table’s zero as the fortified drink.

**Salt.** Low salt is the smaller figure. Standard salt is the larger one. Canned chickpeas keep the ordinary drained sodium in the table. They are not forced “no salt added”.

**Left out of the cooking.** Onion bulbs, garlic bulbs, onion and garlic powders, inulin, chili heat, black pepper, vinegar, honey, silken tofu. That is a flavour choice for this draft. It is not a histamine rule, a salicylate rule, or a gluten-free claim. Oats are not called gluten-free. A complete soy-free week is **not provided**. The 42 g chickpea serve and the 20 g dry lentil serve cannot carry a day’s protein, and they were not increased to pretend they can.

**Leftovers.** Cool food within 1–2 hours and refrigerate at 0–5°C. Eat it the next day. Rice: cool within 1 hour, eat within 24 hours, reheat only once until steaming hot. Sources, read 8 November 2026: [NHS](https://www.nhs.uk/baby/weaning-and-feeding/childrens-food-safety-and-hygiene/), [Food Standards Agency on rice](https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker), [chilling leftovers](https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely).

## The week

| Day | Breakfast | Drink | Lunch | Dinner | Side | Snack |
| --- | --- | --- | --- | --- | --- | --- |
`
for (const d of days) {
  md += `| ${d.day} | ${byId[d.breakfast].title} | ${byId[d.drink].title} | ${byId[d.lunch].title} | ${byId[d.dinner].title} | ${byId[d.side].title} | ${byId[d.snack].title} |\n`
}

md += `
The numbers are the full day at low salt: breakfast, drink, lunch, dinner, side and snack.

| Day | kcal | protein g | fibre g | calcium mg | iron mg | ALA g | sodium mg, low salt | sodium mg, standard salt |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
`
for (const d of days) {
  const c = d.fullLow.core
  const s = d.fullStandard.core
  md += `| ${d.day} | ${Math.round(c.kcal)} | ${c.protein} | ${c.fiber} | ${d.fullLow.micros.calcium} | ${d.fullLow.micros.iron} | ${d.fullLow.micros.omega3} | ${Math.round(c.sodium)} | ${Math.round(s.sodium)} |\n`
}

md += `
Vitamin B12 in these totals is ${days[0].fullLow.micros.vitaminB12} µg and vitamin D is ${days[0].fullLow.micros.vitaminD} µg, because the micronutrient rows for these foods store 0. That is a sourced zero for the unfortified foods in the table. It is not a measurement of a fortified carton, and it is not “adequate”. Iodine is absent from the micronutrient file, so there is no iodine number, not a zero. ALA is the omega-3 column that does exist. The day sums are whatever those rows add up to, mostly tofu and olive oil in this table. That is ALA on paper, not EPA or DHA, and not a laboratory test of the cooked plates. Fibre is at or above 30 g on these days. Iron is above the men’s 9 mg display figure and, on these totals, also above 15 mg. That still depends on the table’s iron values, not on a blood test. Calcium is high only if the tofu really is the calcium-set row.

Calcium on tofu days assumes calcium-set tofu. Treat a high calcium total as conditional on that, not as proof the brand in your hand matches the row.

Ingredients with no micronutrient row, omitted rather than zeroed: ${[...new Set(cooked.flatMap(r => r.nutritionLowSalt.microsMissingIds))].join(', ') || 'none'}.

## Recipes

All draft. \`eligible_for_trial_menu\` is false. \`low_fodmap_status\` is null.

`
for (const r of cooked) {
  const low = r.nutritionLowSalt
  const std = r.nutritionStandardSalt
  md += `### ${r.id} — ${r.title}

${r.flavour} ${r.meal}. ${r.servings} serving${r.servings > 1 ? 's' : ''}. Prep about ${r.time.prepMin} min, cook about ${r.time.cookMin} min${r.time.tempC ? `, oven ${r.time.tempC}°C` : ''}.

**Each serving, low salt:** ${n(r, 'kcal')} kcal, ${n(r, 'protein')} g protein, ${n(r, 'fiber')} g fibre, ${low.micros.calcium} mg calcium from mapped rows, ${low.micros.iron} mg iron, ${n(r, 'sodium')} mg sodium${std ? `, ${n(r, 'sodium', 'standard')} mg sodium at standard salt` : ''}.

**Ingredients, per serving**

${fmtIng(r)}

**Method**

${r.method.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Yield.** ${r.yield}

**Evidence note.** ${r.evidence}

`
  if (low.problems.length) md += `Nutrition rows skipped: ${low.problems.join('; ')}.\n\n`
  if (low.microsMissingIds.length) md += `No micronutrient row (not counted as zero): ${low.microsMissingIds.join(', ')}.\n\n`
}

md += `## Still not a finished clinical plan

- No whole plate has been reviewed. Public notes are not approval.
- Brands are unnamed. Tofu calcium, chickpea sodium, oat gluten contact and any fortification in a soy drink have to be read off the packet you buy.
- A soy-free week that still reaches the protein figure is not in this menu.
- B12, vitamin D and iodine are not covered. ALA is covered only in the small amount the oils and seeds actually contain.
- Cooked weights are still unmeasured.
- Do not copy this file into the app’s production FODMAP dataset.
`

fs.writeFileSync(path.join(DIR, 'MENU.md'), md)
fs.writeFileSync(path.join(DIR, 'menu.html'), htmlDoc(md))
fs.mkdirSync('/opt/cursor/artifacts', { recursive: true })
fs.writeFileSync('/opt/cursor/artifacts/fredheim-draft-week-menu.html', htmlDoc(md))
fs.writeFileSync('/opt/cursor/artifacts/fredheim-draft-week-menu.md', md)

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function inline(s) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}
function htmlDoc(markdown) {
  const lines = markdown.split('\n')
  let body = ''
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!/^\|\s*-+/.test(lines[i])) rows.push(lines[i])
        i++
      }
      body += '<table>'
      rows.forEach((rowLine, idx) => {
        const cells = rowLine.split('|').slice(1, -1).map(c => c.trim())
        const tag = idx === 0 ? 'th' : 'td'
        body += '<tr>' + cells.map(c => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>'
      })
      body += '</table>'
      continue
    }
    if (line.startsWith('### ')) { body += `<h3>${inline(line.slice(4))}</h3>`; i++; continue }
    if (line.startsWith('## ')) { body += `<h2>${inline(line.slice(3))}</h2>`; i++; continue }
    if (line.startsWith('# ')) { body += `<h1>${inline(line.slice(2))}</h1>`; i++; continue }
    if (line.startsWith('- ')) {
      body += '<ul>'
      while (i < lines.length && lines[i].startsWith('- ')) { body += `<li>${inline(lines[i].slice(2))}</li>`; i++ }
      body += '</ul>'
      continue
    }
    if (/^\d+\. /.test(line)) {
      body += '<ol>'
      while (i < lines.length && /^\d+\. /.test(lines[i])) { body += `<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`; i++ }
      body += '</ol>'
      continue
    }
    if (line.trim() === '') { i++; continue }
    body += `<p>${inline(line)}</p>`
    i++
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fredheim draft week — not a therapeutic menu</title>
<style>
  body { font-family: Georgia, "Iowan Old Style", serif; line-height: 1.5; max-width: 46rem; margin: 2rem auto; padding: 0 1.25rem 4rem; color: #1c1917; background: #fffaf3; }
  h1 { font-size: 1.8rem; line-height: 1.2; }
  h2 { margin-top: 2.2rem; font-size: 1.3rem; }
  h3 { margin-top: 1.6rem; font-size: 1.1rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.92rem; margin: 1rem 0 1.4rem; }
  th, td { border: 1px solid #d6d3d1; padding: 0.35rem 0.45rem; text-align: left; vertical-align: top; }
  th { background: #f5f0e8; }
  code { font-family: ui-monospace, monospace; font-size: 0.9em; }
  a { color: #9a3412; }
  .banner { background: #fff7ed; border: 1px solid #fdba74; padding: 0.8rem 1rem; border-radius: 8px; }
</style>
</head>
<body>
<p class="banner"><strong>Draft for cooking, not a treatment.</strong> The day totals include the drink, the side and the snack. Nothing here is an approved low-FODMAP menu.</p>
${body}
</body>
</html>
`
}

console.log('recipes', cooked.length)
for (const r of cooked) console.log(r.id, n(r, 'kcal'), 'kcal', n(r, 'protein'), 'protein', r.nutritionLowSalt.problems.join(';') || 'ok', r.nutritionLowSalt.microsMissingIds.join(',') || '')
console.log('--- full days ---')
for (const d of days) {
  const c = d.fullLow.core
  console.log(d.day, Math.round(c.kcal), 'kcal', c.protein, 'protein', c.fiber, 'fibre', d.fullLow.micros.calcium, 'Ca', d.fullLow.micros.iron, 'Fe', d.fullLow.micros.omega3, 'ALA', Math.round(c.sodium), 'Na', 'std', Math.round(d.fullStandard.core.sodium))
}

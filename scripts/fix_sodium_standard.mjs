import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { standardSodium } from './lib/saltLevels.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK_FILE = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK_FILE, 'utf8'))

for (const id of ['mushroom-stroganoff', 'moroccan-chickpea-tagine', 'chana-masala']) {
  const r = pack.recipes.find(x => x.id === id)
  const calc = standardSodium(r)
  const old = r.nutrition.sodiumStandard
  r.nutrition.sodiumStandard = calc
  console.log(id, old, '->', calc, 'low', r.nutrition.perServing.sodium)
}
fs.writeFileSync(PACK_FILE, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('updated sodiumStandard; version still', pack.version)

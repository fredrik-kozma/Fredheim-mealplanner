import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { analyzeRecipe } from './lib/recipeLabels.mjs'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pack = JSON.parse(fs.readFileSync(path.join(ROOT,'recipe-packs-template/packs/fredheim-recipes-with-pictures.json'),'utf8'))
const byId = new Map(pack.recipes.map(r=>[r.id,r]))
for (const id of ['chili-sin-carne','moroccan-chickpea-tagine','thai-red-curry','vegetarian-lapskaus']) {
  const a = analyzeRecipe(byId.get(id), byId, {storedMealTypes:true})
  console.log(id, 'batch pass?', a.labels['batch-friendly'].pass, '|', a.labels['batch-friendly'].why)
}
const micro = fs.readFileSync(path.join(ROOT,'scripts/lib/micronutrients.mjs'),'utf8')
for (const id of ['170417','173755','170924','174278']) console.log('FDC', id, micro.includes(id))
console.log('version', pack.version)

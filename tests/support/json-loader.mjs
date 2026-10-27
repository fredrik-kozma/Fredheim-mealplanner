// Lets the tests import src/ modules that `import x from './file.json'` the
// way Vite does. Node itself insists on `with { type: 'json' }`, which the
// app code can't use without breaking older browsers in dev, so for tests
// only a .json import is handed over as a plain module.
//
// Loaded with: node --import ./tests/support/json-loader.mjs --test ...
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && url.endsWith('.json')) {
      return {
        format: 'module',
        source: `export default ${readFileSync(fileURLToPath(url), 'utf8')}`,
        shortCircuit: true,
      }
    }
    return nextLoad(url, context)
  },
})

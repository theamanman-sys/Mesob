import { createRequire } from 'module'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const require_ = createRequire(import.meta.url)
const handler   = require_(join(__dirname, 'citizens', 'index.cjs'))

export default handler

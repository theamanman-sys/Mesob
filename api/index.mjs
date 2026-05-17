/**
 * api/index.mjs  — Vercel auto-detectable ESM serverless function entry point
 *
 * Serves as a catch-all /api/* fallback for the serverless function detector.
 * All /api/* routes internally delegate to citizens/index.cjs which owns the
 * full handler logic (register, login, google-auth, session, etc.).
 * The `new URL(req.url, ...)` base lets Vercel strip the /api prefix correctly.
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// Load the CJS handler, capturing the entire module.exports value.
const cjsPath  = join(__dirname, 'citizens', 'index.cjs')
const { default: handler } = await import('file://' + cjsPath)

export default handler

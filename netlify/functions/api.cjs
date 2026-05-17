const serverless = require('serverless-http')
const mockApp = require('../../mock/server.cjs')

const handler = serverless(mockApp)

const PREFIXES = ['/.netlify/functions/api', '/api']

exports.handler = async (event, context) => {
  let requestPath = event.path
  for (const prefix of PREFIXES) {
    if (requestPath.startsWith(prefix)) {
      requestPath = requestPath.slice(prefix.length) || '/'
      break
    }
  }
  event.path = requestPath
  return handler(event, context)
}

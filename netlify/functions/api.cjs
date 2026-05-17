const path = require('path')
const fs = require('fs')
const express = require('express')
const serverless = require('serverless-http')

// Load mock server app
const mockApp = require('../../mock/server.cjs')

const app = express()

// Mount mock app at /api so path stripping works
app.use('/api', mockApp)

// Also mount at root for direct function calls
app.use('/', mockApp)

exports.handler = serverless(app, {
  requestPath: '/.netlify/functions/api'
})

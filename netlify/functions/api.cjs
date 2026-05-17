const express = require('express')
const serverless = require('serverless-http')
const mockApp = require('../../mock/server.cjs')

const app = express()
app.use('/api', mockApp)

exports.handler = serverless(app)

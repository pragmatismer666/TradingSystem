const express = require('express')
const bodyParser = require('body-parser')
const { init } = require('./db')
const routes = require('./routes')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json())
app.use(routes)

init().then(() => {
  console.log('starting server on port 5000')
  app.listen(5000)
})

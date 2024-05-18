const express = require('express')
require('dotenv').config()

// LLamar clave
const TOKEN_KEY = process.env.KEY_TOKEN;

const app = express()

app.listen(3000, console.log('Servidor 3000 conectado'))
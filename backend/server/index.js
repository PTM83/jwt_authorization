const express = require('express')
const cors = require('cors')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

require('dotenv').config()

// Call data base
const { pool } = require('../database/index.js');

// LLamar clave
const TOKEN_KEY = process.env.KEY_TOKEN;

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
// Middelware Function
const verifyToken = (req, res, next) => {
    const authorizationHeaders = req.headers.authorization;

    if (!authorizationHeaders) {
        return res.status(404).json({message: "Token no encontrado"})
    }

    const [bearer, token] = authorizationHeaders.split(" ");

    if (bearer !== 'Bearer' || !token) {
        return res.status(404).json({message: "Token y String no es válido"})
    }

    try {
        jwt.verify(token, TOKEN_KEY) && next()
    } catch (error) {
        res.status(404).json({message: " Token incorrecto!!!"})   
    }
}

// Generar 3 rutas

app.post('/usuarios', async (req,res) => {
    try {
        const { email, password, rol, lenguage } = req.body;
        // Codificar el Password
        const codif_password = bcryptjs.hashSync(password);
        // Crear query
        const query = "INSERT INTO usuarios (id, email, password, rol, lenguage) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *;"
        
        const values = [email, codif_password, rol, lenguage]
        const {rows: data} = await pool.query(query, values);
        
        res.status(201).json({
            id: data[0].id,
            email: data[0].email
        });
        
    } catch (error) {
        res.status(500).json({message: "Internal server error"})
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const query = "SELECT * FROM usuarios WHERE email = $1;"
        const values = [email]

        const {rows: data} = await pool.query(query, values);

        if (!data.length){
            return res.status(404).json({
                message: "Usuario no encontrado", 
                code: 404
            })
        }

        const user = data[0]
        const verifyUser = bcryptjs.compareSync(password, user.password)

        if (!verifyUser) {
            return res.status(401).json({
                message: "Credenciales no encontradas",
                code: 401
            })
        }

        // Crear Token Para enviar al Ususario
        // NUNCA PASAR EL PASSWORD EN EL JWT
        const token = jwt.sign(
            {
                email: user.email,
                rol: user.rol,
                lenguage: user.lenguage
            }, 
            TOKEN_KEY
        // {expiresIn: 60}
        )

        res.status(200).json({message: "token", token})

    } catch (error) {
        res.status(500).json({message: "internal server error", error})
    }
})

app.get('/usuarios', verifyToken ,async (req, res) => {
    // console.log("Ingreso exitoso")
    try {
        const [bearer, token] = req.headers.authorization.split(" ")
        
        const query = "SELECT * FROM usuarios WHERE email = $1;"
        // Se obtiene el email del TOKEN
        const { email } = jwt.verify(token,TOKEN_KEY)
        
        // res.send(email)

        const {rows:data} = await pool.query(query,[email])

        const user = data[0]

        if (!user) {
            return res.status(404).
                    json(
                        {
                            message: " usuario no encontrado", 
                            code: 404
                        })
        }

        res.status(200).json([user])

    } catch (error) {
        res.status(500).json({message: "internal server error", error})
    }
})

app.listen(3000, console.log('Servidor 3000 conectado'))
// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
require('dotenv/config');
const api = process.env.API_URL;
const MongoDBCOnnectionString = process.env.CONNECTION_STRING;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:4000"
    }, //specific origin you want to give access to,
});
//const io = socketIo(server);
const morgan = require('morgan');
//const io = require("socket.io")();

const cors = require('cors');
const PORT = process.env.PORT;

// MongoDB connection

const db = mongoose.connection;
app.use(morgan('tiny')); // log les reponses du serveur
app.use(cors());
app.options('*', cors());
const chatSocket = require('./sockets/chatSocket')(io, db);
// Middleware
app.use(express.json());
app.use((req, res, next) => {
    req.io = io; // Make io accessible in your route handlers
    next();
});
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use(`${api}/auth`, authRoutes);
app.use(`${api}/chat`, chatRoutes);

mongoose.connect(MongoDBCOnnectionString, { useNewUrlParser: true, })
    .then(result => {
        console.log('----------------- succefuly connected to db')
        server.listen(PORT, () => {
            console.log('====================================');
            console.log("Server is listeneing on port " + PORT);
            console.log('====================================');
        })
        io.listen(5000);
    })
    .catch(err => {
        console.log('We have somme error ' + err)
    });
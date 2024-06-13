const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/rota', (req, res) => {
    const { start, end } = req.query;
    const query = `
        SELECT name, lastName, day, startTime, endTime, designation 
        FROM rota 
        WHERE day BETWEEN ? AND ?`; // Updated SQL query with date range filter

    pool.query(query, [start, end], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/UserCRota.html');
});
module.exports = app; // Export the entire Express application


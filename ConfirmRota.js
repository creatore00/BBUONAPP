const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool
const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route to retrieve data from the "rota" table
// API endpoint to get rota data for a specific day
app.get('/api/rota', (req, res) => {
    const day = req.query.day;
    if (!day) {
        return res.status(400).json({ error: 'Day is required' });
    }
    const query = 'SELECT name, lastName, wage, day, designation, startTime, endTime FROM rota WHERE day = ?';
    pool.query(query, [day], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
  });

  app.post('/confirm-rota', (req, res) => {
    const rotaData = req.body;
    console.log('Received rota data:', rotaData);

    if (!rotaData || !Array.isArray(rotaData) || rotaData.length === 0) {
        return res.status(400).send('Invalid rota data.');
    }

    const insertQuery = `
        INSERT INTO ConfirmedRota (name, lastName, wage, day, startTime, endTime, designation) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        rotaData.forEach(entry => {
            const { name, lastName, wage, day, startTime, endTime, designation } = entry;
            pool.query(insertQuery, [name, lastName, wage, day, startTime, endTime, designation], (err, result) => {
                if (err) {
                    console.error('Error inserting rota data:', err);
                    return res.status(500).send('Internal Server Error');
                }
            });
        });

        res.status(200).send('Rota confirmed successfully.');
    } catch (error) {
        console.error('Error processing rota data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/ConfirmRota.html');
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

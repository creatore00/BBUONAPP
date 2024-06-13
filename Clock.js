const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool
const { format } = require('date-fns');

const app = express();

// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/clockin', (req, res) => {
    const { id } = req.body;
    const now = new Date();
    const formattedDateTime = format(now, 'yyyy-MM-dd HH:mm:ss');

    pool.query(
        'INSERT INTO rota (employeeID, startTime) VALUES (?, ?) ON DUPLICATE KEY UPDATE startTime = ?',
        [id, formattedDateTime, formattedDateTime],
        (err, results) => {
            if (err) {
                console.error('Error inserting/updating clock in time:', err);
                res.status(500).json({ message: 'Error clocking in' });
                return;
            }
            res.status(200).json({ message: 'Clocked in successfully' });
        }
    );
});

app.post('/api/clockout', (req, res) => {
    const { id } = req.body;
    const now = new Date();
    const formattedDateTime = format(now, 'yyyy-MM-dd HH:mm:ss');

    pool.query(
        'UPDATE rota SET endTime = ? WHERE employeeID = ?',
        [formattedDateTime, id],
        (err, results) => {
            if (err) {
                console.error('Error updating clock out time:', err);
                res.status(500).json({ message: 'Error clocking out' });
                return;
            }
            res.status(200).json({ message: 'Clocked out successfully' });
        }
    );
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Clock.html');
  });
  module.exports = app; // Export the entire Express application

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const server = require('./server.js');
const pool = require('./db.js'); // Import the connection pool
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route to get all holiday requests
app.get('/holidays', (req, res) => {
    // Query the database to get holiday requests
    pool.query('SELECT * FROM Holiday WHERE accepted = "Accepted"', (err, results) => {
        if (err) {
            console.error('Error fetching holiday requests:', err);
            res.status(500).send('Error fetching holiday requests');
        } else {
            res.json(results); // Send holiday requests as JSON response
        }
    });
});

app.get('/', isAuthenticated, isAdmin, isSupervisor, isUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'UserHolidays.html'));
});
module.exports = app; // Export the entire Express application

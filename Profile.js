const server = require('./server.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool
const path = require('path');


const app = express();

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Fetch user profile data
app.get('/api/profile', (req, res) => {
    const email = req.query.email;

    pool.query('SELECT * FROM Employees WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        res.json(results[0]);
    });
});
// Update user password
app.post('/api/update-password', (req, res) => {
    const { email, newPassword } = req.body;

    pool.query('UPDATE Users SET password = ? WHERE email = ?', [newPassword, email], (err, results) => {
        if (err) {
            return res.status(500).send('Server error');
        }

        res.send('Password updated successfully');
    });
});
// Serve the profile page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Profile.html'));
});


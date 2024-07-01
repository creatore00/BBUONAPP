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
// Route to get all holiday requests for the logged-in user
app.get('/holidays', (req, res) => {
    // Get the email from the session
    const email = req.session.email;
    if (!email) {
        return res.status(401).send('Unauthorized: No session found');
    }
    // Query the database to get holiday requests for the logged-in user
    const sql = 'SELECT * FROM Holiday WHERE accepted = "Accepted" AND email = ?';
    pool.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching holiday requests:', err);
            res.status(500).send('Error fetching holiday requests');
        } else {
            res.json(results); // Send holiday requests as JSON response
        }
    });
});
app.get('/', isAuthenticated, (req, res) => {
    if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, '/UserHolidays.html'));
    } else if (req.session.user.role === 'supervisor') {
        res.sendFile(path.join(__dirname, '/UserHolidays.html'));
    } else if (req.session.user.role === 'user') {
        res.sendFile(path.join(__dirname, '/UserHolidays.html'));
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});
module.exports = app; // Export the entire Express application

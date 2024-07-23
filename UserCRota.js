const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
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
app.get('/', isAuthenticated, (req, res) => {
    if (req.session.user.role === 'supervisor') {
        res.sendFile(path.join(__dirname, 'UserCRota.html'));
    } else if (req.session.user.role === 'user') {
        res.sendFile(path.join(__dirname, 'UserCRota.html'));
    } else if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'UserCRota.html'));
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

module.exports = app; // Export the entire Express application


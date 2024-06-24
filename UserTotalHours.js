const server = require('./server.js');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/rota', (req, res) => {
    const startDate = req.query.startDate;
    if (!startDate) {
        return res.status(400).json({ success: false, message: 'Start date is required' });
    }

    const query = `
    SELECT 
    name,
    lastName, 
    DATE_FORMAT(STR_TO_DATE(day, '%d/%m/%Y'), '%d/%m/%Y') as day, 
    startTime, 
    endTime,
    wage,
    designation
FROM 
    rota
WHERE 
    STR_TO_DATE(day, '%d/%m/%Y') BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)

`;

    pool.query(query, [startDate, startDate], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});
app.get('/', isAuthenticated, (req, res) => {
    if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'UserTotalHours.html'));
    } else if (req.session.user.role === 'supervisor') {
        res.sendFile(path.join(__dirname, 'UserTotalHours.html'));
    } else if (req.session.user.role === 'user') {
        res.sendFile(path.join(__dirname, 'UserTotalHours.html'));
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

module.exports = app; // Export the entire Express application


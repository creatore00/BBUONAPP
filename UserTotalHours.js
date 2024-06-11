const server = require('./server.js');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool
const port = process.env.PORT || 3010;
const app = express();

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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/UserTotalHours.html');
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

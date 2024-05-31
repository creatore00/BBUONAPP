const confirmpassword = require('./ConfirmPassword.js'); 
const token = require('./Token.js');
const generate = require('./Generate.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const server = require('./server.js');
const rota = require('./Rota.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');


const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a connection to the database
const connection = mysql.createConnection({
    host: 'sql8.freesqldatabase.com',
    user: 'sql8710584',
    password: 'UwY6kriwlL',
    database: 'sql8710584',
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database');
});

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
    wage
FROM 
    rota
WHERE 
    STR_TO_DATE(day, '%d/%m/%Y') BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)

`;


    connection.query(query, [startDate, startDate], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Hours.html');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
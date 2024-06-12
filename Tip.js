const server = require('./server.js');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool


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
        endTime
    FROM 
        ConfirmedRota
    WHERE 
        STR_TO_DATE(day, '%d/%m/%Y') = STR_TO_DATE(?, '%Y-%m-%d')
    `;

    pool.query(query, [startDate], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});

app.post('/submitPayslips', (req, res) => {
    const payslipData = req.body;
  
    const insertQuery = `
      INSERT INTO tip (name, lastName, totalHours, tip, day)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    payslipData.forEach((entry, index) => {
      pool.query(insertQuery, [entry.firstName, entry.lastName, entry.totalHours, entry.tip, entry.monthStart], (err) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).send('Error inserting data');
        }
  
        if (index === payslipData.length - 1) {
          console.log('Data processed and saved to payslips table successfully');
          res.status(200).send('Data processed and saved to payslips table successfully');
        }
      });
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Tip.html');
});


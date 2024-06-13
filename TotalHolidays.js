const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const pdf = require('html-pdf');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/rota', (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Both start date and end date are required' });
    }

    const query = `
    SELECT 
        name,
        lastName,
        wage,
        STR_TO_DATE(day, '%d/%m/%Y (%W)') as day, 
        startTime, 
        endTime
    FROM 
        rota
    WHERE 
        STR_TO_DATE(day, '%d/%m/%Y (%W)') >= ? AND STR_TO_DATE(day, '%d/%m/%Y (%W)') <= ?
    `;

    pool.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error fetching rota data:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json(results);
    });
});

app.get('/holiday', (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Both start date and end date are required' });
    }

    const query = `
    SELECT 
        name,
        lastName, 
        startDate, 
        endDate
    FROM 
        Holiday
    WHERE 
        startDate >= ? AND endDate <= ? AND accepted = 'Accepted'
    `;

    pool.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error fetching holiday data:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json(results);
    });
});



app.post('/submitHoliday', (req, res) => {
    const payslipData = req.body;
  
    const insertQuery = `
      INSERT INTO HolidayReport (name, lastName, wage, designation, totalHours, costDay, totalDays, Total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
app.post('/generate-pdf', (req, res) => {
    const html = req.body.html;
    const options = { format: 'Letter' };

    pdf.create(html, options).toFile('./temp/pdf.pdf', (err, result) => {
        if (err) return console.log(err);
        res.sendFile(`${__dirname}/temp/pdf.pdf`);
    });
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/TotalHolidays.html');
});
module.exports = app; // Export the entire Express application


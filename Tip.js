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
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor } = require('./sessionConfig'); // Adjust the path as needed
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

  const checkQuery = 'SELECT COUNT(*) AS count FROM tip WHERE day = ?';
  const insertQuery = `
    INSERT INTO tip (name, lastName, totalHours, tip, day)
    VALUES (?, ?, ?, ?, ?)
  `;

  let duplicateFound = false;

  payslipData.forEach((entry, index) => {
      // Check for existing data for the day
      pool.query(checkQuery, [entry.monthStart], (err, results) => {
          if (err) {
              console.error('Error checking for existing data:', err);
              return res.status(500).send('Error checking for existing data');
          }

          if (results[0].count > 0) {
              // If data for the day already exists, send a response and set duplicateFound to true
              duplicateFound = true;
              if (index === payslipData.length - 1) {
                  return res.status(409).send(`Tip for the day ${entry.monthStart} has already been inserted`);
              }
          } else {
              // If no duplicate found, proceed with insertion
              if (!duplicateFound) {
                  pool.query(insertQuery, [entry.firstName, entry.lastName, entry.totalHours, entry.tip, entry.monthStart], (err) => {
                      if (err) {
                          console.error('Error inserting data:', err);
                          return res.status(500).send('Error inserting data');
                      }

                      if (index === payslipData.length - 1) {
                          console.log('Data processed and saved successfully');
                          res.status(200).send('Data processed and saved successfully');
                      }
                  });
              }
          }
      });
  });
});
app.get('/existing', (req, res) => {
    const date = req.query.date;
    if (!date) {
        return res.status(400).send('Date is required');
    }
    
    const query = `
        SELECT CONCAT(name, ' ', lastName) AS name, 
               CAST(tip AS DECIMAL(10,2)) AS tip, 
               totalHours
        FROM tip
        WHERE day = ?
    `;
    
    pool.query(query, [date], (err, results) => {
        if (err) {
            console.error('Error fetching existing tips:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});
app.get('/', isAuthenticated, (req, res) => {
  if (req.session.user.role === 'admin') {
      res.sendFile(path.join(__dirname, 'Tip.html'));
  } else if (req.session.user.role === 'supervisor') {
      res.sendFile(path.join(__dirname, 'Tip.html'));
  } else {
      res.status(403).json({ error: 'Access denied' });
  }
});
module.exports = app; // Export the entire Express application


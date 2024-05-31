// Import required modules
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const confirmpassword = require('./ConfirmPassword.js'); 
const token = require('./Token.js');
const server = require('./server.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const crota = require('./CRota.js');
const hours = require('./Hours.js');
const rota = require('./Rota.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const http = require('http');
// Create Express app
const app = express();


// Create a connection to the database
const connection = mysql.createConnection({
    host: 'sql8.freesqldatabase.com',
    user: 'sql8710584',
    password: 'UwY6kriwlL',
    database: 'sql8710584',
  });
  connection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
      }
      console.log('Connected to the database');
  });

  // Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/submitHolidayRequest', (req, res) => {
    const { name, lastName, email, startDate, endDate, startTime, endTime } = req.body;

    // Validate request dates and times here if needed
    const today = new Date();
    const fourteenDaysLater = new Date();
    fourteenDaysLater.setDate(today.getDate() + 14);
    const maxEndDate = new Date(fourteenDaysLater);
    maxEndDate.setDate(maxEndDate.getDate() + 14);

    if (new Date(startDate) < fourteenDaysLater) {
        res.json({ success: false, message: 'Holiday requests must be made at least 14 days in advance.' });
        return;
    }

    if (new Date(endDate) > maxEndDate) {
        res.json({ success: false, message: 'Holiday requests can be for a maximum of two consecutive weeks.' });
        return;
    }

    const query = `
        INSERT INTO Holiday (name, lastName, email, startDate, endDate, startTime, endTime)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(query, [name, lastName, email, startDate, endDate, startTime, endTime], (err, result) => {
        if (err) {
            console.error('Error inserting data into Holiday table: ' + err.stack);
            res.json({ success: false, message: 'Error submitting holiday request.' });
            return;
        }
        res.json({ success: true, message: 'Holiday request submitted successfully!' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/UserHolidays.html');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
  exports.handler = app; // Export for deployment on GCP
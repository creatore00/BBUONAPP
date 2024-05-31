const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const confirmpassword = require('./ConfirmPassword.js'); 
const token = require('./Token.js');
const generate = require('./Generate.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const rota = require('./Rota.js');
const server = require('./server.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const hours = require('./Hours.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5005;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'Yassir.nini27@gmail.com',
        pass: 'oxih iwuk crfq ghjk'
      }
});

// Function to get all email addresses from the Employees table
function getAllEmails(callback) {
    const query = 'SELECT email FROM Employees';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching emails:', err);
            callback(err, null);
            return;
        }

        const emails = results.map(row => row.email);
        callback(null, emails);
    });
}

// Function to send email notification to all employees
function sendEmailNotification() {
    getAllEmails((err, emails) => {
        if (err) {
            console.error('Failed to retrieve emails');
            return;
        }

        const mailOptions = {
            from: 'Yassir.nini27@gmail.com',
            to: emails.join(','),
            subject: 'Rota Updated',
            text: 'The work hours table has been updated.'
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    });
}

// Endpoint to handle deleting a selected time from the database
app.post('/deleteTime', (req, res) => {
    const { id } = req.body;
    const query = 'DELETE FROM rota WHERE id = ?';

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting time entry:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json({ success: true, message: 'Time entry deleted successfully' });
    });
});

app.get('/rota', (req, res) => {
    const query = 'SELECT name, lastName, day, startTime, endTime FROM rota'; // Fixed SQL query

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }

        // Modify each result to extract the day from the format '29/05/2024 (Wednesday)'
        const formattedResults = results.map(result => {
            const dayMatch = result.day.match(/\(([^)]+)\)/);
            if (dayMatch) {
                result.day = dayMatch[1]; // Extract the day inside the parentheses
            }
            return result;
        });

        res.json(formattedResults);
    });
});

app.post('/updateRota', (req, res) => {
    // Logic for updating the rota (not shown in original code)
    // After updating the rota, send an email notification
    sendEmailNotification();
    res.json({ success: true, message: 'Rota updated successfully and email sent' });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/CRota.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
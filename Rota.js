const confirmpassword = require('./ConfirmPassword.js');
const token = require('./Token.js');
const generate = require('./Generate.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const server = require('./server.js');
const crota = require('./CRota.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const hours = require('./Hours.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5008;

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Function to generate a unique 16-digit ID
function generateUniqueId() {
    return Math.floor(Math.random() * 1e16).toString().padStart(16, '0');
}

// Function to send email
function sendEmail(recipients) {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'Yassir.nini27@gmail.com',
            pass: 'oxih iwuk crfq ghjk'
        }
    });

    // Setup email data
    const mailOptions = {
        from: 'Yassir.nini27@gmail.com',
        to: recipients.join(','), // Convert array of emails to comma-separated string
        subject: 'Rota Updated',
        text: 'The rota has been updated successfully.'
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

// Route to handle saving table data
app.post('/', (req, res) => {
    console.log('Request Body:', req.body);
    const tableData = req.body;
    const insertQuery = 'INSERT INTO rota (id, name, lastName, wage, day, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const updateQuery = 'UPDATE rota SET name = ?, lastName = ?, wage = ?, day = ?, startTime = ?, endTime = ? WHERE id = ?';

    // Insert or update each row in the main database
    tableData.forEach(row => {
        let uniqueId = generateUniqueId(); // Generate unique ID for each row

        connection.query('SELECT id FROM rota WHERE id = ?', [uniqueId], (checkErr, checkResult) => {
            if (checkErr) {
                console.error('Error checking data in the main database:', checkErr);
                return res.status(500).send('Error saving data');
            }

            if (checkResult.length > 0) {
                // If the record with the unique ID exists, update it
                connection.query(updateQuery, [row.name, row.lastName, row.wage, row.day, row.startTime, row.endTime, uniqueId], (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Error updating data in the main database:', updateErr);
                        return res.status(500).send('Error saving data');
                    }
                });
            } else {
                // If the record with the unique ID does not exist, insert a new record
                connection.query(insertQuery, [uniqueId, row.name, row.lastName, row.wage, row.day, row.startTime, row.endTime], (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error('Error inserting data into the main database:', insertErr);
                        return res.status(500).send('Error saving data');
                    }
                });
            }
        });
    });

    // Get email addresses from the database
    connection.query('SELECT email FROM Employees', (emailErr, emailResults) => {
        if (emailErr) {
            console.error('Error fetching emails from the database:', emailErr);
            return res.status(500).send('Error sending emails');
        }

        const recipients = emailResults.map(row => row.email);

        // Send email to recipients
        sendEmail(recipients);
    });
});
// Route to handle fetching employee data and rendering the HTML page
// Route to handle fetching employee data
app.get('/employees', (req, res) => {
    connection.query('SELECT name, lastName, wage FROM Employees', (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).send('Error fetching employee data');
        }
        const employees = results.map(row => ({
            name: row.name,
            lastName: row.lastName,
            wage: row.wage
        }));
        res.json(employees);
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Rota.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

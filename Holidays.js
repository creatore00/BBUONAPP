// Import required modules
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const server = require('./server.js');
const http = require('http');
const pool = require('./db.js'); // Import the connection pool

// Create Express app
const app = express();


  // Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    const query = 'SELECT email FROM users WHERE Access = "admin" ';

    pool.query(query, (err, results) => {
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
            subject: 'New Request',
            text: 'Please visit Requests Page, You have new Requests needing your Action'
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
app.post('/submitHolidayRequest', (req, res) => {
    const { name, lastName, email, startDate, endDate, startTime, endTime } = req.body;
    const today = new Date();
    const fourteenDaysLater = new Date();
    fourteenDaysLater.setDate(today.getDate() + 14);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const maxEndDate = new Date(start);
    maxEndDate.setDate(start.getDate() + 13);

    if (start < fourteenDaysLater) {
        return res.json({ success: false, message: 'Holiday requests must be made at least 14 days in advance.' });
    }

    if (end > maxEndDate) {
        return res.json({ success: false, message: 'Holiday requests can be for a maximum of two consecutive weeks.' });
    }

    const sql = 'INSERT INTO Holiday (name, lastName, email, startDate, endDate, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [name, lastName, email, startDate, endDate, startTime, endTime];

    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error('Error submitting holiday request:', error);
            return res.json({ success: false, message: 'Error submitting holiday request' });
        } else {
            console.log('Holiday request submitted successfully');
            return res.json({ success: true, message: 'Holiday request submitted successfully' });
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Holidays.html');
});

  exports.handler = app; // Export for deployment on GCP
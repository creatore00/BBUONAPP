const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const server = require('./server.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const pool = require('./db.js'); // Import the connection pool

const pdf = require('html-pdf');
const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to fetch all employees
app.get('/api/employees', (req, res) => {
    const query = 'SELECT name, lastName, email FROM Employees';
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching employees data:', err);
            res.status(500).json({ error: 'Database query error' });
            return;
        }
        res.json(results);
    });
});
// Multer configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Endpoint to handle payslip upload
app.post('/api/upload-payslip', upload.single('payslip'), (req, res) => {
    const { name, lastName, email } = req.body;
    const payslipFile = req.file;
    const uploadDate = new Date().toISOString().split('T')[0];

    if (!payslipFile) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Insert the payslip data into the payslips table
    const insertQuery = 'INSERT INTO payslips (name, lastName, email, fileContent, date) VALUES (?, ?, ?, ?, ?)';
    const values = [name, lastName, email, payslipFile.buffer, uploadDate];

    pool.query(insertQuery, values, (insertErr, insertResults) => {
        if (insertErr) {
            console.error('Error inserting payslip data:', insertErr);
            res.status(500).json({ error: 'Database insert error' });
            return;
        }
        res.json({ success: true, insertedId: insertResults.insertId });
    });
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/InsertPayslip.html');
  });
  module.exports = app; // Export the entire Express application

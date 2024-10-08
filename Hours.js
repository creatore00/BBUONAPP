const server = require('./server.js');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { PDFDocument, rgb } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const pool = require('./db.js'); // Import the connection pool
const pdf = require('html-pdf');
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Route to retrieve data from the "ConfirmedRota" table
app.get('/rota', (req, res) => {
    const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7); // Default to current month in YYYY-MM format

    const query = `
        SELECT 
            name,
            lastName,
            wage, 
            startTime, 
            endTime
        FROM 
            ConfirmedRota
        WHERE 
            DATE_FORMAT(STR_TO_DATE(day, '%d/%m/%Y'), '%Y-%m') = ?
    `;

    pool.query(query, [selectedMonth], (err, results) => {
        if (err) {
            console.error('Error fetching rota data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});
app.get('/tip', (req, res) => {
    const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7); // Default to current month
    const query = `
SELECT 
    name,
    lastName,
    tip
FROM 
    tip
WHERE
    DATE_FORMAT(day, '%Y-%m') = ?;

    `;
    pool.query(query, [selectedMonth], (err, results) => {
        if (err) {
            console.error('Error fetching tip data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});
// Route to generate the PDF dynamically
app.post('/generate-pdf', async (req, res) => {
    try {
        // Get the HTML content of the table from the request body
        const tableHTML = req.body.tableHTML;

        // Get the selected month
        const selectedMonth = req.body.selectedMonth;

        // Generate PDF from HTML
        pdf.create(tableHTML).toFile(`./Tips_${selectedMonth}.pdf`, (err, _) => {
            if (err) {
                console.error('Error generating PDF:', err);
                res.status(500).send('Error generating PDF');
            } else {
                console.log('PDF generated successfully');
                res.send('PDF generated successfully');
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Route to handle downloading the PDF file
app.get('/download-pdf', async (req, res) => {
    try {
        // Get the selected month
        const selectedMonth = req.query.selectedMonth;

        // Read the PDF file
        const pdfBuffer = fs.readFileSync(`./Tips_${selectedMonth}.pdf`);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Tips_${selectedMonth}.pdf"`);

        // Send the PDF file as response
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/Hours.html');
});
module.exports = app; // Export the entire Express application


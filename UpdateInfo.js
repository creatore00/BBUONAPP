const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const server = require('./server.js');
const pool = require('./db.js'); // Import the connection pool
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
    { name: 'passportImage', maxCount: 1 },
    { name: 'visa', maxCount: 1 }
]);
app.post('/', upload, (req, res) => {
    console.log('Request Body:', req.body);
    // Destructure fields from req.body
    const { name, lastName, email, phone, address, nin, wage, designation, holiday, dateStart } = req.body;
    const passportImageFile = req.files['passportImage'] ? req.files['passportImage'][0] : null;
    const visaFile = req.files['visa'] ? req.files['visa'][0] : null;

    // Check if required files were uploaded
    if (!passportImageFile || !visaFile) {
        return res.status(400).json({ success: false, message: 'Both passport image and visa files are required' });
    }

    // Extract file content (buffer) and MIME type
    const passportImageContent = passportImageFile.buffer;
    const visaContent = visaFile.buffer;

    // Insert data into the database
    const query = 'INSERT INTO Employees (name, lastName, email, phone, address, nin, wage, designation, passportImage, visa, TotalHoliday, startHoliday, dateStart) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    pool.query(query, [name, lastName, email, phone, address, nin, wage, designation, passportImageContent, visaContent, holiday, holiday, dateStart], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json({ success: true, message: 'Employee data successfully inserted' });
    });
});
app.get('/employees', (req, res) => {
    const query = 'SELECT * FROM Employees ORDER BY designation DESC, id ASC';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});
// Endpoint to download a specific passport file based on employee ID
app.get('/api/download-file/:id', (req, res) => {
    const { id } = req.params; // Extract employee ID from URL parameter

    const query = 'SELECT passportImage FROM Employees WHERE id = ?'; // SQL query to retrieve passportImage
    pool.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Database query error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Passport not found' });
            return;
        }
        const passportImage = results[0].passportImage; // Retrieve passportImage from query results

        // Set appropriate headers for file download
        res.setHeader('Content-Type', 'application/pdf'); // Set Content-Type as PDF
        res.setHeader('Content-Disposition', `attachment; filename=Passport_${id}.pdf`); // Set filename for download

        // Send the file content as response
        res.send(passportImage);
    });
});
// Endpoint to download a specific passport file based on employee ID
app.get('/api/download-visa/:id', (req, res) => {
    const { id } = req.params; // Extract employee ID from URL parameter

    const query = 'SELECT visa FROM Employees WHERE id = ?'; // SQL query to retrieve passportImage
    pool.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Database query error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Passport not found' });
            return;
        }
        const visa = results[0].visa; // Retrieve passportImage from query results

        // Set appropriate headers for file download
        res.setHeader('Content-Type', 'application/pdf'); // Set Content-Type as PDF
        res.setHeader('Content-Disposition', `attachment; filename=Passport_${id}.pdf`); // Set filename for download

        // Send the file content as response
        res.send(visa);
    });
});
// DELETE endpoint to remove an employee
app.delete('/employee/:id', (req, res) => {
    const { id } = req.params; 

    // First, get the passportImage filename to delete the file
    const getQuery = 'SELECT passportImage FROM Employees WHERE id = ?';
    pool.query(getQuery, [id], (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        // Delete the database record
        const deleteQuery = 'DELETE FROM Employees WHERE id = ?';
        pool.query(deleteQuery, [id], (err, result) => {
            if (err) {
                console.error('Error deleting employee:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }
                res.json({ success: true, message: 'Employee successfully deleted' });
        });
    });
});
app.get('/', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'PersonalInfo.html'));
});
module.exports = app; // Export the entire Express application

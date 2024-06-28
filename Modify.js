// Import required modules
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const server = require('./server.js');
const http = require('http');
const pool = require('./db.js'); // Import the connection pool
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser } = require('./sessionConfig'); // Adjust the path as needed
const app = express();
app.use(sessionMiddleware);
// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Parse JSON request bodies
// List of tables to exclude
const excludedTables = ['sessions', 'comments', 'Sessions', 'payslips', 'users', 'forecast', 'rota', 'Holiday'];
// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Retrieve the list of tables
app.get('/tables', (req, res) => {
    pool.query('SHOW TABLES', (err, tables) => {
        if (err) {
            console.error('Error retrieving tables: ' + err.stack);
            res.status(500).send('Error retrieving tables');
            return;
        }

        const tableNames = tables
            .map(tableObj => tableObj[`Tables_in_${pool.config.connectionConfig.database}`])
            .filter(tableName => !excludedTables.includes(tableName)); // Exclude specific tables

        res.json(tableNames);
    });
});

// Retrieve data from a specific table
app.get('/table/:tableName', (req, res) => {
    const tableName = req.params.tableName;

    // Check if the table is excluded
    if (excludedTables.includes(tableName)) {
        res.status(400).send('This table is excluded');
        return;
    }

    pool.query(`SELECT * FROM ${tableName}`, (err, results) => {
        if (err) {
            console.error(`Error retrieving data from ${tableName}: ` + err.stack);
            res.status(500).send(`Error retrieving data from ${tableName}`);
            return;
        }

        res.json(results);
    });
});

// Update a specific cell in the table
app.post('/table/:tableName/update', (req, res) => {
    const tableName = req.params.tableName;
    const { primaryKey, primaryKeyValue, column, value } = req.body;

    // Check if the table is excluded
    if (excludedTables.includes(tableName)) {
        res.status(400).send('This table is excluded');
        return;
    }

    const sql = `UPDATE ?? SET ?? = ? WHERE ?? = ?`;
    const inserts = [tableName, column, value, primaryKey, primaryKeyValue];
    pool.query(mysql.format(sql, inserts), (err, results) => {
        if (err) {
            console.error(`Error updating data in ${tableName}: ` + err.stack);
            res.status(500).send(`Error updating data in ${tableName}`);
            return;
        }

        res.json({ success: true });
    });
});

// Upload or update a PDF file in the table
app.post('/table/:tableName/upload', upload.single('pdf'), (req, res) => {
    const tableName = req.params.tableName;
    const { primaryKey, primaryKeyValue, column } = req.body;

    // Check if the table is excluded
    if (excludedTables.includes(tableName)) {
        res.status(400).send('This table is excluded');
        return;
    }

    const filePath = req.file.path;
    const sql = `UPDATE ?? SET ?? = ? WHERE ?? = ?`;
    const inserts = [tableName, column, filePath, primaryKey, primaryKeyValue];
    pool.query(mysql.format(sql, inserts), (err, results) => {
        if (err) {
            console.error(`Error updating data in ${tableName}: ` + err.stack);
            res.status(500).send(`Error updating data in ${tableName}`);
            return;
        }

        res.json({ success: true, filePath });
    });
});

// Delete a PDF file from the table
app.post('/table/:tableName/delete', (req, res) => {
    const tableName = req.params.tableName;
    const { primaryKey, primaryKeyValue, column } = req.body;

    // Check if the table is excluded
    if (excludedTables.includes(tableName)) {
        res.status(400).send('This table is excluded');
        return;
    }

    const sql = `UPDATE ?? SET ?? = NULL WHERE ?? = ?`;
    const inserts = [tableName, column, primaryKey, primaryKeyValue];
    pool.query(mysql.format(sql, inserts), (err, results) => {
        if (err) {
            console.error(`Error deleting file in ${tableName}: ` + err.stack);
            res.status(500).send(`Error deleting file in ${tableName}`);
            return;
        }

        res.json({ success: true });
    });
});

// Serve the uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/Modify.html');
});
module.exports = app; // Export the entire Express application
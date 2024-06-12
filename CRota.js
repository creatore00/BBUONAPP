const server = require('./server.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool


const app = express();

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route to handle fetching employee data
app.get('/employees', (req, res) => {
    pool.query('SELECT name, lastName, wage, designation, startTime, endTime FROM rota', (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).send('Error fetching employee data');
        }
        const employees = results.map(row => ({
            name: row.name,
            lastName: row.lastName,
            wage: row.wage,
            designation: row.designation,
            startTime: row.startTime,
            endTime: row.endTime
        }));
        res.json(employees);
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/CRota.html');
});

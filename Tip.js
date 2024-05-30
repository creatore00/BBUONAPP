const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const confirmpassword = require('./ConfirmPassword.js'); 
const token = require('./Token.js');
const generate = require('./Generate.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const rota = require('./Rota.js');
const crota = require('./CRota.js');
const hours = require('./Hours.js');
const updatehours = require('./updateHours.js');
const server = require('./server.js');
const http = require('http');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 50011;
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
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  app.post('/', (req, res) => {
    const tipAmount = parseFloat(req.body.tipAmount);

    // Fetch employee data from the database
    const query = 'SELECT * FROM employees';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            res.status(500).send('Server error');
            return;
        }

        // Calculate total hours worked
        const totalHours = results.reduce((sum, emp) => sum + emp.hours_worked, 0);

        // Calculate tip for each employee based on their hours worked
        const tips = results.map(emp => ({
            name: emp.name,
            tip: parseFloat((tipAmount * (emp.hours_worked / totalHours)) * 0.98).toFixed(2) // 2% tax deduction
        }));

        res.json({ tips });
    });
});



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Tip.html');
  });
  
  // Start the Express server
  
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
  exports.handler = app; // Export for deployment on GCP

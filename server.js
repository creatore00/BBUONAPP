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
const updatehours = require('./updateHours.js');
const userholidays = require('./UserHolidays.js');
const hours = require('./Hours.js');
const http = require('http');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

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

app.post('/', (req, res) => {
      console.log('Request Body:', req.body);
      const { email, password } = req.body;
  // Query the database to check if the email belongs to an admin or a user
  const sql = 'SELECT Access, Password FROM users WHERE Email = ?';
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    const storedPassword = results[0]?.Password;
    // Determine the role (admin or user) based on the database result
    const role = results[0]?.Access;
    if (results.length === 0) {
      // Email not found in the database
      return res.redirect('/checkLogin.html');
    } else { 
      if (role === 'admin' && password === storedPassword) {
        // Redirect to the admin page
        return res.redirect('/Admin.html');
      } else if (role === 'user' && password === storedPassword) {
        // Redirect to the user page
        return res.redirect('/User.html');
      } else {
        // Invalid role
        return res.redirect('/checkLogin.html');
      }
    }
  });
});
// Cleanup endpoint
app.get('/logout', (req, res) => {
  console.log('Performing cleanup...');
  
  // Close the connection when done
  if (connection) {
    connection.end((err) => {
      if (err) {
        console.error('Error closing the database connection: ' + err.stack);
        res.status(500).send('Error closing the database connection');
        return;
      }
      console.log('Connection closed');
      res.send('Cleanup successful');
    });
  } else {
    console.log('No active connection to close.');
    res.send('No active connection to close.');
  }
});

// Serve your HTML or other routes here...
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Login.html');
});
app.get('/Admin.html', (req, res) => {
  res.sendFile(__dirname + '/Admin.html');
});
app.get('/User.html', (req, res) => {
  res.sendFile(__dirname + '/User.html');
});
app.get('/checkLogin.html', (req, res) => {
  res.sendFile(__dirname + '/checkLogin.html');
});

// Start the Express server

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
exports.handler = app; // Export for deployment on GCP
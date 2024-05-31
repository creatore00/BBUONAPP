const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js'); 
const token = require('./Token.js');
const generate = require('./Generate.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const crota = require('./CRota.js');
const hours = require('./Hours.js');
const rota = require('./Rota.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const http = require('http');

const app = express();


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

// Route to handle token verification
app.post('/', (req, res) => {
  console.log('Request Body:', req.body);
  const { password, email } = req.body;

  // Query to update password for the given email
  const sql = 'UPDATE users SET Password = ? WHERE Email = ?';

  // Execute the query
  connection.query(sql, [password, email], (err, results) => {
    if (err) {
      console.error('Error updating password in the database:', err);
      return res.status(500).json({ error: 'Error updating password in the database' });
    }
    console.log('Password Saved');
    return res.redirect('http://localhost:8080');

  });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/ConfirmPassword.html');
  });
  // Start the Express server

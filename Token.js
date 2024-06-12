const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const confirmpassword = require('./ConfirmPassword.js'); 
const server = require('./server.js');
const http = require('http');
const pool = require('./db.js'); // Import the connection pool

const app = express();

// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to handle token verification
app.post('/', (req, res) => {
  console.log('Request Body:', req.body);
  const { token } = req.body;

  // Query the database to check if the token exists
  const sql = 'SELECT Token FROM users WHERE Token = ?';
  pool.query(sql, [token], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.length === 0) {
      // Token does not exist, redirect to error page
      return res.redirect('/WrongToken.html');
    } else {
      // Token exists, redirect to success page
      return res.redirect('http://localhost:3003');
    }
  });
});

// Route to serve Token.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Token.html');
});
app.get('/ConfirmPassword.html', (req, res) => {
  res.sendFile(__dirname + '/ConfirmPassword.html');
});
app.get('/WrongToken.html', (req, res) => {
  res.sendFile(__dirname + '/WrongToken.html');
});


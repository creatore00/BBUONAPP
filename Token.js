const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const confirmpassword = require('./ConfirmPassword.js'); 
const server = require('./server.js');
const http = require('http');
const pool = require('./db.js'); // Import the connection pool
const { sessionMiddleware, isAuthenticated, isAdmin } = require('./sessionConfig'); // Adjust the path as needed
const app = express();
app.use(sessionMiddleware);
app.use('/confirmpassword', confirmpassword);
// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to handle token verification
app.post('/', (req, res) => {
  console.log('Request Body:', req.body);
  const { token } = req.body;

  // Query the database to check if the token exists
  const sql = 'SELECT Token, Email FROM users WHERE Token = ?';
  pool.query(sql, [token], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.length === 0) {
      // Token does not exist, redirect to error page
      return res.redirect('/WrongToken.html');
    } else {
      // Token exists, store token and email in session, and redirect to password reset page
      req.session.token = token;
      req.session.email = results[0].Email;
      return res.redirect('/confirmpassword');
    }
  });
});

// Route to serve Token.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Token.html');
});
app.get('/confirmpassword', (req, res) => {
  res.sendFile(__dirname + '/ConfirmPassword.html');
});
app.get('/WrongToken.html', (req, res) => {
  res.sendFile(__dirname + '/WrongToken.html');
});
module.exports = app; // Export the entire Express application


const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js'); 
const http = require('http');
const pool = require('./db.js'); // Import the connection pool
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds, higher is more secure but slower

const app = express();

// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Route to handle token verification and password update
app.post('/', async (req, res) => {
  console.log('Request Body:', req.body);
  const { password, email } = req.body;

  try {
      // Query to check if the email exists
      const checkEmailSql = 'SELECT Email FROM users WHERE Email = ?';
      pool.query(checkEmailSql, [email], async (err, results) => {
          if (err) {
              console.error('Error querying the database:', err);
              return res.status(500).json({ error: 'Error querying the database' });
          }

          if (results.length === 0) {
              // Email not found
              return res.status(404).json({ error: 'Email not found' });
          }

          // If email exists, hash the password
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);

          // Update the password in the database
          const updatePasswordSql = 'UPDATE users SET Password = ? WHERE Email = ?';
          pool.query(updatePasswordSql, [hashedPassword, email], (err, results) => {
              if (err) {
                  console.error('Error updating password in the database:', err);
                  return res.status(500).json({ error: 'Error updating password in the database' });
              }
              console.log('Password Saved');
              return res.redirect('http://localhost:8080');
          });
      });
  } catch (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/ConfirmPassword.html');
  });
module.exports = app; // Export the entire Express application

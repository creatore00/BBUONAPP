// Import required modules
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const server = require('./server.js');
const http = require('http');
const pool = require('./db.js'); // Import the connection pool

const app = express();

// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database for storing password reset tokens
const tokens = new Map();

// Function to generate a random token
function generateToken() {
  return Math.random().toString(36).substr(2);
}

// Function to insert token into the database
function insertToken(token, email, expirationTime, callback) {
  const sql = 'UPDATE users SET Token = ?, Expiry = ? WHERE Email = ?';
  pool.query(sql, [token, expirationTime, email], (err, results) => {
    if (err) {
      console.error('Error inserting token into the database:', err);
      return callback(err);
    }
    console.log('Token inserted into the database');
    callback(null);
  });
}

// Function to delete expired tokens from the database
function deleteExpiredTokens() {
  const currentTime = new Date();
  tokens.forEach((value, key) => {
    if (value.expirationTime <= currentTime) {
      tokens.delete(key);
      const sql = 'DELETE Token FROM users WHERE Token = ?';
      pool.query(sql, [key], (err, results) => {
        if (err) {
          console.error('Error deleting expired token from the database:', err);
        } else {
          console.log('Expired token deleted from the database');
        }
      });
    }
  });
}
// Schedule the deletion of expired tokens every ten minutes
setInterval(deleteExpiredTokens, 600000); // 10 minutes = 600000 milliseconds

// Route to handle password reset request
app.post('/', (req, res) => {
  const { email } = req.body;

  // Check if the email already exists in the database
  const sql = 'SELECT * FROM users WHERE Email = ?';
  pool.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.length > 0) {
      // Generate a random token
      const token = generateToken();
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 10); // Expires in 10 minutes

      // Store token in the database
      tokens.set(token, { expirationTime });

      // Send password reset link to the provided email address
      const resetLink = `https://bbuonapp-6fbdf6c6d835.herokuapp.com/token`;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
      user: 'oxfordbbuona@gmail.com',
      pass: 'vkav xtuc ufwz sphn'
        }
      });
      const mailOptions = {
        from: 'oxfordbbuona@gmail.com',
        to: email,
        subject: 'Password Reset Link',
        text: `Click the link to reset your password: ${resetLink} 
This is your Token for security measures: ${token}
Please insert it in the requested page`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending email' });
        } else {
          console.log('Email sent:', info.response);
          // Insert token into the database
          insertToken(token, email, expirationTime, (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error inserting token into the database' });
            }
            return res.redirect('/token');
          });
        }
      });
    } else {
      return res.redirect('/fp?alert=EmailDoesNotExist');
    }
  });
});

// Endpoint to handle password reset form submission
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/FP.html');
});
module.exports = app; // Export the entire Express application

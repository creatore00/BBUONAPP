// Import required modules
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const confirmpassword = require('./ConfirmPassword.js'); 
const token = require('./Token.js');
const server = require('./server.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const crota = require('./CRota.js');
const hours = require('./Hours.js');
const rota = require('./Rota.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const http = require('http');
// Create Express app
const app = express();
const port = 5002;

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

// In-memory database for storing password reset tokens
const tokens = new Map();

// Function to generate a random token
function generateToken() {
  return Math.random().toString(36).substr(2);
}

// Function to insert token into the database

app.post('/', (req, res) => {
    console.log('Request Body:', req.body);
    const { email, userType } = req.body;

    function checkEmailExists(email, callback) {
        const sql = 'SELECT * FROM users WHERE Email = ?';
        connection.query(sql, [email], (err, results) => {
          if (err) {
            return callback(err, null);
          }
          // If results array has any rows, email exists
          callback(null, results.length > 0);
        });
      }
      // Check if the email already exists in the database
      checkEmailExists(email, (err, exists) => {
        if (err) {
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (exists) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        function insertToken(token, email, expirationTime, userType, callback) {
            const sql = 'INSERT INTO users (Token, Email, Expiry, Access) VALUES (?, ?, ?, ?)';
            connection.query(sql, [token, email, expirationTime, userType], (err, results) => {
              if (err) {
                console.error('Error inserting token into the database:', err);
                return callback(err);
              }
              console.log('Token inserted into the database');
              callback(null);
            });
          }
  // Generate a random token
  const token = generateToken();
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 10); // Expires in 10 minutes

  // Store token in the database
  tokens.set(token, { email, expirationTime }, userType);

  // Send password reset link to the provided email address

    const resetLink = `http://100.75.152.16:5001/Token.html`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'Yassir.nini27@gmail.com',
      pass: 'oxih iwuk crfq ghjk'
    }
  });

  const mailOptions = {
    from: 'Yassir.nini27@gmail.com',
    to: email,
    subject: 'Password Reset Link',
    text: `Click the link to reset your password: ${resetLink} This is your token for security measures ${token}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
      return res.status(500).json({ error: 'Error sending email' });
    } else {
      console.log('Email sent:', info.response);
      // Insert token into the database
      insertToken(token, email, expirationTime, userType, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error 500' });//inserting token into the database
        }
        return res.redirect('http://localhost:8080');
      });
    }
  });
});
  });
// Endpoint to handle password reset form submission
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/GenerateFE.html');
  });
app.get('/Token.html', (req, res) => {
    res.sendFile(__dirname + '/Token.html');
  });
  app.get('/Admin.html', (req, res) => {
    res.sendFile(__dirname + '/Admin.html');
  });

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

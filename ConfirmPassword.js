const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js'); 
const http = require('http');
const pool = require('./db.js'); // Import the connection pool

const port = process.env.PORT || 3003;
const app = express();

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
  pool.query(sql, [password, email], (err, results) => {
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
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
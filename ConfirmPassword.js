const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js'); 
const http = require('http');
const pool = require('./db.js'); // Import the connection pool
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds, higher is more secure but slower
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Route to handle password update
app.post('/', async (req, res) => {
    console.log('Request Body:', req.body);
    const { password } = req.body;
    const email = req.session.email;
  
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: No session found' });
    }
  
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
  
        // Update the password in the database
        const updatePasswordSql = 'UPDATE users SET Password = ? WHERE Email = ?';
        pool.query(updatePasswordSql, [hashedPassword, email], (err, results) => {
            if (err) {
                console.error('Error updating password in the database:', err);
                return res.status(500).json({ error: 'Error updating password in the database' });
            }
            console.log('Password Saved');
            // Clear session after password update
            req.session.destroy();
            return res.redirect('/');
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

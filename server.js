const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const newRota = require('./Rota.js');
const confirmpassword = require('./ConfirmPassword.js'); 
const token = require('./Token.js');
const generate = require('./Generate.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const userholidays = require('./Holidays.js');
const hours = require('./Hours.js');
const pastpayslips = require('./PastPayslips.js');
const request = require('./Request.js');
const tip = require('./Tip.js');
const TotalHolidays = require('./TotalHolidays.js');
const UserCrota = require('./UserCRota.js');
const UserHolidays = require('./UserHolidays.js');
const confirmrota = require('./ConfirmRota.js');
const profile = require('./Profile.js');
const UserTotalHours = require('./UserTotalHours.js');
const insertpayslip = require('./InsertPayslip.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds, higher is more secure but slower
const jwt = require('jsonwebtoken');
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser } = require('./sessionConfig'); // Adjust the path as needed

const app = express();
const port = process.env.PORT || 8080;

app.use('/rota', newRota);
app.use('/confirmpassword', confirmpassword);
app.use('/token', token);
app.use('/generate', generate);
app.use('/updateinfo', updateinfo);
app.use('/fp', fp);
app.use('/userholidays', userholidays);
app.use('/hours', hours);
app.use('/pastpayslips', pastpayslips);
app.use('/request', request);
app.use('/tip', tip);
app.use('/TotalHolidays', TotalHolidays);
app.use('/UserCrota', UserCrota);
app.use('/UserHoliday', UserHolidays);
app.use('/confirmrota', confirmrota);
app.use('/profile', profile);
app.use('/UserTotalHours', UserTotalHours);
app.use('/insertpayslip', insertpayslip);
// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
// Route to handle login
app.post('/', (req, res) => {
  const { email, password } = req.body;

  // Query the database to check if the email belongs to an admin or a user
  const sql = `
    SELECT u.Access, u.Password, u.Email, e.name, e.lastName
    FROM users u
    JOIN Employees e ON u.Email = e.email
    WHERE u.Email = ?
  `;
  pool.query(sql, [email], async (err, results) => {
      if (err) {
          console.error('Error querying database:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (results.length === 0) {
          // Email not found in the database
          return res.status(401).json({ message: 'Incorrect email or password' });
      }

      const storedPassword = results[0].Password;
      const role = results[0].Access;
      const name = results[0].name;
      const lastName = results[0].lastName;

      // Compare the entered password with the hashed password in the database
      try {
          const isMatch = await bcrypt.compare(password, storedPassword);
          if (!isMatch) {
              return res.status(401).json({ message: 'Incorrect email or password' });
          }
      // Store user information in session
      req.session.user = {
        email: results[0].Email,
        role: results[0].Access,
        name: results[0].name,
        lastName: results[0].lastName
      };
          // Create a query string with user information
          const queryString = `?name=${encodeURIComponent(name)}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}`;

          if (role === 'admin') {
              // Redirect to the admin page with user info
              return res.redirect(`/Admin.html${queryString}`);
          } else if (role === 'user') {
              // Redirect to the user page with user info
              return res.redirect(`/User.html${queryString}`);
          } else if (role === 'supervisor') {
            // Redirect to the user page with user info
              return res.redirect(`/Supervisor.html${queryString}`);
          } else {
              // Invalid role
              return res.status(401).json({ message: 'Incorrect email or password' });
          }
      } catch (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
  });
});
// Route to retrieve data from the database
app.post('/getRota', (req, res) => {
  const selectedDate = req.body.date;
  console.log('Received date:', selectedDate); // Debugging statement to check received date
  const query = 'SELECT who FROM ConfirmedRota WHERE day = ?';
  pool.query(query, [selectedDate], (error, results) => {
      if (error) {
          console.error('Error executing query:', error);
          res.status(500).json({ error: 'Server error' }); // Send error as JSON
          return;
      }
      console.log('Query results:', results); // Debugging statement to check query results
      if (results.length > 0) {
          res.json({ rota: results[0].who }); // Ensure 'who' column is the correct one
      } else {
          res.status(404).json({ error: 'No data found for the selected date' }); // Send error as JSON
      }
  });
});

// API endpoint to get rota data for a specific day
app.get('/api/rota', (req, res) => {
  const day = req.query.day;
  if (!day) {
      return res.status(400).json({ error: 'Day is required' });
  }
  const query = 'SELECT * FROM rota WHERE day = ?';
  pool.query(query, [day], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);
  });
});
// Apply isAuthenticated middleware to all protected routes
app.get('/Admin.html', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + '/Admin.html');
});
app.get('/User.html', isAuthenticated, isUser, (req, res) => {
  res.sendFile(__dirname + '/User.html');
});
app.get('/Supervisor.html', isAuthenticated, isSupervisor, (req, res) => {
  res.sendFile(__dirname + '/Supervisor.html');
});
app.get('/logout', (req, res) => {
  // Check if there is an active session
  if (req.session && req.session.user) {
    req.session.destroy(err => {
      if (err) {
        console.error('Failed to logout:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.redirect('/');
    });
  } else {
    // If no active session, just redirect to the login page
    res.redirect('/');
  }
});
// Serve your HTML or other routes here...
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Login.html');
});
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

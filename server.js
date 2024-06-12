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
const pool = require('./db.js'); // Import the connection pool

const app = express();
const port = process.env.PORT;

// Middleware to parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', (req, res) => {
      console.log('Request Body:', req.body);
      const { email, password } = req.body;
  // Query the database to check if the email belongs to an admin or a user
  const sql = 'SELECT Access, Password FROM users WHERE Email = ?';
  pool.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    const storedPassword = results[0]?.Password;
    // Determine the role (admin or user) based on the database result
    const role = results[0]?.Access;
    if (results.length === 0) {
      // Email not found in the database
      return res.status(401).json({ message: 'Incorrect email or password' });
    } else { 
      if (role === 'admin' && password === storedPassword) {
        // Redirect to the admin page
        return res.redirect('/Admin.html');
      } else if (role === 'user' && password === storedPassword) {
        // Redirect to the user page
        return res.redirect('/User.html');
      } else {
        // Invalid role
        return res.status(401).json({ message: 'Incorrect email or password' });
      }
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
exports.handler = app; // Export for deployment on GCP
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const confirmpassword = require('./ConfirmPassword.js'); 
const server = require('./server.js');
const generate = require('./Generate.js');
const updateinfo = require('./UpdateInfo.js');
const fp = require('./FP.js');
const rota = require('./Rota.js');
const crota = require('./CRota.js');
const hours = require('./Hours.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const http = require('http');
const app = express();
const port = process.env.PORT || 5003;

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
  const { token } = req.body;

  // Query the database to check if the token exists
  const sql = 'SELECT Token FROM users WHERE Token = ?';
  connection.query(sql, [token], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.length === 0) {
      // Token does not exist, redirect to error page
      return res.redirect('/WrongToken.html');
    } else {
      // Token exists, redirect to success page
      return res.redirect('http://localhost:5001');
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
// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

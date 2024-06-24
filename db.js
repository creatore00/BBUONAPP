// db.js

const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: 'sql8.freesqldatabase.com',
    user: 'sql8710584',
    password: 'UwY6kriwlL',
    database: 'sql8710584',
  connectionLimit: 10, // Set the maximum number of connections
});
// Optionally, you can check the connection to the database
pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
    }
    console.log('Connected to the database (pool)');
  });
// Export the pool for use in other modules
module.exports = pool;
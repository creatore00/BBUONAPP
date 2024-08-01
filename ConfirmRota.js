const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const server = require('./server.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor } = require('./sessionConfig'); // Adjust the path as needed

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionMiddleware);
// API endpoint to get rota data for a specific day
app.get('/api/rota', (req, res) => {
    const day = req.query.day;
    if (!day) {
        return res.status(400).json({ error: 'Day is required' });
    }

    // Query to get rota data for the specified day
    const rotaQuery = `
        SELECT name, lastName, wage, day, designation, startTime, endTime
        FROM rota
        WHERE day = ?
    `;

    // Query to get confirmed rota data
    const confirmedRotaQuery = `
        SELECT name, lastName, designation, day, startTime, endTime
        FROM ConfirmedRota
    `;

    // Fetch both rota and confirmed rota data
    pool.query(rotaQuery, [day], (err, rotaResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        pool.query(confirmedRotaQuery, (err, confirmedRotaResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Convert confirmed rota data to a set for quick lookup
            const confirmedRotaSet = new Set(
                confirmedRotaResults.map(entry => `${entry.name} ${entry.lastName} ${entry.designation} ${entry.day} ${entry.startTime} ${entry.endTime}`)
            );

            // Filter out rota data that is already confirmed
            const filteredRotaResults = rotaResults.filter(entry => {
                const key = `${entry.name} ${entry.lastName} ${entry.designation} ${entry.day} ${entry.startTime} ${entry.endTime}`;
                return !confirmedRotaSet.has(key);
            });

            res.json(filteredRotaResults);
        });
    });
});
// API endpoint to get confirmed rota data
app.get('/api/confirmed-rota', (req, res) => {
    const sql = 'SELECT * FROM ConfirmedRota';
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching confirmed rota:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});
app.post('/confirm-rota', (req, res) => {
    const rotaData = req.body;
    const userEmail = req.session.user.email; // Get the logged-in user's email
    console.log('Received rota data:', rotaData);

    if (!rotaData || !Array.isArray(rotaData) || rotaData.length === 0) {
        return res.status(400).send('Invalid rota data.');
    }

    const day = rotaData[0].day;

    // Queries
    const deleteQuery = 'DELETE FROM ConfirmedRota WHERE day = ?';
    const insertQuery = `
        INSERT INTO ConfirmedRota (name, lastName, wage, day, startTime, endTime, designation, who) 
        VALUES ?
    `;
    const updateRotaQuery = `
        UPDATE rota
        SET startTime = ?, endTime = ?
        WHERE name = ? AND lastName = ? AND designation = ? AND day = ?
    `;

    // Prepare values to insert
    const values = rotaData.flatMap(entry => {
        const { name, lastName, wage, day, designation, times } = entry;
        return times.map(time => {
            const { startTime, endTime } = time;
            return [name, lastName, wage, day, startTime, endTime, designation, userEmail];
        });
    });

    // Print values to be inserted into the database
    console.log('Values to be inserted into ConfirmedRota:', values);

    // Delete old entries for the given day
    pool.query(deleteQuery, [day], (err) => {
        if (err) {
            console.error('Error deleting existing confirmed rota data:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Insert new or updated values into ConfirmedRota
        pool.query(insertQuery, [values], (err, result) => {
            if (err) {
                console.error('Error inserting rota data:', err);
                return res.status(500).send('Internal Server Error');
            }

            // Update the existing rota table with confirmed data
            const updateTasks = rotaData.flatMap(entry => {
                const { name, lastName, day, designation, times } = entry;
                return times.map(time => {
                    const { startTime, endTime } = time;
                    return new Promise((resolve, reject) => {
                        pool.query(updateRotaQuery, [startTime, endTime, name, lastName, designation, day], (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                });
            });

            Promise.all(updateTasks)
                .then(() => {
                    res.status(200).send('Rota confirmed and updated successfully.');
                })
                .catch(err => {
                    console.error('Error updating rota data:', err);
                    res.status(500).send('Internal Server Error');
                });
        });
    });
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
app.get('/', isAuthenticated, (req, res) => {
    if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'ConfirmRota.html'));
    } else if (req.session.user.role === 'supervisor') {
        res.sendFile(path.join(__dirname, 'ConfirmRota.html'));
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});
module.exports = app; // Export the entire Express application


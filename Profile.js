const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool
const path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds, higher is more secure but slower
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin, isSupervisor, isUser } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Route to handle login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Query the database to check if the email belongs to a user
    const sql = `
        SELECT * FROM Employees WHERE email = ?
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

        // Compare the entered password with the hashed password in the database
        try {
            const isMatch = await bcrypt.compare(password, storedPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect email or password' });
            }

            // Store user information in session
            req.session.user = {
                email: results[0].Email,
                name: results[0].Name,
                lastName: results[0].lastName
                // Add any other relevant user data
            };

            res.json({ message: 'Login successful' });
        } catch (err) {
            console.error('Error comparing passwords:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});
// Route to fetch user profile data
app.get('/api/profile', isAuthenticated, (req, res) => {
    if (req.session.user) {
        const email = req.session.user.email;
        pool.query('SELECT * FROM Employees WHERE email = ?', [email], (err, results) => {
            if (err) {
                return res.status(500).send('Server error');
            }
            if (results.length === 0) {
                return res.status(404).send('User not found');
            }
            res.json(results[0]);
        });
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
});

// Route to update user password
app.post('/api/update-password', isAuthenticated, (req, res) => {
    if (req.session.user) {
        const { newPassword } = req.body;
        const email = req.session.user.email; // Get email from session

        // Check if newPassword is provided
        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        // Log the email to ensure it's correct
        console.log('Email from session:', email);

        // Hash the new password with bcrypt
        bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).send('Server error');
            }

            // Log the hashed password for debugging
            console.log('Hashed Password:', hashedPassword);

            // Update the user's password in the database with the hashed password
            pool.query('UPDATE users SET Password = ? WHERE Email = ?', [hashedPassword, email], (err, results) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).send('Server error');
                }

                // Log the results for debugging
                console.log('Update Results:', results);

                if (results.affectedRows === 0) {
                    return res.status(404).send('Email not found');
                }

                res.send('Password updated successfully');
            });
        });
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
});
app.get('/', isAuthenticated, (req, res) => {
    if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'Profile.html'));
    } else if (req.session.user.role === 'supervisor') {
        res.sendFile(path.join(__dirname, 'Profile.html'));
    } else if (req.session.user.role === 'user') {
        res.sendFile(path.join(__dirname, 'Profile.html'));
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

module.exports = app; // Export the entire Express application

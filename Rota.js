const server = require('./server.js');
const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool

const port = process.env.PORT;
const app = express();

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Function to generate a unique 16-digit ID
function generateUniqueId() {
    return Math.floor(Math.random() * 1e16).toString().padStart(16, '0');
}
// Function to send email
function sendEmail(recipients) {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'Yassir.nini27@gmail.com',
            pass: 'oxih iwuk crfq ghjk'
        }
    });

    // Setup email data
    const mailOptions = {
        from: 'Yassir.nini27@gmail.com',
        to: recipients.join(','), // Convert array of emails to comma-separated string
        subject: 'Rota Updated',
        text: 'The rota has been updated successfully.'
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}
app.delete('/deleteTimeFrame', (req, res) => {
    const { day, name, lastName, startTime, endTime } = req.body;

    const deleteQuery = 'DELETE FROM rota WHERE day = ? AND name = ? AND lastName = ? AND startTime = ? AND endTime = ?';

    pool.query(deleteQuery, [day, name, lastName, startTime, endTime], (err, result) => {
        if (err) {
            console.error('Error deleting time frame from the database:', err);
            return res.status(500).send('Error deleting time frame');
        }

        console.log(`Time frame for ${name} ${lastName} on ${day} from ${startTime} to ${endTime} deleted.`);
        res.status(200).send('Time frame deleted successfully');
    });
});
app.post('/saveData', (req, res) => {
    console.log('Request Body:', req.body);
    const tableData = req.body;
    const insertQuery = 'INSERT INTO rota (id, name, lastName, wage, day, startTime, endTime, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const updateQuery = 'UPDATE rota SET name = ?, lastName = ?, wage = ?, day = ?, startTime = ?, endTime = ?, designation = ? WHERE id = ?';
    const updateByNameDayQuery = 'UPDATE rota SET wage = ?, designation = ? WHERE name = ? AND lastName = ? AND day = ? AND startTime = ? AND endTime = ?';

    // Initialize an array to collect messages
    const operationMessages = [];

    tableData.forEach(row => {
        const id = generateUniqueId();
        const { name, lastName, wage, day, startTime, endTime, designation } = row;

        // Check for existing record based on id
        pool.query('SELECT id FROM rota WHERE id = ?', [id], (checkIdErr, checkIdResult) => {
            if (checkIdErr) {
                console.error('Error checking data by ID in the main database:', checkIdErr);
                return res.status(500).send('Error saving data');
            }

            if (checkIdResult.length > 0) {
                // If the record with the same id exists, update it
                pool.query(updateQuery, [name, lastName, wage, day, startTime, endTime, designation, id], (updateIdErr, updateIdResult) => {
                    if (updateIdErr) {
                        console.error('Error updating data by ID in the main database:', updateIdErr);
                        return res.status(500).send('Error saving data');
                    } else {
                        console.log(`Record with ID ${id} updated.`);
                        operationMessages.push(`Record with ID ${id} updated.`);
                    }
                });
            } else {
                // Check for existing record based on name, lastName, day, startTime, and endTime
                pool.query('SELECT id FROM rota WHERE name = ? AND lastName = ? AND day = ? AND startTime = ? AND endTime = ?', [name, lastName, day, startTime, endTime], (checkNameDayErr, checkNameDayResult) => {
                    if (checkNameDayErr) {
                        console.error('Error checking data by name, day, startTime, and endTime in the main database:', checkNameDayErr);
                        return res.status(500).send('Error saving data');
                    }

                    if (checkNameDayResult.length > 0) {
                        // If the record with the same name, lastName, day, startTime, and endTime exists, update it
                        pool.query(updateByNameDayQuery, [wage, designation, name, lastName, day, startTime, endTime], (updateNameDayErr, updateNameDayResult) => {
                            if (updateNameDayErr) {
                                console.error('Error updating data by name, day, startTime, and endTime in the main database:', updateNameDayErr);
                                return res.status(500).send('Error saving data');
                            } else {
                                console.log(`Record for ${name} ${lastName} on ${day} from ${startTime} to ${endTime} updated.`);
                                operationMessages.push(`Record for ${name} ${lastName} on ${day} from ${startTime} to ${endTime} updated.`);
                            }
                        });
                    } else {
                        // If the record with the same name, lastName, day, startTime, and endTime does not exist, insert a new record
                        pool.query(insertQuery, [id, name, lastName, wage, day, startTime, endTime, designation], (insertErr, insertResult) => {
                            if (insertErr) {
                                console.error('Error inserting data into the main database:', insertErr);
                                return res.status(500).send('Error saving data');
                            } else {
                                console.log(`New record inserted with ID ${id}.`);
                                operationMessages.push(`New record inserted with ID ${id}.`);
                            }
                        });
                    }
                });
            }
        });
    });

    // Send a success response after all rows have been processed
    res.status(200).send(operationMessages.join('\n'));
});
app.post('/submitData', (req, res) => {
    console.log('Request Body:', req.body);
    const tableData = req.body;
    const insertQuery = 'INSERT INTO rota (id, name, lastName, wage, day, startTime, endTime, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const updateQuery = 'UPDATE rota SET name = ?, lastName = ?, wage = ?, day = ?, startTime = ?, endTime = ?, designation = ? WHERE id = ?';
    const updateByNameDayQuery = 'UPDATE rota SET wage = ?, designation = ? WHERE name = ? AND lastName = ? AND day = ? AND startTime = ? AND endTime = ?';

    // Initialize an array to collect messages
    const operationMessages = [];

    tableData.forEach(row => {
        const id = generateUniqueId();
        const { name, lastName, wage, day, startTime, endTime, designation } = row;

        // Check for existing record based on id
        pool.query('SELECT id FROM rota WHERE id = ?', [id], (checkIdErr, checkIdResult) => {
            if (checkIdErr) {
                console.error('Error checking data by ID in the main database:', checkIdErr);
                return res.status(500).send('Error saving data');
            }

            if (checkIdResult.length > 0) {
                // If the record with the same id exists, update it
                pool.query(updateQuery, [name, lastName, wage, day, startTime, endTime, designation, id], (updateIdErr, updateIdResult) => {
                    if (updateIdErr) {
                        console.error('Error updating data by ID in the main database:', updateIdErr);
                        return res.status(500).send('Error saving data');
                    } else {
                        console.log(`Record with ID ${id} updated.`);
                        operationMessages.push(`Record with ID ${id} updated.`);
                    }
                });
            } else {
                // Check for existing record based on name, lastName, day, startTime, and endTime
                pool.query('SELECT id FROM rota WHERE name = ? AND lastName = ? AND day = ? AND startTime = ? AND endTime = ?', [name, lastName, day, startTime, endTime], (checkNameDayErr, checkNameDayResult) => {
                    if (checkNameDayErr) {
                        console.error('Error checking data by name, day, startTime, and endTime in the main database:', checkNameDayErr);
                        return res.status(500).send('Error saving data');
                    }

                    if (checkNameDayResult.length > 0) {
                        // If the record with the same name, lastName, day, startTime, and endTime exists, update it
                        pool.query(updateByNameDayQuery, [wage, designation, name, lastName, day, startTime, endTime], (updateNameDayErr, updateNameDayResult) => {
                            if (updateNameDayErr) {
                                console.error('Error updating data by name, day, startTime, and endTime in the main database:', updateNameDayErr);
                                return res.status(500).send('Error saving data');
                            } else {
                                console.log(`Record for ${name} ${lastName} on ${day} from ${startTime} to ${endTime} updated.`);
                                operationMessages.push(`Record for ${name} ${lastName} on ${day} from ${startTime} to ${endTime} updated.`);
                            }
                        });
                    } else {
                        // If the record with the same name, lastName, day, startTime, and endTime does not exist, insert a new record
                        pool.query(insertQuery, [id, name, lastName, wage, day, startTime, endTime, designation], (insertErr, insertResult) => {
                            if (insertErr) {
                                console.error('Error inserting data into the main database:', insertErr);
                                return res.status(500).send('Error saving data');
                            } else {
                                console.log(`New record inserted with ID ${id}.`);
                                operationMessages.push(`New record inserted with ID ${id}.`);
                            }
                        });
                    }
                });
            }
        });
    });

    // Get email addresses from the database
    pool.query('SELECT email FROM Employees', (emailErr, emailResults) => {
        if (emailErr) {
            console.error('Error fetching emails from the database:', emailErr);
            return res.status(500).send('Error sending emails');
        }

        const recipients = emailResults.map(row => row.email);

        // Send email to recipients
        sendEmail(recipients);
    });
    // Send a success response after all rows have been processed
    res.status(200).send(operationMessages.join('\n'));
});
// Route to retrieve data from the rota table
app.get('/rota', (req, res) => {
    pool.query('SELECT id, name, lastName, wage, day, startTime, endTime, designation FROM rota', (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).send('Error fetching employee data');
        }
        const data = results.map(row => ({
            name: row.name,
            lastName: row.lastName,
            wage: row.wage,
            day: row.day,
            startTime: row.startTime,
            endTime: row.endTime,
            designation: row.designation
        }));
        res.json(data);
    });
});
// Route to handle fetching employee data
app.get('/employees', (req, res) => {
    pool.query('SELECT name, lastName, wage, designation FROM Employees', (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).send('Error fetching employee data');
        }
        const employees = results.map(row => ({
            name: row.name,
            lastName: row.lastName,
            wage: row.wage,
            designation: row.designation
        }));
        res.json(employees);
    });
});
// Endpoint to retrieve holiday data
app.get('/getHolidayData', (req, res) => {
    // Query to select specific columns from Holiday table
    const sql = 'SELECT name, lastName, startDate, endDate, accepted FROM Holiday';
  
    // Execute the query
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        // Send the results as JSON
        res.json(results);
    });
});
// Endpoint to handle comment submissions
app.post('/submit-comment', (req, res) => {
    const { comment, weekStartDate } = req.body;

    if (!comment || !weekStartDate) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    // Delete existing comments for the given week start date
    const deleteQuery = 'DELETE FROM comments WHERE week_start_date = ?';
    pool.query(deleteQuery, [weekStartDate], (deleteErr, deleteResults) => {
        if (deleteErr) {
            console.error('Error deleting existing comments:', deleteErr);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // Insert the new comment into the database
        const insertQuery = 'INSERT INTO comments (comment, week_start_date) VALUES (?, ?)';
        pool.query(insertQuery, [comment, weekStartDate], (insertErr, insertResults) => {
            if (insertErr) {
                console.error('Error inserting new comment:', insertErr);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.json({ success: true });
        });
    });
});
// Endpoint to handle fetching comments
app.get('/get-comments', (req, res) => {
    const { weekStartDate } = req.query;

    if (!weekStartDate) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    // Query the database to retrieve the comments for the specified week start date
    const query = 'SELECT comment FROM comments WHERE week_start_date = ?';
    pool.query(query, [weekStartDate], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        const comments = results.map(row => row.comment); // Extract comments from results
        res.json({ success: true, comments });
    });
});
// Endpoint to handle forecast submissions
app.post('/insert-forecast', (req, res) => {
    const { weekStartDate, forecastValues } = req.body;

    if (!weekStartDate || !forecastValues) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    // Flatten the forecastValues object into an array of [day, forecast] pairs
    const values = Object.entries(forecastValues).map(([day, forecast]) => [weekStartDate, day, forecast]);

    // Remove existing forecast data for the same week start date
    pool.query('DELETE FROM forecast WHERE week_start_date = ?', weekStartDate, (err, results) => {
        if (err) {
            console.error('Error deleting existing forecast:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // Insert new forecast data
        pool.query('INSERT INTO forecast (week_start_date, day, forecast) VALUES ?', [values], (err, results) => {
            if (err) {
                console.error('Error inserting forecast:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            console.log('Forecast inserted successfully');
            res.json({ success: true });
        });
    });
});
// Endpoint to handle fetching forecast data
app.get('/get-forecast', (req, res) => {
    const { weekStartDate } = req.query;

    if (!weekStartDate) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const query = 'SELECT day, forecast FROM forecast WHERE week_start_date = ?';
    pool.query(query, [weekStartDate], (err, results) => {
        if (err) {
            console.error('Error fetching forecast data:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        const forecasts = {};
        results.forEach(row => {
            forecasts[row.day.toLowerCase()] = row.forecast;
        });

        res.json({ success: true, forecasts });
    });
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Rota.html');
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

const nodemailer = require('nodemailer');
const http = require('http');
const fs = require('fs');
const pdf = require('html-pdf');
const ejs = require('ejs');
const mysql = require('mysql2');
const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db.js'); // Import the connection pool
const { sessionMiddleware, isAuthenticated, isAdmin } = require('./sessionConfig'); // Adjust the path as needed
const app = express();
app.use(sessionMiddleware);
// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Function to generate a unique 16-digit ID
function generateUniqueId() {
    return Math.floor(Math.random() * 1e16).toString().padStart(16, '0');
}
// Function to send email
function sendEmail(recipients, pdfPath, callback) {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
      user: 'oxfordbbuona@gmail.com',
      pass: 'vkav xtuc ufwz sphn'
        }
    });

    const mailOptions = {
        from: 'oxfordbbuona@gmail.com',
        to: recipients.join(','),
        subject: 'Rota Table Published',
        text: 'Please find the attached rota table.',
        attachments: [
            {
                filename: 'rota.pdf',
                path: pdfPath,
                contentType: 'application/pdf'
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return callback(error);
        }
        console.log('Email sent:', info.response);
        callback(null, info);
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
// Helper function to group and merge time frames for the same person on the same day
function groupAndMergeRotaData(data) {
    const groupedData = {};

    data.forEach(row => {
        const key = `${row.day}-${row.name}-${row.lastName}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                day: row.day,
                name: row.name,
                lastName: row.lastName,
                designation: row.designation,
                timeFrames: []
            };
        }
        groupedData[key].timeFrames.push({ startTime: row.startTime, endTime: row.endTime });
    });

    return Object.values(groupedData).map(entry => {
        const { day, name, lastName, designation, timeFrames } = entry;
        const mergedTimeFrames = timeFrames.map(tf => `${tf.startTime} - ${tf.endTime}`).join(', ');
        return { day, name, lastName, timeFrames: mergedTimeFrames, designation };
    });
}
// Modify the submitData endpoint to process the data before rendering the PDF
app.post('/submitData', (req, res) => {
    console.log('Request Body:', req.body);
    const tableData = req.body;
    const groupedData = groupAndMergeRotaData(tableData);

    const insertQuery = 'INSERT INTO rota (id, name, lastName, wage, day, startTime, endTime, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const updateQuery = 'UPDATE rota SET name = ?, lastName = ?, wage = ?, day = ?, startTime = ?, endTime = ?, designation = ? WHERE id = ?';
    const updateByNameDayQuery = 'UPDATE rota SET wage = ?, designation = ? WHERE name = ? AND lastName = ? AND day = ? AND startTime = ? AND endTime = ?';

    const operationMessages = [];

    tableData.forEach(row => {
        const id = generateUniqueId();
        const { name, lastName, wage, day, startTime, endTime, designation } = row;

        pool.query('SELECT id FROM rota WHERE id = ?', [id], (checkIdErr, checkIdResult) => {
            if (checkIdErr) {
                console.error('Error checking data by ID:', checkIdErr);
                return res.status(500).send('Error saving data');
            }

            if (checkIdResult.length > 0) {
                pool.query(updateQuery, [name, lastName, wage, day, startTime, endTime, designation, id], (updateIdErr, updateIdResult) => {
                    if (updateIdErr) {
                        console.error('Error updating data by ID:', updateIdErr);
                        return res.status(500).send('Error saving data');
                    } else {
                        console.log(`Record with ID ${id} updated.`);
                        operationMessages.push(`Record with ID ${id} updated.`);
                    }
                });
            } else {
                pool.query('SELECT id FROM rota WHERE name = ? AND lastName = ? AND day = ? AND startTime = ? AND endTime = ?', [name, lastName, day, startTime, endTime], (checkNameDayErr, checkNameDayResult) => {
                    if (checkNameDayErr) {
                        console.error('Error checking data by name, day, startTime, and endTime:', checkNameDayErr);
                        return res.status(500).send('Error saving data');
                    }

                    if (checkNameDayResult.length > 0) {
                        pool.query(updateByNameDayQuery, [wage, designation, name, lastName, day, startTime, endTime], (updateNameDayErr, updateNameDayResult) => {
                            if (updateNameDayErr) {
                                console.error('Error updating data by name, day, startTime, and endTime:', updateNameDayErr);
                                return res.status(500).send('Error saving data');
                            } else {
                                console.log(`Record for ${name} ${lastName} on ${day} from ${startTime} to ${endTime} updated.`);
                                operationMessages.push(`Record for ${name} ${lastName} on ${day} from ${startTime} to ${endTime} updated.`);
                            }
                        });
                    } else {
                        pool.query(insertQuery, [id, name, lastName, wage, day, startTime, endTime, designation], (insertErr, insertResult) => {
                            if (insertErr) {
                                console.error('Error inserting data:', insertErr);
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

// Get email addresses from the database and generate PDF
pool.query('SELECT email FROM users WHERE email = \'yassir.nini27@gmail.com\'', async (emailErr, emailResults) => {
    if (emailErr) {
        console.error('Error fetching emails from the database:', emailErr);
        return res.status(500).send('Error sending emails');
    }

    const recipients = emailResults.map(row => row.email);
    const parseDateFromDay = (day) => {
        const datePart = day.split(' ')[0]; 
        return new Date(datePart.split('/').reverse().join('-')); // Convert to Date object
    };

    // Sort groupedData by the extracted date
    const sortedData = groupedData.sort((a, b) => {
        return parseDateFromDay(a.day) - parseDateFromDay(b.day);
    });

    ejs.renderFile('rotaTemplate.ejs', { rotaData: sortedData }, async (renderErr, html) => {
        if (renderErr) {
            console.error('Error rendering EJS template:', renderErr);
            return res.status(500).send('Error generating PDF');
        }

        try {
            // Generate the PDF
            await generatePDF(html);
            console.log('PDF generated successfully: rota.pdf');

            // Send email with the PDF attachment
            sendEmail(recipients, '/tmp/rota.pdf', (emailErr, emailRes) => {
                if (emailErr) {
                    return res.status(500).send('Error sending email');
                }
                // Send a success response
                res.status(200).send('PDF generated and email sent successfully');
            });
        } catch (pdfErr) {
            console.error('Error generating PDF:', pdfErr);
            return res.status(500).send('Error generating PDF');
        }
    


            async function generatePDF(html) {
                // Set cache directory
                process.env.PUPPETEER_CACHE_DIR = '/tmp/.cache/puppeteer';
            
                const browser = await puppeteer.launch({
                    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessary for Heroku
                    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', // Ensure the path is set correctly
                });
                
                const options = {
                    path: '/tmp/rota.pdf', // Save path in Heroku's temporary directory
                    format: 'A4',
                    landscape: true,
                    margin: {
                        top: '10mm',
                        right: '10mm',
                        bottom: '10mm',
                        left: '10mm',
                    },
                };
            
                await page.pdf(options);
                await browser.close();
            }
        });
    });
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
app.get('/', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/Rota.html');
});
module.exports = app; // Export the entire Express application

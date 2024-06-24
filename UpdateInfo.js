const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const server = require('./server.js');
const pool = require('./db.js'); // Import the connection pool
const app = express();
const { sessionMiddleware, isAuthenticated, isAdmin } = require('./sessionConfig'); // Adjust the path as needed
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.post('/', upload.single('passportImage'), (req, res) => {
    const { name, lastName, email, phone, address, nin, wage, designation, holiday, dateStart } = req.body;
    const passportImage = req.file.filename;
    const query = 'INSERT INTO Employees (name, lastName, email, phone, address, nin, wage, designation, passportImage, TotalHoliday, startHoliday, dateStart) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    pool.query(query, [name, lastName, email, phone, address, nin, wage, designation, passportImage, holiday, holiday, dateStart], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json({ success: true, message: 'Employee data successfully inserted' });
    });
});

app.get('/employees', (req, res) => {
    const query = 'SELECT * FROM Employees ORDER BY designation DESC, id ASC';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});
app.get('/', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'PersonalInfo.html'));
});
// DELETE endpoint to remove an employee
app.delete('/employee/:id', (req, res) => {
    const { id } = req.params; 

    // First, get the passportImage filename to delete the file
    const getQuery = 'SELECT passportImage FROM Employees WHERE id = ?';
    pool.query(getQuery, [id], (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const passportImage = results[0].passportImage.toString();
        const imagePath = path.join(__dirname, 'uploads', passportImage);

        // Delete the database record
        const deleteQuery = 'DELETE FROM Employees WHERE id = ?';
        pool.query(deleteQuery, [id], (err, result) => {
            if (err) {
                console.error('Error deleting employee:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }

            // Delete the file from the file system
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image file:', err);
                    // Still return success since the database record was deleted
                    return res.json({ success: true, message: 'Employee deleted, but error removing image file' });
                }

                res.json({ success: true, message: 'Employee successfully deleted' });
            });
        });
    });
});
module.exports = app; // Export the entire Express application

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const confirmpassword = require('./ConfirmPassword.js'); 
const token = require('./Token.js');
const generate = require('./Generate.js');
const server = require('./server.js');
const fp = require('./FP.js');
const rota = require('./Rota.js');
const crota = require('./CRota.js');
const hours = require('./Hours.js');
const updatehours = require('./updateHours.js');
const tip = require('./Tip.js');
const router = express.Router();


const app = express();

// Create a connection to the database
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
    const { name, lastName, email, phone, address, nin, wage, designation } = req.body;
    const passportImage = req.file.filename;

    const query = 'INSERT INTO Employees (name, lastName, email, phone, address, nin, wage, designation, passportImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    connection.query(query, [name, lastName, email, phone, address, nin, wage, designation, passportImage], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json({ success: true, message: 'Employee data successfully inserted' });
    });
});

app.get('/employees', (req, res) => {
    const query = 'SELECT * FROM Employees';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        res.json(results);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'PersonalInfo.html'));
});

// DELETE endpoint to remove an employee
app.delete('/employee/:id', (req, res) => {
    const employeeId = req.params.id;

    // First, get the passportImage filename to delete the file
    const getQuery = 'SELECT passportImage FROM Employees WHERE id = ?';
    connection.query(getQuery, [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const passportImage = results[0].passportImage;
        const imagePath = path.join(__dirname, 'uploads', passportImage);

        // Delete the database record
        const deleteQuery = 'DELETE FROM Employees WHERE id = ?';
        connection.query(deleteQuery, [employeeId], (err, result) => {
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
router.get('/', (req, res) => {
    res.send('UI main route');
});
module.exports = router;

const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db.js'); // Import the connection pool

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to fetch payslips data
app.get('/api/payslips', (req, res) => {
    const query = 'SELECT * FROM payslips';
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Database query error' });
            return;
        }
        res.json(results);
    });
});
// Endpoint to download a specific payslip file
app.get('/api/download-file/:id', (req, res) => {
  const payslipId = req.params.id;
  const query = 'SELECT fileContent FROM payslips WHERE id = ?'; // Only retrieve fileContent
  pool.query(query, [payslipId], (err, results) => {
      if (err) {
          console.error('Error fetching data:', err);
          res.status(500).json({ error: 'Database query error' });
          return;
      }
      if (results.length === 0) {
          res.status(404).json({ error: 'Payslip not found' });
          return;
      }
      const payslip = results[0];
      const fileContent = payslip.fileContent;

      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'application/pdf'); // Default to octet-stream if MIME type is unknown
      res.setHeader('Content-Disposition', `attachment; filename=Payslip_${payslipId}.pdf`); // Set default filename extension to PDF

      // Send the file content as response
      res.send(fileContent);
  });
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/PastPayslips.html');
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

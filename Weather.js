const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const fetch = import('node-fetch').then(module => module.default);
const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('./db.js'); // Import the connection pool

const app = express();
const port = process.env.PORT;

const apiKey = '3396d395dcb986a508e0c14af1b7ad3c';
const city = 'Oxford';
async function fetchWeatherData() {
    const fetchModule = await fetch;
    return fetchModule(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            return response.json();
        });
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Weather.html');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

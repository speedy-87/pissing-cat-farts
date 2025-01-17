require('dotenv').config(); // Load environment variables
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); // To resolve static files

const app = express();
const port = process.env.PORT || 3000; // Use Heroku's dynamic port or default to 3000

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());
app.use(express.json()); // To parse JSON data sent in requests

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Handle requests to the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve your main HTML file
});

// Create a connection to the database using environment variables
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// Connect to MySQL
connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// API endpoint to fetch leaderboard data
app.get('/api/leaderboard', (req, res) => {
    connection.query('SELECT nickname, score FROM scores ORDER BY score DESC', (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send('Error fetching leaderboard data');
        }
        res.json(results); // Send the results as a JSON response
    });
});

// API endpoint to save or update the score
app.post('/api/save_score', (req, res) => {
    const { nickname, score } = req.body;

    if (!nickname || score === undefined) {
        return res.status(400).send('Nickname and score are required.');
    }

    // Check if the user already has a score
    connection.query('SELECT * FROM scores WHERE nickname = ?', [nickname], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send('Error checking user score');
        }

        if (results.length > 0) {
            // If the user exists and their score is higher than the stored one, update the score
            const existingScore = results[0].score;

            if (score > existingScore) {
                connection.query(
                    'UPDATE scores SET score = ? WHERE nickname = ?',
                    [score, nickname],
                    (err, updateResults) => {
                        if (err) {
                            console.error('Error updating score:', err);
                            return res.status(500).send('Error updating score');
                        }
                        res.json({ success: true, message: 'Score updated!' });
                    }
                );
            } else {
                // If the new score is not higher, do nothing
                res.json({ success: false, message: 'Score not high enough to update.' });
            }
        } else {
            // If the user does not exist, insert a new score record
            connection.query(
                'INSERT INTO scores (nickname, score) VALUES (?, ?)',
                [nickname, score],
                (err, insertResults) => {
                    if (err) {
                        console.error('Error inserting new score:', err);
                        return res.status(500).send('Error inserting score');
                    }
                    res.json({ success: true, message: 'Score added!' });
                }
            );
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

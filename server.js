require('dotenv').config(); // Load environment variables
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // Import sqlite3
const cors = require('cors');
const path = require('path'); // To resolve static files

const app = express();
const port = process.env.PORT || 3000; // Use dynamic port or default to 3000

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());
app.use(express.json()); // To parse JSON data sent in requests

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Handle requests to the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve your main HTML file
});

// Connect to the SQLite3 database hosted on Railway
const dbPath = '/data/leaderboard.db'; // Use the mount path for SQLite on Railway
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err);
    } else {
        console.log('Connected to the SQLite database');
    }
});

// Create the leaderboard table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        score INTEGER NOT NULL
    )
`, (err) => {
    if (err) {
        console.error('Error creating the table:', err);
    } else {
        console.log('Leaderboard table is ready');
    }
});

// API endpoint to fetch leaderboard data
app.get('/api/leaderboard', (req, res) => {
    db.all('SELECT nickname, score FROM scores ORDER BY score DESC', [], (err, rows) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send('Error fetching leaderboard data');
        }
        res.json(rows); // Send the results as a JSON response
    });
});

// API endpoint to save or update the score
app.post('/api/save_score', (req, res) => {
    const { nickname, score } = req.body;

    if (!nickname || score === undefined) {
        return res.status(400).send('Nickname and score are required.');
    }

    // Check if the user already has a score
    db.get('SELECT * FROM scores WHERE nickname = ?', [nickname], (err, row) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send('Error checking user score');
        }

        if (row) {
            // If the user exists and their score is higher than the stored one, update the score
            const existingScore = row.score;

            if (score > existingScore) {
                db.run('UPDATE scores SET score = ? WHERE nickname = ?', [score, nickname], (err) => {
                    if (err) {
                        console.error('Error updating score:', err);
                        return res.status(500).send('Error updating score');
                    }
                    res.json({ success: true, message: 'Score updated!' });
                });
            } else {
                // If the new score is not higher, do nothing
                res.json({ success: false, message: 'Score not high enough to update.' });
            }
        } else {
            // If the user does not exist, insert a new score record
            db.run('INSERT INTO scores (nickname, score) VALUES (?, ?)', [nickname, score], (err) => {
                if (err) {
                    console.error('Error inserting new score:', err);
                    return res.status(500).send('Error inserting score');
                }
                res.json({ success: true, message: 'Score added!' });
            });
        }
    });
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

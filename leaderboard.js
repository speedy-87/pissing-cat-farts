require('dotenv').config(); // Load environment variables
const sqlite3 = require('sqlite3').verbose(); // Import sqlite3 for SQLite database

// Connect to the SQLite3 database hosted on Railway
const dbPath = '/data/database.db'; // Correct path to your database on Railway
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err);
        return;
    }
    console.log('Connected to the SQLite database');
});

// Query the database to fetch leaderboard data
db.all('SELECT nickname, score FROM scores ORDER BY score DESC', [], (err, rows) => {
    if (err) {
        console.error('Error querying the database:', err);
        return;
    }

    console.log('Leaderboard:');
    rows.forEach(row => {
        console.log(`Nickname: ${row.nickname} - Score: ${row.score}`);
    });

    // Close the database connection after query execution
    db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err);
        }
        console.log('SQLite database connection closed');
    });
});

require('dotenv').config(); // Load environment variables
const mysql = require('mysql2');

// Create a connection to the database using environment variables from .env
const connection = mysql.createConnection({
    host: process.env.DB_HOST, // Use the DB_HOST from environment variables
    user: process.env.DB_USER, // Use the DB_USER from environment variables
    password: process.env.DB_PASS, // Use the DB_PASS from environment variables
    database: process.env.DB_NAME, // Use the DB_NAME from environment variables
});

// Query the database
connection.query('SELECT nickname, score FROM scores ORDER BY score DESC', (err, results) => {
    if (err) {
        console.error('Error querying the database:', err);
        return;
    }

    console.log('Leaderboard:');
    results.forEach(row => {
        console.log(`Nickname: ${row.nickname} - Score: ${row.score}`);
    });

    connection.end();
});

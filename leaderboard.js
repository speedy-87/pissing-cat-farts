require('dotenv').config(); // Load environment variables
const mysql = require('mysql2'); // Import mysql2 for MySQL database

// Connect to the MySQL database hosted on Railway
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// Check MySQL connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Query the database to fetch leaderboard data
db.query('SELECT nickname, score FROM scores ORDER BY score DESC', (err, rows) => {
    if (err) {
        console.error('Error querying the database:', err);
        return;
    }

    console.log('Leaderboard:');
    rows.forEach(row => {
        console.log(`Nickname: ${row.nickname} - Score: ${row.score}`);
    });

    // Close the database connection after query execution
    db.end((err) => {
        if (err) {
            console.error('Error closing the database:', err);
        }
        console.log('MySQL database connection closed');
    });
});

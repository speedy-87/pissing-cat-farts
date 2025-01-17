const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'JaxAndMuffin2!',
    database: 'leaderboard'
});

// Query the database
connection.query('SELECT nickname, score FROM scores ORDER BY score DESC', (err, results) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log('Leaderboard:');
    results.forEach(row => {
        console.log(`Nickname: ${row.nickname} - Score: ${row.score}`);
    });

    connection.end();
});

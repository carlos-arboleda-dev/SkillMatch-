
// const mysql = require('mysql2');

// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE,
//     port: 3306 // Cambia este puerto si tu base de datos usa otro
// });

// // Intento de conexión
// connection.connect((error) => {
//     if (error) {
//         console.error('El error de conexión es:', error); // Usa una coma para imprimir el error completo
//         return;
//     }
//     console.log('¡Conectado a la base de datos!');
// });

// module.exports = connection;

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error de conexión:', err);
        return;
    }
    console.log('¡Conectado a PostgreSQL!');
    release();
});

module.exports = pool;
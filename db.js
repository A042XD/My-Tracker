require('dotenv').config();
const mysql = require('mysql2/promise');

let pool = null;

async function ensureDbAndTable() {
    const tmpConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    });
    await tmpConn.query(`
        CREATE 
            DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` 
        CHARACTER SET 
            utf8mb4 
        COLLATE 
            utf8mb4_general_ci
    `);
    await tmpConn.end();

    console.log(`Database \`${process.env.DB_NAME}\` created.`);

    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5
    });
    console.log(`Created pool.`);
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS todos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            completed TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `;
    await pool.query(createTableSQL);
    console.log(`Queried.`);
}
async function insertTodo(title) {
    if (!pool) await ensureDbAndTable();
    const [result] = await pool.execute(
        `INSERT INTO todos (title, completed) VALUES (?, ?)`,
        [title, 0]
    );
    const insertId = result.insertId;
    const [rows] = await pool.execute(
        `SELECT * FROM todos WHERE id = ?`,
        [insertId]
    );
    return rows[0];
}
async function getTodos(){
    if (!pool) await ensureDbAndTable();
    const [rows] = await pool.execute(
        `SELECT * FROM todos ORDER BY id DESC`
    );
    return rows;
}
async function deleteTodo(id) {
    if (!pool) await ensureDbAndTable();
    const [result] = await pool.execute(
        `DELETE FROM todos WHERE id = ?`,
        [id]
    );
    return result.affectedRows > 0;
}
module.exports = {
    ensureDbAndTable, insertTodo, getTodos, deleteTodo
};
ensureDbAndTable();
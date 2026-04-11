const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function testDatabaseConnections() {
    console.log("Starting Database Feature Connectivity Test...\n");
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'haomysql123',
            database: process.env.DB_NAME || 'phongtro_db'
        });
        
        console.log("✅ Main Connection to MySQL Domain established.\n");
        
        // Let's find all tables to verify features
        const [tables] = await connection.query('SHOW TABLES');
        const dbNameKey = `Tables_in_${(process.env.DB_NAME || 'phongtro_db').toLowerCase()}`;
        
        if (tables.length === 0) {
             console.log("❌ No tables found in the database. Are migrations run?");
             return;
        }

        console.log("Testing individual feature tables:");
        for (const row of tables) {
            const tableName = row[dbNameKey] || Object.values(row)[0];
            try {
                const [result] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                console.log(`✅ Feature [${tableName.padEnd(25)}] -> Connection OK (Rows: ${result[0].count})`);
            } catch (err) {
                console.log(`❌ Feature [${tableName.padEnd(25)}] -> FAILED: ${err.message}`);
            }
        }
        
    } catch (err) {
        console.error("❌ Failed to connect to MySQL domain entirely:", err.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log("\nDatabase connection closed.");
        }
    }
}

testDatabaseConnections();

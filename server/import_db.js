require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function importDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    console.log(`Đang đọc file schema từ: ${schemaPath}...`);
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Loại bỏ lệnh CREATE DATABASE và USE không được phép chạy trên Cloud Database
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS[\s\S]*?;/i, '');
    sql = sql.replace(/USE\s+[\w_]+;/i, '');

    console.log('Đang kết nối đến MySQL database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('Kết nối thành công! Đang khởi tạo các bảng (tables)...');
    await connection.query(sql);
    console.log('✅ Đã tạo cấu trúc cơ sở dữ liệu thành công!');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo database:', error);
    process.exit(1);
  }
}

importDatabase();

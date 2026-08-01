Bước 1: Khởi chạy server
- Vào folder server, tạo 1 file .env với nội dung như sau:
# Server
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=(khúc này thay bằng mật khẩu MySQL của mình)
DB_NAME=room_rental

# JWT
JWT_SECRET=phongtro_super_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
-Vào terminal gõ lệnh: npm i
-Sau đó nhập: npm run dev

B2:Khởi chạy Web
-Quay về folder gốc, vào terminal nhập: npm i
-Sau đó nhập: npm run dev
# Hướng Dẫn Cài Đặt & Chạy Dự Án (Setup Guide)

Chào mừng bạn đến với dự án **Hệ thống Quản lý và Cho thuê Phòng trọ Trực tuyến**. Tài liệu này sẽ hướng dẫn chi tiết cách để một lập trình viên mới pull code từ Git về có thể thiết lập và chạy dự án thành công trên máy tính cá nhân.

## 1. Yêu cầu hệ thống (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt sẵn các phần mềm sau:
- **Node.js**: Phiên bản tối thiểu từ `v18.0.0` trở lên (Khuyến nghị dùng bản LTS mới nhất). Bạn có thể tải tại [nodejs.org](https://nodejs.org/).
- **Trình quản lý gói (Package Manager)**: `npm` (được cài đặt sẵn cùng Node.js).
- **Trình soạn thảo mã (Code Editor)**: VS Code (Khuyên dùng) hoặc bất kỳ trình IDE nào.

## 2. Cài đặt thư viện (Install Dependencies)
Sau khi clone/pull source code từ repository về máy, hãy mở Terminal (Command Prompt / PowerShell / Bash) và di chuyển vào thư mục gốc của dự án. Sau đó chạy lệnh sau để tải về các thư viện cần thiết:

```bash
npm install
```
*(Quá trình này có thể mất từ 1 - 3 phút tùy tốc độ mạng).*

## 3. Chạy dự án (Run Development Server)
Sau khi cài đặt xong thư viện, bạn có thể khởi động server phát triển bằng lệnh:

```bash
npm run dev
```

Server sẽ khởi chạy cực kỳ nhanh nhờ sức mạnh của Vite. Mở trình duyệt và truy cập vào đường dẫn:
👉 **http://localhost:5173** (Hoặc cổng khác nếu 5173 đang bị chiếm dụng, Vite sẽ hiển thị cổng cụ thể trên Terminal).

## 4. Build & Preview cho Môi trường Production
Nếu bạn muốn build thử dự án để kiểm tra lỗi cú pháp TypeScript và xem kết quả tối ưu hóa file tĩnh:

```bash
# Build dự án (Kiểm tra lỗi TS & Đóng gói)
npm run build

# Chạy server preview để xem thư mục dist vừa build
npm run preview
```

## 5. Lưu ý quan trọng về API (Mock Data)
- **Không cần setup Backend / Database**: Dự án hiện tại đang sử dụng thư viện `axios-mock-adapter` để giả lập (mock) toàn bộ dữ liệu trả về từ API (xem file `src/api/mockData.ts` và `src/api/mock.ts`).
- **Tài khoản đăng nhập Test**: Bạn có thể đăng ký tài khoản mới ngay trên giao diện web hoặc đăng nhập bằng bất kỳ tài khoản nào đã đăng ký trong quá trình test. Mọi dữ liệu (User, Phòng trọ, Hợp đồng...) đều được lưu trữ trực tiếp trong bộ nhớ tạm (Session / Local Storage kết hợp Mock Data).
- Khi bạn F5 hoặc refresh trang, dữ liệu cơ bản vẫn được giữ lại, tuy nhiên nếu đổi trình duyệt hoặc xóa cache, bạn sẽ thao tác với dữ liệu mock ban đầu.

---
*Nếu gặp bất kỳ lỗi nào trong quá trình `npm install` liên quan đến xung đột phiên bản, hãy thử xóa thư mục `node_modules` và file `package-lock.json`, sau đó chạy lại lệnh `npm install`.*

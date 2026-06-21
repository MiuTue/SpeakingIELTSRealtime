# Hướng dẫn Setup Database Local & Deploy Backend lên Railway

Tài liệu này hướng dẫn chi tiết cách thiết lập cơ sở dữ liệu PostgreSQL ở môi trường local bằng Docker và các bước deploy ứng dụng backend (Next.js & Prisma) lên Railway.

---

## 🛠️ Phần 1: Thiết lập Database Local (PostgreSQL)

Để chạy dự án ở máy cá nhân, bạn cần cài đặt một cơ sở dữ liệu PostgreSQL. Cách nhanh nhất là sử dụng Docker.

### 1. Chuẩn bị
*   **Docker Desktop**: Đã được cài đặt và đang chạy trên máy Mac của bạn.
*   **Node.js & npm**: Đã cài đặt phiên bản phù hợp (Node.js >= 20).

### 2. Các bước thực hiện
1.  **Cấu hình biến môi trường local**:
    Copy file `.env.example` thành `.env` ở thư mục gốc:
    ```bash
    cp .env.example .env
    ```
    Mở file `.env` lên và điều chỉnh các giá trị (chú ý `DATABASE_URL` mặc định đã được cấu hình khớp với Docker Compose).

2.  **Khởi động Postgres Container**:
    Chạy script npm đã được thiết lập sẵn trong `package.json`:
    ```bash
    npm run db:up
    # Lệnh này tương đương với: docker compose up -d db
    ```
    Lệnh này tải ảnh Docker của PostgreSQL 16-alpine về máy và khởi chạy nó ở cổng `5432` ngầm dưới background.

3.  **Tạo database schema & Khởi tạo Prisma Client**:
    ```bash
    # Sinh mã Prisma Client tương ứng với Schema của dự án
    npm run db:generate

    # Đẩy Schema trực tiếp lên cơ sở dữ liệu local
    npm run db:push
    ```

4.  **Seed tài khoản Admin đầu tiên**:
    Dự án sử dụng file seed để tạo tài khoản admin. Bạn cần thiết lập mật khẩu admin trong `.env` hoặc truyền trực tiếp qua CLI:
    ```bash
    ADMIN_INITIAL_PASSWORD="mat_khau_admin_cua_ban_123" npm run db:seed
    ```
    *Mặc định tài khoản admin sẽ là `winna123456pro@gmail.com`.*

5.  **Chạy ứng dụng Local**:
    ```bash
    npm run dev
    ```
    Tru cập `http://localhost:3000` để bắt đầu phát triển.

6.  **Tắt database khi không dùng nữa**:
    ```bash
    npm run db:down
    ```

---

## 🚀 Phần 2: Hướng dẫn Deploy Backend lên Railway

[Railway](https://railway.app) là nền tảng Cloud phù hợp để deploy ứng dụng Next.js kết hợp database PostgreSQL và lưu trữ tệp tin.

### 1. Tạo dự án và Cơ sở dữ liệu trên Railway
1.  Truy cập [railway.app](https://railway.app) và đăng nhập bằng tài khoản GitHub của bạn.
2.  Bấm **New Project** ➔ Chọn **Provision PostgreSQL**.
3.  Railway sẽ khởi tạo một dịch vụ Database PostgreSQL riêng biệt cho bạn.

### 2. Deploy ứng dụng Backend
Có hai cách để deploy code của bạn lên Railway:

#### **Cách A: Deploy tự động qua GitHub (Khuyên dùng)**
1.  Đưa mã nguồn của bạn lên một kho lưu trữ GitHub (Private hoặc Public).
2.  Trên giao diện Railway Project, chọn **New** ➔ **GitHub Repo**.
3.  Chọn repository dự án `SpeakingAI`.
4.  Railway sẽ tự động liên kết và deploy mỗi khi bạn `git push` code mới lên nhánh chính (main/master).

#### **Cách B: Deploy trực tiếp từ máy qua CLI**
1.  Cài đặt Railway CLI trên Mac:
    ```bash
    brew install railway
    ```
2.  Đăng nhập: `railway login`
3.  Liên kết thư mục hiện tại với dự án trên Railway:
    ```bash
    railway link
    ```
4.  Đẩy code lên deploy:
    ```bash
    railway up
    ```

---

### 3. Thiết lập biến môi trường (Environment Variables) trên Railway
Bạn cần cấu hình các biến môi trường trong dịch vụ ứng dụng của mình (vào tab **Variables** trong dịch vụ app của Railway):

| Tên biến | Giá trị / Cách cấu hình |
| :--- | :--- |
| `DATABASE_URL` | Liên kết dịch vụ PostgreSQL: Bấm vào **Add Variable** ➔ Chọn **Reference Reference** ➔ Chọn dịch vụ Postgres vừa tạo để lấy biến `DATABASE_URL`. |
| `BETTER_AUTH_SECRET` | Một chuỗi ngẫu nhiên dài tối thiểu 32 ký tự (Ví dụ: chạy lệnh `openssl rand -hex 32` dưới terminal để sinh mã). |
| `BETTER_AUTH_URL` | Địa chỉ URL domain mà Railway cấp cho app của bạn (Ví dụ: `https://speakielts-ai-production.up.railway.app`). |
| `NEXT_PUBLIC_APP_URL` | Giống với `BETTER_AUTH_URL`. |
| `GEMINI_API_KEY` | API Key của bạn lấy từ Google AI Studio để chạy AI chấm điểm. |
| `GEMINI_EVALUATOR_MODEL` | Chọn model AI sử dụng (ví dụ: `gemini-2.5-flash-lite` hoặc `gemini-2.5-flash`). |
| `AUDIO_STORAGE_DIR` | Điền là `/app/.data/audio` (Đường dẫn lưu trữ audio). |
| `AUDIO_UPLOAD_SECRET` | Chuỗi ngẫu nhiên để xác thực upload file từ mobile app. |
| `ADMIN_INITIAL_PASSWORD` | Mật khẩu tài khoản admin dùng khi chạy seed dữ liệu lần đầu. |

---

### 4. Gắn persistent volume (Bộ nhớ lưu trữ âm thanh)
Do container của Railway là ephemeral (tệp tin tự động biến mất khi ứng dụng khởi động lại hoặc deploy lại), bạn **bắt buộc** phải sử dụng dịch vụ Volume của Railway để lưu giữ các tệp ghi âm luyện nói của học viên.

1.  Tại giao diện dự án Railway, bấm vào dịch vụ App của bạn.
2.  Chuyển sang tab **Settings**.
3.  Kéo xuống phần **Volumes** ➔ Chọn **Add Volume**.
4.  Cấu hình Volume:
    *   **Mount Path**: Điền chính xác `/app/.data/audio`.
    *   **Size**: Chọn dung lượng mong muốn (ví dụ: 5GB hoặc 10GB).
5.  Bấm **Save**. Railway sẽ tự động khởi động lại ứng dụng và gắn bộ nhớ này vào thư mục chứa file âm thanh.

---

### 5. Tự động hóa Migration
Dự án đã có cấu hình file [railway.toml](file:///Users/miutue/Coding%20Project/SpeakingAiAssistane/railway.toml):
```toml
[deploy]
preDeployCommand = ["npm run db:migrate"]
```
Mỗi khi deploy phiên bản mới, Railway sẽ tự động chạy lệnh `npm run db:migrate` (áp dụng database migrations) **trước khi** ứng dụng Next.js chính thức khởi động. Bạn không cần làm thủ công bước này trên production.

---

## 🐳 Phần 3: Deploy & Chạy Backend bằng Docker

Tôi đã tạo sẵn file [Dockerfile](file:///Users/miutue/Coding%20Project/SpeakingAiAssistane/Dockerfile) (cấu trúc Multi-stage tối ưu) và cập nhật [docker-compose.yml](file:///Users/miutue/Coding%20Project/SpeakingAiAssistane/docker-compose.yml) để bạn có thể container hóa toàn bộ hệ thống backend.

### 1. Cấu trúc Dockerfile của Backend
File [Dockerfile](file:///Users/miutue/Coding%20Project/SpeakingAiAssistane/Dockerfile) hoạt động qua 3 giai đoạn (Multi-stage build):
1.  **Stage 1 (`deps`)**: Cài đặt các thư viện cần thiết (`node_modules`) cho toàn bộ monorepo dự án.
2.  **Stage 2 (`builder`)**: Copy code, chạy Prisma client generator (`npx prisma generate`), và compile dự án Next.js (`npm run build`).
3.  **Stage 3 (`runner`)**: Tạo môi trường production gọn nhẹ chỉ chứa các tài nguyên đã build, phân quyền thư mục tệp ghi âm và chạy server qua user `nextjs` không có quyền root (đảm bảo bảo mật).

### 2. Chạy toàn bộ Stack (Backend + DB) bằng Docker Compose
Tôi đã liên kết Next.js Server (`web`) và PostgreSQL Database (`db`) lại trong file [docker-compose.yml](file:///Users/miutue/Coding%20Project/SpeakingAiAssistane/docker-compose.yml). Để chạy toàn bộ dự án trên máy bằng Docker:

1.  Đảm bảo file `.env` ở thư mục gốc chứa các khóa môi trường như `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`.
2.  Khởi động toàn bộ stack bằng lệnh:
    ```bash
    docker compose up --build -d
    ```
    *Lệnh này sẽ build Docker image cho backend, kết nối nó với DB Postgres, tạo volume lưu trữ tệp ghi âm (`speakielts_audio_data`), và chạy tất cả dưới nền.*
3.  Truy cập vào ứng dụng qua địa chỉ `http://localhost:3000`.
4.  Khi muốn dừng toàn bộ hệ thống:
    ```bash
    docker compose down
    ```

### 3. Deploy lên Railway bằng Dockerfile
Mặc định Railway sẽ tự động phát hiện [Dockerfile](file:///Users/miutue/Coding%20Project/SpeakingAiAssistane/Dockerfile) ở thư mục gốc của repo và sử dụng nó để build ứng dụng (thay thế cho Railpack/Nixpacks mặc định).

*   Nếu bạn muốn chỉ định bắt buộc Railway build bằng Dockerfile: Vào cài đặt dịch vụ App trên Railway ➔ Tab **Settings** ➔ Tìm mục **Build** ➔ Đảm bảo phần **Build Pack** được chọn là **Dockerfile**.


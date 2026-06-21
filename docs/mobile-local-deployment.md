# Hướng dẫn Build & Deploy Mobile App lên Thiết bị cá nhân (Local Device)

Tài liệu này hướng dẫn chi tiết cách build, deploy và cấu hình ứng dụng **SpeakIELTS AI** lên thiết bị di động cá nhân (iPhone/iPad hoặc Android) của bạn để tự sử dụng.

---

## 📌 Các bước chuẩn bị trước khi build

Để ứng dụng trên điện thoại có thể giao tiếp được với server backend chạy trên máy tính của bạn (hoặc production), bạn cần cấu hình lại API URL.

### Cấu hình Endpoint API (`mobile/.env`)
Trong thư mục `mobile`, tạo hoặc chỉnh sửa file `.env` hoặc sử dụng các biến môi trường hệ thống.
Mặc định nếu bạn không cấu hình, app sẽ gọi tới `http://localhost:3000` (sẽ lỗi trên thiết bị thật vì `localhost` lúc này trỏ vào chính chiếc điện thoại).

*   **Trường hợp 1: Chạy backend local (Máy tính và điện thoại chung mạng Wi-Fi)**
    Tìm địa chỉ IP nội bộ của Mac (ví dụ: `192.168.1.15` bằng cách vào *System Settings > Wi-Fi > Details* hoặc chạy lệnh `ipconfig getifaddr en0`).
    Cấu hình trong file `mobile/.env`:
    ```env
    EXPO_PUBLIC_API_URL=http://192.168.1.15:3000
    ```
*   **Trường hợp 2: Chạy backend đã deploy (ví dụ: trên Railway/Vercel)**
    Cấu hình URL backend production của bạn:
    ```env
    EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
    ```

---

## 🛠️ Cách 1: Build & Chạy trực tiếp qua USB (Khuyên dùng - Hoàn toàn miễn phí)

Cách này sẽ biên dịch mã nguồn native của ứng dụng trực tiếp trên máy Mac của bạn bằng Xcode (iOS) hoặc Android Studio (Android) và cài đặt lên điện thoại.

### A. Đối với iOS (iPhone/iPad)

#### **Yêu cầu chuẩn bị:**
1.  **Xcode**: Đã cài đặt trên Mac (tải từ App Store).
2.  **Developer Mode trên iPhone**: 
    *   Cắm cáp nối iPhone với máy Mac.
    *   Trên iPhone, vào **Settings > Privacy & Security > Developer Mode** và **Bật (Turn On)**. Khởi động lại điện thoại theo yêu cầu.
3.  **Tài khoản Apple ID**: Bạn chỉ cần Apple ID cá nhân thông thường (miễn phí), không bắt buộc phải mua tài khoản Developer $99/năm.

#### **Thực hiện build:**
1.  Mở terminal tại thư mục `mobile` của dự án.
2.  Chạy lệnh để build và cài đặt trực tiếp lên thiết bị:
    ```bash
    npm run ios -- --device
    # Hoặc: npx expo run:ios --device
    ```
3.  Expo CLI sẽ quét các thiết bị đang kết nối qua USB. Bạn hãy chọn tên điện thoại iPhone của mình từ danh sách.
4.  **Lần đầu chạy**: Xcode sẽ hỏi thông tin Apple ID để tạo chứng chỉ ký ứng dụng (Code Signing).
    *   Hãy chọn tài khoản Apple ID cá nhân của bạn (Personal Team).
5.  Sau khi build thành công, ứng dụng **SpeakIELTS AI** sẽ xuất hiện trên màn hình iPhone.
6.  **Cấp quyền tin cậy chứng chỉ (Trust Developer Certificate)**:
    *   Lần đầu mở ứng dụng trên iPhone, bạn sẽ thấy thông báo "Untrusted Developer".
    *   Trên iPhone, hãy vào **Settings > General > VPN & Device Management**.
    *   Chọn tài khoản Apple ID của bạn bên dưới mục *Developer App* và bấm **Trust**.
7.  Mở lại ứng dụng và bắt đầu luyện nói!

> [!NOTE]
> Khi chạy ở chế độ Development Client (`npx expo run:ios --device`), bạn cần giữ Terminal trên máy Mac chạy dev server (`npm start`) và điện thoại của bạn kết nối chung mạng Wi-Fi với Mac để tải mã nguồn Javascript. 

---

### B. Đối với Android

#### **Yêu cầu chuẩn bị:**
1.  **USB Debugging**: 
    *   Trên điện thoại Android, vào **Settings > About Phone** và nhấn liên tục 7 lần vào mục **Build Number** để kích hoạt *Developer Options*.
    *   Vào **Settings > Developer Options** và bật **USB Debugging**.
2.  Cắm cáp kết nối điện thoại Android với Mac.

#### **Thực hiện build:**
1.  Mở terminal tại thư mục `mobile`.
2.  Chạy lệnh build:
    ```bash
    npm run android
    # Hoặc: npx expo run:android --device
    ```
3.  Expo CLI sẽ biên dịch ứng dụng và tự động cài đặt file APK lên thiết bị Android của bạn.

---

## 📦 Cách 2: Build App Ngoại tuyến (Release Mode - Standalone App)

Nếu bạn muốn cài đặt app lên máy để mang đi sử dụng mọi lúc mọi nơi (sử dụng mạng 4G/Wi-Fi ngoài đường) mà **không cần bật máy tính chạy Dev Server**, bạn cần build ở chế độ **Release Mode**.

### Yêu cầu bắt buộc:
*   Phải cấu hình `EXPO_PUBLIC_API_URL` trỏ tới link backend đã deploy (như Railway/Vercel).
*   Điện thoại cần kết nối mạng để gọi API lên server.

### Thực hiện:
*   **iOS**:
    ```bash
    npx expo run:ios --configuration Release --device
    ```
    Xcode sẽ compile ứng dụng ở chế độ tối ưu hóa hiệu năng và đóng gói offline hoàn toàn vào thiết bị của bạn. Bạn có thể rút cáp, mang máy đi và app vẫn hoạt động bình thường!
*   **Android**:
    ```bash
    npx expo run:android --variant release
    ```
    Ứng dụng sẽ được cài đặt dưới dạng file APK Release độc lập trên điện thoại Android của bạn.

---

## 🚀 Cách 3: Build & Deploy qua EAS Build (Cloud-based)

Nếu bạn không muốn tự compile trên máy Mac (hoặc muốn gửi link cài đặt cho bạn bè cài thử), bạn có thể dùng **EAS Build** của Expo để build trên cloud.

1.  Cài đặt EAS CLI: `npm install -g eas-cli`
2.  Đăng nhập tài khoản Expo: `eas login`
3.  Cấu hình thiết bị nhận (chỉ dành cho iOS để đăng ký UDID thiết bị với Apple):
    ```bash
    eas device:create
    ```
4.  Chạy lệnh build trên Cloud:
    ```bash
    eas build --profile development --platform ios
    ```
5.  Sau khi build xong trên Cloud (khoảng 5-10 phút), Expo sẽ cung cấp một **QR Code** trên trang web hoặc terminal. Bạn chỉ cần quét mã QR này bằng Camera iPhone để cài đặt trực tiếp ứng dụng.

# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN HỆ THỐNG QUICKONE POS
## ຄູ່ມືການນຳໃຊ້ລະບົບ QUICKONE POS ສະບັບສົມບູນ (ALL FEATURES MANUAL)

> **Hệ thống Quản lý Bán lẻ & Điểm bán hàng chuyên nghiệp cho Minimart / Siêu thị tiện lợi**  
> *Ngôn ngữ giao diện:* Tiếng Lào (`ພາສາລາວ`) & Tiếng Anh (`English`)  
> *Đơn vị tiền tệ chuẩn:* Kíp Lào (LAK - `₭`)  
> *Chuẩn hiển thị:* Tối ưu màn hình cảm ứng POS 1366x768 & Khổ in nhiệt 80mm ESC/POS  
> *Kiến trúc kỹ thuật:* Offline-First (Bán hàng liên tục khi mất mạng, tự động đồng bộ Cloud)

---

## MỤC LỤC TỔNG QUAN CÁC TÍNH NĂNG
1. [Tổng quan Kiến trúc & Thiết bị ngoại vi](#1-tổng-quan-kiến-trúc--thiết-bị-ngoại-vi)
2. [Đăng nhập, Phân quyền & Mã PIN Thu ngân (Authentication & Staff Security)](#2-đăng-nhập-phân-quyền--mã-pin-thu-ngân)
3. [Quy trình Quản lý Ca Bán hàng (Cashier Shifts & Blind Close)](#3-quy-trình-quản-lý-ca-bán-hàng-cashier-shifts)
4. [Màn hình Bán hàng Thu ngân POS (POS Terminal & Barcode Engine)](#4-màn-hình-bán-hàng-thu-ngân-pos)
5. [Quy trình Thanh toán & In Hóa đơn (Checkout, LAO QR & Receipts)](#5-quy-trình-thanh-toán--in-hóa-đơn)
6. [Quản lý Danh mục Hàng hóa (Categories Management)](#6-quản-lý-danh-mục-hàng-hóa)
7. [Quản lý Sản phẩm, Mã vạch & Đa đơn vị đóng gói (Products & Packaging Units)](#7-quản-lý-sản-phẩm-mã-vạch--đa-đơn-vị-đóng-gói)
8. [Quản lý Kho hàng, Nhập kho GRN & Hạn sử dụng FEFO (Inventory & FEFO Management)](#8-quản-lý-kho-hàng-nhập-kho-grn--hạn-sử-dụng-fefo)
9. [Lịch sử Hóa đơn, In lại & Quy trình Đổi trả hàng (Orders History & Refund)](#9-lịch-sử-hóa-đơn-in-lại--quy-trình-đổi-trả-hàng)
10. [Báo cáo Thống kê & Phân tích Doanh thu (Dashboard Analytics)](#10-báo-cáo-thống-kê--phân-tích-doanh-thu)
11. [Cấu hình Hệ thống, Máy in & Tài khoản Thu ngân (Settings & Hardware Management)](#11-cấu-hình-hệ-thống-máy-in--tài-khoản-thu-ngân)
12. [Bảng Phím tắt Nhanh & Hướng dẫn Xử lý Sự cố Kỹ thuật (Shortcuts & Troubleshooting)](#12-bảng-phím-tắt-nhanh--hướng-dẫn-xử-lý-sự-cố-kỹ-thuật)

---

## 1. TỔNG QUAN KIẾN TRÚC & THIẾT BỊ NGOẠI VI

### 1.1. Mô hình hoạt động Ngoại tuyến (Offline-First Architecture)
- QuickOne POS hoạt động dựa trên cơ chế lưu trữ dữ liệu đa tầng:
  - **Tầng cục bộ (IndexedDB / Dexie.js):** Mọi giao dịch bán hàng, quét mã vạch, mở/đóng ca và in hóa đơn được lưu trữ trực tiếp trên bộ nhớ máy thu ngân. Ngay cả khi mất kết nối mạng Internet hoặc đường truyền mạng chập chờn, thu ngân vẫn thao tác mượt mà không bị trễ hay gián đoạn.
  - **Tầng Cloud (Supabase PostgreSQL):** Ngay khi có tín hiệu Internet trở lại, hệ thống chạy tiến trình đồng bộ ngầm tự động đẩy dữ liệu lên Cloud mà không cần thu ngân can thiệp thủ công.

### 1.2. Chuẩn hóa phần cứng quầy thu ngân
- **Màn hình POS cảm ứng:** Giao diện được thiết kế chuẩn tỷ lệ cho độ phân giải phổ thông **1366x768** của các dòng máy POS cảm ứng All-in-One (Sunmi, Posiflex, Ocha, Windows POS), bố cục tinh gọn, không phát sinh thanh cuộn ngoài ý muốn.
- **Máy quét mã vạch (Barcode Scanner):** Hỗ trợ toàn bộ dòng máy quét cổng USB, Wireless 2.4GHz, Bluetooth hoặc máy quét đa tia để bàn. Tích hợp bộ giải mã phần cứng tự động sửa lỗi bộ gõ tiếng Lào, tiếng Thái, tiếng Việt.
- **Máy in nhiệt khổ 80mm:** Hỗ trợ cổng LAN (mạng dây/Wifi), USB và Bluetooth với tập lệnh ESC/POS tốc độ cao.
- **Két đựng tiền (Cash Drawer):** Kết nối qua cổng RJ11 phía sau máy in nhiệt, kích xung mở khóa tự động khi bấm hoàn tất thanh toán tiền mặt.

---

## 2. ĐĂNG NHẬP, PHÂN QUYỀN & MÃ PIN THU NGÂN
> *Tên hiển thị:* **`ເຂົ້າສູ່ລະບົບ` (Login) & `ຢືນຢັນລະຫັດ PIN` (Staff PIN)**

### 2.1. Đăng nhập hệ thống (System Login)
1. Truy cập vào địa chỉ phần mềm QuickOne POS trên trình duyệt hoặc phần mềm POS.
2. Nhập **Tên đăng nhập / Email** và **Mật khẩu**.
3. Nhấn nút **`ເຂົ້າສູ່ລະບົບ` (Đăng nhập)**.
4. Hệ thống kiểm tra xác thực và tự động chuyển hướng vào màn hình Bán hàng POS hoặc Dashboard tùy theo phân quyền tài khoản.

### 2.2. Phân quyền tài khoản (3 Cấp bậc bảo mật)
- **Cấp 1 - Chủ cửa hàng / Quản trị viên (`ເຈົ້າຂອງຮ້ານ / Admin`):** Có toàn quyền truy cập tất cả tính năng, báo cáo doanh thu, cài đặt máy in, sửa giá vốn và quản lý nhân sự.
- **Cấp 2 - Quản lý cửa hàng (`ຜູ້ຈັດການຮ້ານ / Manager`):** Có quyền duyệt phiếu nhập kho, điều chỉnh kiểm kê kho, đóng ca bị treo, xem lịch sử đơn hàng và xử lý đổi trả hàng.
- **Cấp 3 - Thu ngân (`ພະນັກງານຂາຍ / Cashier`):** Chỉ có quyền mở ca, bán hàng tại màn hình POS, đóng ca kiểm ngân mù và in phiếu tính tiền; bị khóa quyền xem giá vốn, chỉnh sửa giá bán hoặc xóa dữ liệu tồn kho.

### 2.3. Khóa màn hình & Đăng nhập nhanh bằng mã PIN 6 số (`Staff PIN`)
- Khi thu ngân rời khỏi quầy để đi vệ sinh hoặc giao ca tạm thời:
  1. Nhấn vào tên tài khoản ở góc phải phía trên -> chọn **`ລັອກໜ້າຈໍ` (Khóa màn hình)**.
  2. Màn hình hiển thị bàn phím số bảo mật yêu cầu nhập mã PIN.
  3. Thu ngân quay lại chỉ cần chạm 6 số mã PIN cá nhân trên màn hình cảm ứng để mở khóa ngay lập tức mà không cần gõ lại mật khẩu dài.

---

## 3. QUY TRÌNH QUẢN LÝ CA BÁN HÀNG (CASHIER SHIFTS)
> *Đường dẫn menu:* **`ປະຫວັດບິນ & ກະ`** -> **`ຄຸ້ມຄອງກະຂາຍເຄື່ອງ` (Quản lý ca)**

Quy trình quản lý ca giúp chủ cửa hàng kiểm soát chặt chẽ dòng tiền mặt, loại bỏ hoàn toàn nguy cơ thất thoát và đối soát minh bạch giữa các ca trực.

### 3.1. Quy tắc Ca duy nhất (Single Shift Rule)
- Tại một thời điểm, toàn bộ hệ thống chỉ cho phép duy nhất **1 Ca bán hàng ở trạng thái mở (`ກຳລັງເປີດຂາຍ`)**.
- Nếu ca trước chưa được đóng, hệ thống sẽ ngăn không cho mở ca mới để tránh tình trạng cộng dồn doanh thu nhầm lẫn giữa các nhân viên.

### 3.2. Mở ca đầu ngày / đầu ca trực (Open Shift)
1. Tại trang Quản lý ca, nhấn nút **`ເປີດກະຂາຍເຄື່ອງໃໝ່` (Mở ca mới)**.
2. Khai báo số tiền mặt mang vào két để thối tiền (**Opening Cash Float**). Thu ngân có thể nhập số hoặc bấm các nút chọn nhanh:
   - `200.000 ₭`
   - `300.000 ₭`
   - `500.000 ₭`
   - `1.000.000 ₭`
3. Nhập ghi chú ca trực (ví dụ: *"Ca sáng - Thu ngân Somphone nhận ca"*).
4. Nhấn nút **`ຢືນຢັນເປີດກະ` (Xác nhận mở ca)**. Hệ thống sẽ kích hoạt trạng thái ca và cho phép thanh toán tại quầy POS.

### 3.3. Đóng ca kiểm ngân mù bảo mật (Blind Close Reconciliation)
Vào cuối ca, thu ngân tiến hành kiểm đếm tiền. QuickOne POS áp dụng quy chuẩn **Blind Close** (Kiểm ngân mù): **Ẩn hoàn toàn doanh số bán trong ca để thu ngân đếm tiền độc lập, không thể sửa số liệu để khớp gian lận**.

1. Tại thẻ ca đang mở (`ກະຂາຍປັດຈຸບັນກຳລັງເປີດຢູ່`), nhấn nút **`ປິດກະ & ນັບເງິນ`**.
2. Hộp thoại Đóng ca xuất hiện với thiết kế thu gọn tối ưu màn hình 1366x768, hỗ trợ **2 chế độ kiểm đếm**:
   - **Chế độ 1 (Mặc định - `ນັບຕາມໃບເງິນ`):** Lưới 2 cột đếm từng mệnh giá tiền Kíp Lào:
     - *Cột trái (Mệnh giá lớn):* `100.000 ₭`, `50.000 ₭`, `20.000 ₭`, `10.000 ₭`
     - *Cột phải (Mệnh giá nhỏ):* `5.000 ₭`, `2.000 ₭`, `1.000 ₭`, `500 ₭`
     - Thu ngân đếm số tờ tiền thực tế trong két và gõ số tờ vào từng ô, hệ thống tự động nhân và tính tổng tiền mặt.
   - **Chế độ 2 (`ປ້ອນຍອດລວມໂດຍກົງ`):** Chuyển sang chế độ này khi thu ngân đã đếm tổng tiền mặt bên ngoài và chỉ cần gõ 1 con số tổng duy nhất.
3. Nhập số tiền chuyển khoản ngân hàng đối chiếu được trên app ngân hàng vào ô **`ຍອດໂອນ LAO QR`**.
4. Nhập ghi chú bàn giao (nếu có tiền chi trả lặt vặt như mua đá, túi nilon...).
5. Nhấn nút **`ຢືນຢັນປິດກະ ແລະ ເບິ່ງຜົນ` (Xác nhận đóng ca và xem kết quả)**.

### 3.4. Xem kết quả đối soát & In phiếu tổng kết ca (Z-Report 80mm)
Ngay sau khi xác nhận đóng ca, màn hình **Phiếu đối soát Z-Report** sẽ hiển thị kết quả kiểm ngân chi tiết:
- **Tiền đầu ca (Opening Float):** Tiền thối mang vào lúc mở ca.
- **Doanh thu tiền mặt (Cash Sales):** Tổng tiền các đơn thanh toán tiền mặt trong ca.
- **Tiền kỳ vọng trong két (Expected Cash):** `Tiền đầu ca + Doanh thu tiền mặt`.
- **Tiền thực tế kiểm đếm (Actual Cash):** Số tiền thu ngân vừa đếm được.
- **Chênh lệch (Variance):**
  - **Màu xanh lục (`0 ₭`):** Khớp tiền 100%, không thừa không thiếu.
  - **Màu cam (`+ ... ₭`):** Thừa tiền mặt (Surplus).
  - **Màu đỏ (`- ... ₭`):** Thiếu tiền mặt (Shortage - cần giải trình).
- **In phiếu chốt ca:** Nhấn nút **`ພິມໃບສະຫຼຸບປິດກະ (80mm)`** để in phiếu Z-Report ra máy in nhiệt 80mm, có đầy đủ chi tiết số tờ tiền từng mệnh giá và dòng chữ ký bàn giao giữa Thu ngân và Quản lý.

### 3.5. Xử lý ca cũ bị treo (Stranded Shifts)
- Nếu ca hôm trước nhân viên quên đóng ca khiến ca bị treo qua ngày hôm sau:
- Trong bảng **Shift History**, ca bị treo sẽ có nhãn cảnh báo màu cam **`ກະຄ້າງ`**.
- Quản lý hoặc thu ngân chỉ cần nhấn nút **`ປິດກະຄ້າງ`** ngay tại dòng đó và xác nhận để đóng dứt điểm ca cũ, giải phóng trạng thái hệ thống để mở ca mới.

---

## 4. MÀN HÌNH BÁN HÀNG THU NGÂN POS
> *Đường dẫn menu:* **`ລາຍໜ້າຮ້ານ (POS)`** *(Giao diện bán hàng chính)*

### 4.1. Quét mã vạch tự do không cần chạm chuột (Global Hardware Scanner)
- **Cơ chế hoạt động:** Thu ngân cầm máy quét mã vạch và bóp cò ở bất kỳ thời điểm nào, con trỏ chuột không cần nằm trong ô tìm kiếm.
- **Thời gian phản hồi:** Dưới 0.05 giây, sản phẩm tự động nhảy thẳng vào giỏ hàng.
- **Âm thanh phản hồi trực quan:**
  - Tiếng *"Tít"* cao (Success Beep): Quét thành công, hiển thị banner thông báo màu xanh.
  - Tiếng *"Bè"* thấp (Error Buzz): Không tìm thấy mã vạch này trong danh mục hàng hóa.

### 4.2. Quét mã vạch khi con trỏ đang nằm trong ô tìm kiếm (F1 Search Box)
- Khi thu ngân đang nhấn chuột vào ô tìm kiếm hoặc đang gõ chữ dở dang mà quét mã vạch:
  - Máy quét sẽ truyền đúng dãy số mã vạch `8854698005050`.
  - Hệ thống nhận diện tín hiệu kết thúc (Enter) của máy quét, thêm món vào giỏ hàng ngay lập tức.
  - **Tự động làm sạch ô tìm kiếm (Auto-Clear Input):** Xóa trống ô tìm kiếm ngay sau khi thêm hàng thành công để sẵn sàng cho lần quét tiếp theo mà thu ngân không cần nhấn Backspace xóa thủ công.

### 4.3. Cơ chế giải mã phần cứng chống lỗi bộ gõ bàn phím quốc tế
- Hệ thống tích hợp sẵn thuật toán giải mã phần cứng thông minh:
  - Khi máy tính đang bật **bàn phím tiếng Lào**: `66໌4ຼ7688໌8໌8` -> tự động chuyển thành `8854698005050`.
  - Khi máy tính đang bật **bàn phím tiếng Thái**: `๕๕๔๓ู๖๕๗๗๔๗๔๗` -> tự động chuyển thành `8854698005050`.
  - Khi máy tính đang bật **bàn phím tiếng Việt / Kẹt phím Shift / Caps Lock**: `**%$^(*))%)%)` -> tự động chuyển thành `8854698005050`.
- Nhân viên thu ngân hoàn toàn không phải để ý chỉnh đổi ngôn ngữ bàn phím của máy tính.

### 4.4. Cú pháp nhân số lượng nhiều món siêu tốc (`SốLượng*MãVạch`)
- Khi khách mua số lượng lớn cùng 1 mặt hàng (ví dụ 12 lon nước ngọt hoặc 24 chai bia):
  1. Nhấn phím **`F1`** trên bàn phím.
  2. Gõ số lượng kèm dấu sao `*` (ví dụ gõ: **`12*`**).
  3. Cầm máy quét bóp cò vào mã vạch lon nước **đúng 1 lần**.
  4. Hệ thống sẽ thêm ngay lập tức **12 món** vào giỏ hàng mà không phải quét 12 lần liên tục.

### 4.5. Bán hàng theo Đơn vị quy cách (Thùng / Lốc / Hộp)
- Đối với các mặt hàng có quy cách đóng gói đa tầng:
  - Quét mã vạch trên lon -> Bán giá lẻ từng lon (`ອັນ`).
  - Quét mã vạch ngoài màng lốc -> Bán giá lốc (`ແພັກ`).
  - Quét mã vạch ngoài vỏ thùng -> Bán giá nguyên thùng (`ແກັດ`).
- Ngoài việc quét mã vạch, thu ngân có thể bấm trực tiếp vào nút chuyển đơn vị trên thẻ sản phẩm để đổi giá bán tương ứng.

### 4.6. Sản phẩm cân ký & Mã vạch cân điện tử (PLU Scale)
- Tương thích 100% với các dòng cân điện tử in tem nhãn siêu thị (như Mettler Toledo, CAS, Dibal, Rongta).
- Hỗ trợ chuẩn mã vạch cân điện tử **EAN-13 (Đầu số từ 20 đến 29)**:
  - Cấu trúc: `20` + `[Mã PLU 5 số]` + `[Trọng lượng Gram 5 số]` + `[Số kiểm tra 1 số]`.
  - Ví dụ: Quét mã `2000105014508` -> Hệ thống tự động phân tích: Sản phẩm mã `00105` (Cam đường), trọng lượng `1.450 Kg` x đơn giá/kg để tính ra tiền và đưa vào giỏ hàng.

### 4.7. Tạm lưu đơn hàng & Phục hồi đơn chờ (Hold Order - Phím F2)
- Khi khách đang thanh toán nhưng phát hiện thiếu đồ và quay lại kệ hàng lấy thêm:
  1. Nhấn phím **`F2`** trên bàn phím (hoặc nút **`+ ພັກບິນ (F2)`** trên thanh tiêu đề).
  2. Toàn bộ giỏ hàng hiện tại sẽ được lưu trữ an toàn vào danh sách đơn chờ.
  3. Màn hình giỏ hàng trở về trạng thái trống để tính tiền cho khách tiếp theo ngay lập tức.
  4. Khi khách cũ quay lại, nhấn vào danh sách tab đơn chờ phía trên để phục hồi giỏ hàng cũ và tiếp tục thanh toán.

### 4.8. Thao tác điều chỉnh giỏ hàng (Cart Management)
- **Tăng / Giảm số lượng:** Nhấn nút `+` hoặc `-` trực tiếp trên từng món trong giỏ hàng.
- **Giảm giá theo từng món:** Bấm vào biểu tượng % trên dòng món để nhập phần trăm giảm giá riêng cho món đó.
- **Giảm giá toàn đơn:** Nhập số tiền hoặc % giảm giá cho tổng hóa đơn.
- **Xóa món:** Nhấn biểu tượng thùng rác để xóa món khỏi giỏ hàng.
- **Hủy toàn bộ giỏ:** Nhấn nút **`ລ້າງກະຕ່າ` (Làm trống giỏ)** để hủy toàn bộ đơn hàng đang thao tác.

---

## 5. QUY TRÌNH THANH TOÁN & IN HÓA ĐƠN
> *Phím tắt mở cửa sổ thanh toán:* **`F4`** (hoặc nhấn nút xanh **`ຊຳລະເງິນ`**)

QuickOne POS hỗ trợ đầy đủ 3 hình thức thanh toán phổ biến nhất tại thị trường bán lẻ Lào:

### 5.1. Thanh toán Tiền mặt (Cash Payment - Tab `ເງິນສົດ`)
1. Nhấn phím **`F4`** để mở hộp thoại thanh toán.
2. Mặc định hệ thống chọn tab **`ເງິນສົດ`**.
3. Nhập số tiền khách đưa hoặc bấm nhanh các nút tiền mệnh giá chẵn (`50.000 ₭`, `100.000 ₭`, `500.000 ₭`, `1.000.000 ₭` hoặc nút `ພໍດີ` khi khách đưa đúng tiền).
4. Hệ thống tự động tính ra số tiền thừa cần trả lại khách (**Change - `ເງິນທອນ`**).
5. Nhấn nút **`ຢືນຢັນຊຳລະເງິນ` (Xác nhận thanh toán)**:
   - Máy in hóa đơn lập tức in bill 80mm.
   - Két tiền tự động bật mở để thu ngân cất tiền và lấy tiền thối.

### 5.2. Thanh toán Chuyển khoản LAO QR / BCEL OnePay (Tab `LAO QR`)
1. Trong cửa sổ thanh toán, bấm chọn tab **`LAO QR`**.
2. Màn hình hiển thị hình ảnh **Mã QR Code động chuẩn thanh toán quốc gia Lào** với số tiền chính xác từng Kíp.
3. Khách hàng sử dụng ứng dụng ngân hàng di động (BCEL One, LDB Trust, JDB Yes, VietinBank Lao...) để quét mã và chuyển tiền.
4. Sau khi nghe tiếng thông báo tiền vào tài khoản hoặc khách đưa màn hình điện thoại đã chuyển thành công, thu ngân nhấn nút **`ຢືນຢັນການໂອນສຳເລັດ` (Xác nhận chuyển khoản)**.

### 5.3. Thanh toán Kết hợp / Trả góp phần (Tab `ຈ່າຍປະສົມ - Split Payment`)
- Sử dụng khi khách hàng có tiền mặt nhưng không đủ và muốn trả một phần tiền mặt + một phần chuyển khoản:
  1. Chọn tab **`ຈ່າຍປະສົມ`**.
  2. Nhập số tiền mặt khách đưa vào ô Tiền mặt (ví dụ đơn 150.000 ₭, khách đưa 50.000 ₭ tiền mặt).
  3. Hệ thống sẽ tự động tính số tiền còn lại phải chuyển khoản là `100.000 ₭` và hiển thị mã QR đúng số tiền này.
  4. Sau khi khách chuyển xong phần còn lại, thu ngân nhấn xác nhận thanh toán.

### 5.4. Định dạng Hóa đơn nhiệt 80mm (Thermal Bill Layout)
- Hóa đơn in nhiệt 80mm bao gồm đầy đủ thông tin chuẩn siêu thị:
  - Tên cửa hàng, địa chỉ, số điện thoại liên hệ, mã số thuế (nếu có).
  - Số hóa đơn (Invoice ID), Ngày giờ thanh toán, Tên thu ngân trực tiếp bán.
  - Bảng chi tiết danh sách sản phẩm, số lượng, đơn giá, thành tiền.
  - Tổng tiền hàng, Giảm giá (nếu có), Tổng thanh toán cuối cùng.
  - Chi tiết hình thức thanh toán (Tiền mặt, Tiền thối, Mã giao dịch chuyển khoản).
  - Lời cảm ơn và mã Barcode/QR của hóa đơn để hỗ trợ tra cứu đổi trả hàng sau này.

---

## 6. QUẢN LÝ DANH MỤC HÀNG HÓA
> *Đường dẫn menu:* **`ໝວດໝູ່ສິນຄ້າ` (Danh mục sản phẩm)**

Giúp phân loại và sắp xếp hàng hóa khoa học, hỗ trợ thu ngân lọc nhanh mặt hàng theo nhóm trên màn hình POS.

### 6.1. Thêm mới danh mục
1. Nhấn nút **`+ ເພີ່ມໝວດໝູ່ໃໝ່` (Thêm danh mục mới)**.
2. Nhập **Tên danh mục** bằng tiếng Lào (ví dụ: *ເຄື່ອງດື່ມ & ເບຍ, ເຂົ້າໜົມ, ຢາສູບ, ອາຫານສົດ, ຂອງໃຊ້ທົ່ວໄປ*).
3. Chọn biểu tượng icon trực quan (như ly nước, ổ bánh mì, gói thuốc, quả táo...).
4. Chọn màu sắc nhận diện danh mục để hiển thị đẹp mắt trên màn hình POS.
5. Nhấn **`ບັນທຶກ` (Lưu)**.

### 6.2. Sửa và Xóa danh mục
- **Chỉnh sửa:** Nhấn vào biểu tượng cây bút tại dòng danh mục cần đổi tên hoặc icon.
- **Xóa:** Nhấn biểu tượng thùng rác (Lưu ý: Chỉ xóa được danh mục khi không còn sản phẩm nào trực thuộc danh mục đó).

---

## 7. QUẢN LÝ SẢN PHẨM, MÃ VẠCH & ĐA ĐƠN VỊ ĐÓNG GÓI
> *Đường dẫn menu:* **`ສິນຄ້າ & ຫົວໜ່ວຍ` (Sản phẩm & Đơn vị tính)**

### 7.1. Thêm mới sản phẩm lẻ (Base Product Creation)
1. Nhấn nút màu xanh **`+ ເພີ່ມສິນຄ້າໃໝ່` (Thêm sản phẩm mới)**.
2. Nhập thông tin sản phẩm:
   - **Tên sản phẩm (`ຊື່ສິນຄ້າ`):** Nhập tên rõ ràng kèm dung tích (ví dụ: *ຊາຂຽວ ໂອອິຊິ 500ml*).
   - **Danh mục (`ໝວດໝູ່`):** Chọn danh mục phù hợp.
   - **Đơn vị cơ bản (`ຫົວໜ່ວຍພື້ນຖານ`):** Nhập đơn vị bán lẻ nhỏ nhất (như *ອັນ, ຕຸກ, ກະປ໋ອງ, ຖົງ*).
   - **Giá vốn (`ລາຄາຕົ້ນທຶນ`):** Nhập giá nhập hàng (để hệ thống tính lợi nhuận).
   - **Giá bán lẻ (`ລາຄາຂາຍຍ່ອຍ`):** Nhập giá bán lẻ cho khách (ví dụ: `12.000 ₭`).
   - **Tồn kho hiện tại (`ຈຳນວນສະຕັອກ`):** Nhập số lượng thực tế trong kho.
   - **Định mức báo động tồn kho thấp (`ແຈ້ງເຕືອນສະຕັອກຕ່ຳ`):** Nhập số lượng tối thiểu để hệ thống cảnh báo nhập hàng (ví dụ: `10`).

### 7.2. Cài đặt Mã vạch sản phẩm (2 Trường hợp chuẩn)
- **Trường hợp 1 - Hàng có sẵn mã vạch nhà sản xuất:**
  - Đặt con trỏ chuột vào ô **`ບາໂຄດສິນຄ້າ (Base Barcode)`**.
  - Cầm máy quét bóp cò vào mã vạch in trên bao bì sản phẩm. Dãy số mã vạch sẽ nhảy vào ô tự động.
- **Trường hợp 2 - Hàng địa phương, đồ chế biến không có mã vạch:**
  - Nhấn nút **`ສ້າງບາໂຄດ EAN-13` (Tự sinh mã vạch chuẩn)**.
  - Hệ thống sẽ tự động tạo ra một mã vạch 13 chữ số chuẩn quốc tế EAN-13 có đầu số nội bộ và thuật toán Checksum chính xác 100%. Người dùng có thể in mã vạch này dán lên sản phẩm.

### 7.3. Cài đặt Đa đơn vị quy cách (Thùng / Lốc / Hộp - Packaging Unit Builder)
Đối với các mặt hàng nước ngọt, bia, bánh kẹo có bán theo lốc hoặc thùng:
1. Cuộn xuống phần **`ຫົວໜ່ວຍຂາຍສົ່ງ & ແພັກ (Packaging Units)`**.
2. Nhấn nút **`+ ເພີ່ມຫົວໜ່ວຍ` (Thêm quy cách)**.
3. Cấu hình quy cách:
   - **Tên đơn vị:** Chọn hoặc gõ tên (ví dụ: *ແພັກ 6* hoặc *ແກັດ 24*).
   - **Hệ số quy đổi:** Nhập số lượng đơn vị lẻ tương ứng (ví dụ: 1 Lốc = `6` lon, 1 Thùng = `24` lon).
   - **Giá bán đơn vị:** Nhập giá bán sỉ/bán lốc (ví dụ: lẻ 12.000 ₭ -> Lốc 6 bán `68.000 ₭`).
   - **Mã vạch đơn vị:** Dùng máy quét quét mã vạch in bên ngoài bao bì lốc hoặc thùng.
4. Nhấn **`ບັນທຶກສິນຄ້າ`**. Khi bán hàng, thu ngân quét mã vạch thùng thì kho sẽ tự động trừ đi 24 lon lẻ tương ứng một cách chính xác tuyệt đối.

### 7.4. Cấu hình Sản phẩm Cân điện tử (Scale Weight Items)
- Đối với hàng rau củ quả, thịt cá cân ký:
  1. Chọn đơn vị tính cơ bản là **`Kg (ກິໂລກຣາມ)`**.
  2. Tích chọn vào ô **`ສິນຄ້າຊັ່ງນ້ຳໜັກ / ຕາຊັ່ງໄຟຟ້າ (Scale Item)`**.
  3. Nhập mã số **PLU (5 chữ số)**, ví dụ `00101` cho Thịt ba chỉ, `00102` cho Nho Mỹ.
  4. Cài đặt mã PLU tương ứng này vào máy cân điện tử của cửa hàng để tem in ra có mã vạch đồng bộ với phần mềm.

---

## 8. QUẢN LÝ KHO HÀNG, NHẬP KHO GRN & HẠN SỬ DỤNG FEFO
> *Đường dẫn menu:* **`ສາງສິນຄ້າ & FEFO` (Quản lý kho & Hạn dùng)**

Giúp quản lý luân chuyển hàng tồn kho chặt chẽ, hỗ trợ kiểm soát hạn sử dụng theo nguyên tắc vàng trong ngành bán lẻ thực phẩm: **FEFO (First Expired, First Out - Hàng hết hạn trước xuất bán trước)**.

### 8.1. Quy trình Tạo Phiếu Nhập Kho (Goods Receipt Note - GRN Form)
Khi hàng từ nhà cung cấp chuyển đến cửa hàng:
1. Nhấn nút **`+ ສ້າງໃບຮັບສິນຄ້າ (GRN)`**.
2. Chọn nhà cung cấp và ngày nhập hàng.
3. Thêm các sản phẩm nhập về:
   - Nhập hoặc quét mã vạch sản phẩm.
   - Nhập **Số lượng nhập**.
   - Nhập **Giá vốn nhập** (hệ thống tự động cập nhật giá vốn mới).
   - Nhập **Số lô sản xuất (Batch Number)**.
   - Chọn **Ngày hết hạn (Expiration Date)**.
4. Nhấn **`ບັນທຶກໃບຮັບສິນຄ້າ`**. Tồn kho sẽ được cộng tăng tự động và các lô hàng sẽ được theo dõi hạn sử dụng độc lập.

### 8.2. Theo dõi Hạn sử dụng thông minh (FEFO Engine)
- Hệ thống tự động phân loại tình trạng hàng hóa theo mã màu cảnh báo trực quan:
  - **Màu xanh lá (Good):** Hạn sử dụng còn an toàn (> 60 ngày).
  - **Màu vàng/cam (Near Expiry):** Hàng cận hạn sử dụng (< 30 ngày) - nhắc nhở chủ cửa hàng làm chương trình khuyến mãi giảm giá xả hàng.
  - **Màu đỏ (Expired):** Hàng đã quá hạn sử dụng - hệ thống cảnh báo đỏ và ngăn không cho bán ra tại quầy POS để bảo vệ an toàn cho khách hàng.

### 8.3. Điều chỉnh & Kiểm kê kho thực tế (Stock Adjustment)
- Khi phát hiện sai lệch số liệu thực tế so với phần mềm (do vỡ, hao hụt, mất trộm hoặc hư hỏng):
  1. Nhấn nút **`ດັດປັບສະຕັອກ (Adjust Stock)`**.
  2. Chọn sản phẩm cần kiểm kê.
  3. Chọn lý do điều chỉnh: *Kiểm kê định kỳ, Hàng hư hỏng vỡ, Hàng hết hạn tiêu hủy, Thất thoát*.
  4. Nhập số lượng tồn thực tế đếm được.
  5. Nhấn **`ຢືນຢັນດັດປັບ`**. Hệ thống ghi lại nhật ký điều chỉnh kèm tên nhân viên thực hiện để phục vụ công tác thanh tra kiểm toán nội bộ.

---

## 9. LỊCH SỬ HÓA ĐƠN, IN LẠI & QUY TRÌNH ĐỔI TRẢ HÀNG
> *Đường dẫn menu:* **`ປະຫວັດບິນ & ກະ`** -> **`ປະຫວັດບິນຂາຍ` (Lịch sử hóa đơn)**

### 9.1. Tra cứu hóa đơn cũ
- Hỗ trợ bộ lọc thông minh:
  - Lọc theo khoảng ngày (Hôm nay, Hôm qua, 7 ngày qua, Tháng này, Tùy chọn).
  - Tìm nhanh theo **Mã hóa đơn (Order ID)**.
  - Lọc theo tên thu ngân bán hoặc hình thức thanh toán (Tiền mặt, LAO QR).

### 9.2. Xem chi tiết & In lại hóa đơn (Reprint Receipt 80mm)
- Nhấn vào một dòng hóa đơn bất kỳ để mở bảng chi tiết.
- Hiển thị đầy đủ danh sách món, giờ xuất bill, số tiền đã trả.
- Nhấn nút **`ພິມໃບບິນຄືນ (Reprint)`** để in lại một bản sao hóa đơn gửi cho khách nếu khách làm mất hoặc máy in bị kẹt giấy trong lần in trước.

### 9.3. Quy trình Trả hàng & Hoàn tiền (Order Refund / Return)
Khi khách hàng mang hàng đến đổi trả do mua nhầm hoặc sản phẩm bị lỗi:
1. Tìm đúng hóa đơn mua hàng cũ của khách.
2. Nhấn nút **`ສົ່ງຄືນສິນຄ້າ (Refund / Return)`**.
3. Chọn các sản phẩm khách muốn trả lại và nhập số lượng hoàn trả.
4. Chọn lý do trả hàng (Hàng lỗi, khách đổi ý...).
5. Nhấn xác nhận hoàn tiền:
   - Hệ thống tự động hoàn lại số lượng hàng hóa đó vào kho dữ liệu tồn kho.
   - Ghi nhận một phiếu chi tiền hoàn lại để đối soát doanh thu ca trực chính xác.

---

## 10. BÁO CÁO THỐNG KÊ & PHÂN TÍCH DOANH THU
> *Đường dẫn menu:* **`ພາບລວມ (Dashboard)`**

Trung tâm điều hành số liệu kinh doanh dành cho chủ cửa hàng và cấp quản lý:
- **Thẻ tổng quan (KPI Cards):** Doanh thu hôm nay, Số lượng đơn hàng đã bán, Giá trị trung bình trên mỗi đơn hàng, Tổng số khách hàng.
- **Biểu đồ doanh thu trực quan:** Theo dõi biểu đồ cột doanh số theo từng mốc thời gian trong ngày (giờ cao điểm) hoặc theo từng ngày trong tuần.
- **Top 10 Sản phẩm bán chạy nhất:** Thống kê sản phẩm mang lại doanh thu và số lượng tiêu thụ cao nhất để hỗ trợ kế hoạch nhập hàng.
- **Thẻ cảnh báo hàng sắp hết & Cận hạn:** Liệt kê các mặt hàng cần nhập gấp và các lô hàng cần ưu tiên bán trước.

---

## 11. CẤU HÌNH HỆ THỐNG, MÁY IN & TÀI KHOẢN THU NGÂN
> *Đường dẫn menu:* **`ຕັ້ງຄ່າ & ພະນັກງານ` (Cài đặt & Nhân viên)**

### 11.1. Cấu hình Thông tin Cửa hàng
- Tên cửa hàng hiển thị trên hóa đơn (ví dụ: *QUICKONE MINIMART*).
- Địa chỉ, Số điện thoại hỗ trợ, Mã số thuế.
- Lời chào cuối hóa đơn (ví dụ: *"ຂອບໃຈທີ່ມາໃຊ້ອຸດໜູນ - ໂອກາດໜ້າເຊີນໃໝ່"*).

### 11.2. Cấu hình Máy in nhiệt 80mm & Két tiền (Hardware Settings)
- **Kiểu kết nối:**
  - *Mạng LAN / Wifi:* Nhập địa chỉ IP máy in (ví dụ: `192.168.1.200`) và cổng Port (`9100`).
  - *USB / Bluetooth:* Chọn cổng giao tiếp trực tiếp của máy POS.
- **Khổ giấy:** Chọn chuẩn `80mm` (Thermal Paper).
- **Tùy chọn tự động:**
  - Bật/Tắt tự động cắt giấy (**Auto-Cutter**).
  - Bật/Tắt xung kích mở két tiền (**Kick Cash Drawer via RJ11**).
- **Kiểm tra in thử:** Nhấn nút **`ທົດສອບພິມ (Test Print)`** để máy in in ra một đoạn văn bản mẫu kiểm tra độ nét và tín hiệu kết nối.

### 11.3. Cài đặt Tài khoản Ngân hàng nhận tiền LAO QR
- Nhập thông tin tài khoản ngân hàng nhận tiền chuyển khoản của cửa hàng:
  - Chọn ngân hàng (BCEL, LDB, JDB...).
  - Nhập Số tài khoản & Tên chủ tài khoản.
  - Hệ thống tự động tạo mã VietQR / LAO QR chuẩn quốc gia tương ứng.

### 11.4. Quản lý Nhân sự & Cấp mã PIN Thu ngân
- Nhấn **`+ ເພີ່ມພະນັກງານໃໝ່` (Thêm nhân viên mới)**:
  - Nhập họ tên nhân viên, tên đăng nhập.
  - Phân vai trò: *Admin, Store Manager hoặc Cashier*.
  - Thiết lập **Mã PIN 6 số cá nhân** để nhân viên đăng nhập mở khóa nhanh tại quầy thu ngân.
  - Bật/Tắt trạng thái hoạt động của tài khoản khi nhân viên nghỉ việc.

---

## 12. BẢNG PHÍM TẮT NHANH & HƯỚNG DẪN XỬ LÝ SỰ CỐ KỸ THUẬT

### 12.1. Bảng Phím tắt Thao tác Nhanh (Keyboard Shortcuts)
| Phím tắt | Tên tiếng Lào | Chức năng thao tác trên máy thu ngân |
| :--- | :--- | :--- |
| **`F1`** | **ຊ່ອງຄົ້ນຫາ & ຍິງບາໂຄດ** | Đưa con trỏ chuột vào ô tìm kiếm để gõ tên món hoặc chuẩn bị nhân số lượng. |
| **`F2`** | **ພັກບິນຊົ່ວຄາວ (Hold Order)** | Tạm lưu giỏ hàng của khách hiện tại và tạo giỏ hàng mới cho khách tiếp theo. |
| **`F4`** | **ຊຳລະເງິນ (Checkout)** | Mở hộp thoại thanh toán (Tiền mặt / LAO QR). |
| **`Esc`** | **ປິດໜ້າຕ່າງ / ຍົກເລີກ** | Đóng các hộp thoại Modal đang mở hoặc hủy bỏ thao tác. |
| **`Enter`** | **ຢືນຢັນ / ເພີ່ມລົງກະຕ່າ** | Xác nhận chọn sản phẩm hoặc xác nhận hoàn tất giao dịch. |
| **`[Số]*`** | **ຄູນຈຳນວນຫຼາຍຊິ້ນ** | Gõ số lượng kèm dấu sao (ví dụ `6*` hoặc `24*`) rồi quét mã vạch 1 lần. |

---

### 12.2. Hướng dẫn Xử lý Sự cố Kỹ thuật Thường gặp (Troubleshooting Guide)

#### Sự cố 1: Quét mã vạch nhưng phần mềm không có phản hồi gì
- **Nguyên nhân:** Dây cáp USB của máy quét bị lỏng, đầu thu không dây 2.4G bị ngắt kết nối hoặc máy quét bị hết pin.
- **Cách xử lý:**
  1. Kiểm tra đèn báo và tiếng bíp trên thân máy quét xem còn hoạt động không.
  2. Rút đầu cắm USB cắm lại sang cổng USB khác trên máy POS.
  3. Mở phần mềm Notepad trên máy tính và quét thử 1 mã vạch bất kỳ. Nếu Notepad nhận số bình thường thì quay lại phần mềm POS để quét tiếp.

#### Sự cố 2: Quét mã vạch báo tiếng "Bè" thấp và hiện thông báo đỏ "ບໍ່ພົບສິນຄ້າ"
- **Nguyên nhân:** Mã vạch của sản phẩm này chưa được đăng ký trong danh mục sản phẩm của hệ thống.
- **Cách xử lý:**
  1. Vào menu **`ສິນຄ້າ & ຫົວໜ່ວຍ`**.
  2. Nhấn nút **`+ ເພີ່ມສິນຄ້າໃໝ່`**.
  3. Quét mã vạch đó vào ô `ບາໂຄດສິນຄ້າ`, nhập tên sản phẩm, giá bán và bấm Lưu. Sau đó quay lại màn hình POS quét bán bình thường.

#### Sự cố 3: Máy in hóa đơn không in ra giấy
- **Nguyên nhân:** Máy in bị tắt công tắc nguồn, hết cuộn giấy in hoặc đặt ngược mặt giấy cảm nhiệt.
- **Cách xử lý:**
  1. Kiểm tra đèn nguồn xanh (`Power`) trên máy in có sáng không.
  2. Mở nắp máy in kiểm tra cuộn giấy. Mặt giấy láng mịn tẩm hóa chất nhiệt phải hướng lên phía trên đầu in thì mới in ra chữ được.
  3. Kiểm tra dây cắm mạng LAN hoặc dây USB từ máy in sang máy tính POS.

#### Sự cố 4: Két đựng tiền không tự động mở khi thanh toán tiền mặt
- **Nguyên nhân:** Dây cáp đầu nối RJ11 cắm từ mặt sau két tiền vào máy in bị lỏng hoặc ổ khóa két đang bị khóa cơ bằng chìa.
- **Cách xử lý:**
  1. Dùng chìa khóa vặn ổ khóa két về vị trí thẳng đứng (chế độ điện tử mở tự động).
  2. Rút đầu giắc cắm RJ11 (giống giắc cắm điện thoại bàn) cắm lại thật chặt vào cổng `Drawer` ở phía sau máy in nhiệt.

#### Sự cố 5: Mất kết nối mạng Internet giữa giờ cao điểm
- **Nguyên nhân:** Nhà mạng Internet bị đứt cáp hoặc mất tín hiệu Wifi.
- **Cách xử lý:**
  - Không cần lo lắng. QuickOne POS chạy cơ chế **Offline-First**. Toàn bộ hoạt động quét mã vạch, tính tiền, in hóa đơn và đóng/mở ca vẫn diễn ra bình thường 100%. Ngay khi có mạng trở lại, hệ thống sẽ tự động đồng bộ mọi dữ liệu lên Cloud.

@echo off
set ADB="C:\Users\thayz\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set APK="%~dp0lao-minimart-pos.apk"

echo ========================================================
echo   Ket noi toi Windows Subsystem for Android (WSA)...
echo ========================================================
%ADB% connect 127.0.0.1:58526

echo.
echo Danh sach thiet bi:
%ADB% devices

echo.
echo ========================================================
echo   Cai dat file APK vao WSA...
echo ========================================================
%ADB% -s 127.0.0.1:58526 install -r %APK%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [THONG BAO] Neu thiet bi bao "unauthorized":
    echo Hay nhin tren man hinh Windows, Android dang hien hop thoai:
    echo "Allow USB debugging? / Cho phep go loi qua USB?"
    echo -> Hay tich chon "Always allow from this computer" va bam "Allow".
    echo Sau do chay lai file nay!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo   Khoi chay ung dung Lao Minimart POS tren WSA...
echo ========================================================
%ADB% -s 127.0.0.1:58526 shell am start -n com.laominimart.pos/.MainActivity

echo.
echo [THANH CONG] Ung dung da duoc khoi chay tren WSA!
pause

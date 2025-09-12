@echo off
echo QR Studio Pro Version Switcher
echo ===============================
echo.
echo Available versions:
echo 1. Enhanced Pro Version (Recommended - Full features offline)
echo 2. Basic Offline Version (Simple QR generation)
echo 3. Online Version (Requires internet for advanced features)
echo.

set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" (
    echo Switching to Enhanced Pro Version...
    copy index-enhanced.html index.html >nul
    echo ✅ Enhanced Pro version activated!
    echo 🎨 Open http://localhost:3000 to use QR Studio Pro
    echo.
    echo Features available:
    echo ✅ Multiple QR data types (WiFi, vCard, Email, Social)
    echo ✅ Advanced customization (patterns, frames, gradients)
    echo ✅ Logo integration with drag-and-drop
    echo ✅ Bulk generation
    echo ✅ Preset system
    echo ✅ Dark/Light mode
    echo ✅ Fully responsive design
    echo ✅ High-resolution export (up to 4K)
    echo ✅ Works 100%% offline
) else if "%choice%"=="2" (
    echo Switching to Basic Offline Version...
    copy index-basic.html index.html >nul
    echo ✅ Basic offline version activated!
    echo 📱 Open http://localhost:3000 to use Basic QR Studio
    echo.
    echo Features available:
    echo ✅ Basic QR code generation
    echo ✅ Color customization
    echo ✅ Size adjustment
    echo ✅ PNG/JPG download
    echo ✅ Works without internet
) else if "%choice%"=="3" (
    echo Switching to Online Version...
    copy index-with-cdn.html index.html >nul
    echo ✅ Online version activated!
    echo 🌐 Open http://localhost:3000 to use QR Studio
    echo.
    echo Features available:
    echo ✅ Advanced QR code generation
    echo ✅ Multiple data types (WiFi, vCard, etc.)
    echo ✅ Logo integration
    echo ✅ Gradient effects
    echo ✅ Bulk generation
    echo ⚠️ Requires internet connection
) else (
    echo Invalid choice. Please run the script again.
)

echo.
pause

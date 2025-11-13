@echo off
echo 🚀 Starting Simple Face Recognition Server...
echo This version uses OpenCV instead of dlib for easier installation
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo 📦 Installing Python requirements...
echo This should be much faster than dlib installation...
pip install -r simple_face_requirements.txt

echo.
echo 🌐 Starting Simple Face Recognition Server on http://localhost:5001...
echo.

python simple_face_recognition_server.py

pause

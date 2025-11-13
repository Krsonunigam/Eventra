@echo off
echo 🚀 Starting Working Face Recognition Server...
echo This version uses proper face feature extraction and comparison
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo 📦 Installing requirements...
pip install opencv-python flask flask-cors pillow numpy

echo.
echo 🌐 Starting Working Face Recognition Server on http://localhost:5001...
echo.

python working_face_recognition_server.py

pause


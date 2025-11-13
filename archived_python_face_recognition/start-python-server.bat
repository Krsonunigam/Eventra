@echo off
echo 🚀 Starting Python Face Recognition Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Install requirements if needed
echo 📦 Installing Python requirements...
pip install -r python-server-requirements.txt

REM Start the Python server
echo 🌐 Starting server on http://localhost:5001...
python python-face-server.py

pause

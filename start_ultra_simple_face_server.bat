@echo off
echo 🚀 Starting Ultra Simple Face Recognition Server...
echo This version uses only basic Python libraries - no complex dependencies!
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo 📦 Installing basic requirements...
echo This should install very quickly...
pip install flask flask-cors

echo.
echo 🌐 Starting Ultra Simple Face Recognition Server on http://localhost:5001...
echo.

python ultra_simple_face_server.py

pause

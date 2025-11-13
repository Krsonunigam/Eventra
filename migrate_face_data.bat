@echo off
echo 🔄 Migrating Face Data...
echo This will migrate existing face data to the new working system
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
pip install opencv-python pillow numpy

echo.
echo 🔄 Running migration...
python migrate_face_data.py

echo.
echo Press any key to continue...
pause


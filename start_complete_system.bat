@echo off
echo 🚀 Starting Complete Eventra System...
echo This will start Python server, Node.js backend, and React frontend
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo 📦 Installing Python requirements...
pip install opencv-python flask flask-cors pillow numpy

echo.
echo 📦 Installing Node.js dependencies...
cd /d "%~dp0"
npm install

echo.
echo 📦 Installing React dependencies...
cd client
npm install
cd ..

echo.
echo 🌐 Starting Python Face Recognition Server on http://localhost:5001...
echo 🔧 Starting Node.js Backend Server on http://localhost:5000...
echo ⚛️  Starting React Frontend on http://localhost:3000...
echo.

REM Start Python server in a new window
start "Face Recognition Server" cmd /k "cd /d %~dp0 && python working_face_recognition_server.py"

REM Wait a moment for Python server to start
timeout /t 3 /nobreak >nul

REM Start Node.js server in a new window
start "Eventra Backend Server" cmd /k "cd /d %~dp0 && node server.js"

REM Wait a moment for backend server to start
timeout /t 3 /nobreak >nul

REM Start React frontend in a new window
start "React Frontend" cmd /k "cd /d %~dp0\client && npm start"

echo.
echo ✅ All servers are starting...
echo.
echo 📱 Face Recognition Server: http://localhost:5001
echo 🔧 Backend Server: http://localhost:5000
echo ⚛️  Frontend: http://localhost:3000
echo.
echo 🎯 Your Eventra system is now running!
echo.
echo Press any key to close this window...
pause >nul

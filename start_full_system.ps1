# PowerShell script to start the complete Eventra system
Write-Host "🚀 Starting Full Eventra System..." -ForegroundColor Green
Write-Host "This will start both the Python face recognition server and Node.js backend" -ForegroundColor Yellow
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Python requirements..." -ForegroundColor Cyan
pip install opencv-python flask flask-cors pillow numpy

Write-Host ""
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npm install

Write-Host ""
Write-Host "🌐 Starting Python Face Recognition Server on http://localhost:5001..." -ForegroundColor Green
Write-Host "🔧 Starting Node.js Backend Server on http://localhost:5000..." -ForegroundColor Green
Write-Host ""

# Start Python server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; python working_face_recognition_server.py" -WindowStyle Normal

# Wait a moment for Python server to start
Start-Sleep -Seconds 3

# Start Node.js server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node server.js" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 Face Recognition Server: http://localhost:5001" -ForegroundColor Cyan
Write-Host "🔧 Backend Server: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000 (run 'npm start' in client folder)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
Read-Host

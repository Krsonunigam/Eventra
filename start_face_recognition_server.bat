@echo off
echo Installing Face Recognition Dependencies...
echo This may take a few minutes as dlib needs to be compiled...

pip install -r face_recognition_requirements.txt

echo.
echo Starting Face Recognition Server...
echo Server will be available at http://localhost:5001
echo.

python face_recognition_server.py

pause

@echo off
echo Starting Vibe Tech Development Servers...
echo.

REM Start backend server in new window
echo Starting Backend Server (Port 3001)...
start "Vibe Tech Backend" cmd /k "cd backend && npm install && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in new window
echo Starting Frontend Server (Port 5173)...
start "Vibe Tech Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001
echo Database: D:\vibe-tech-data\vibetech.db
echo.
echo Press any key to exit this window...
pause > nul
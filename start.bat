@echo off
echo ========================================
echo   Northlane E-Commerce Startup
echo ========================================
echo.
echo Starting Backend (port 5000)...
start "Northlane Backend" cmd /k "cd backend && npm install && npm run dev"
timeout /t 3 /nobreak > nul
echo Starting Frontend (port 3000)...
start "Northlane Frontend" cmd /k "cd frontend && npm install && npm run dev"
echo.
echo Both servers starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause

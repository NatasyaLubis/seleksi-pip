@echo off
title Menjalankan SPK Seleksi PIP (BWM - WASPAS)
echo =====================================================================
echo   SISTEM PENDUKUNG KEPUTUSAN SELEKSI PENERIMAAN BANTUAN PIP
echo   Metode Kombinasi: Multi-Expert BWM (Geometric Mean) + WASPAS
echo =====================================================================
echo.

echo [1/2] Menjalankan Server Backend (Node.js Express)...
start "Backend Server (Port 5000)" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Menjalankan Antarmuka Frontend (React + Vite)...
start "Frontend UI (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npx vite --host 127.0.0.1 --port 3000"

timeout /t 3 /nobreak >nul

echo.
echo Membuka aplikasi di browser (http://localhost:3000)...
start http://localhost:3000

echo =====================================================================
echo   Aplikasi berhasil dijalankan!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000/api
echo =====================================================================
pause

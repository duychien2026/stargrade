@echo off
chcp 65001 > nul
title StarGrade - Chay Thu Local Server
echo ========================================================
echo        STARGRADE - HE THONG CHAM PHIEU TRAC NGHIEM
echo ========================================================
echo.
echo May chu dang duoc khoi dong tai:
echo   - Local PC : http://localhost:8090
echo   - Mang LAN : http://192.168.1.22:8090
echo.
echo Luu y: Trinh duyet tren dien thoai can HTTPS de bat camera.
echo De chay camera qua Internet/Dien thoai, ban co the:
echo   1. Deploy len Render.com (da kem Dockerfile va render.yaml)
echo   2. Hoac su dung Cloudflare Quick Tunnel / ngrok.
echo.
echo Nhan Ctrl+C de dung server.
echo ========================================================
echo.

cd /d "%~dp0"
php -S 0.0.0.0:8090 -t public
pause


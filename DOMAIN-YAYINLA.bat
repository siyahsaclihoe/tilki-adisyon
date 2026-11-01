@echo off
chcp 65001 >nul
title TilkiAdisyon - Domain Tuneli (adisyon.ornekdomain.com)
color 0D
echo ===============================================================================
echo   TİLKİADİSYON - ÖZEL DOMAİN TÜNELİ BAŞLATILIYOR
echo   Domain : https://adisyon.ornekdomain.com
echo   Hedef  : http://localhost:3001
echo ===============================================================================
echo.
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] cloudflared bulunamadi. Lutfen KURULUM-VE-DOMAIN.bat uzerinden 2. secenegi calistirin.
    pause
    exit /b 1
)
cloudflared tunnel --url http://localhost:3001
pause

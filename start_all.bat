@echo off
title BASTICKET - Trình khởi chạy hệ thống
echo ==============================================
echo    KHOI DONG TOAN BO HE THONG BASTICKET
echo ==============================================
echo.

echo [1/4] Dang khoi dong Smart Contracts Node (Hardhat)...
start "BASTICKET - Smart Contracts Node" cmd /k "cd smart-contracts && npx hardhat node"

echo [2/4] Dang khoi dong Dịch vu AI (Python)...
start "BASTICKET - AI Service" cmd /k "cd ai-service && python app.py"

echo [3/4] Dang khoi dong Backend (Express.js)...
start "BASTICKET - Backend" cmd /k "cd backend && npm run dev"

echo [4/4] Dang khoi dong Frontend (React Vite)...
start "BASTICKET - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==============================================
echo DA GUI LENH KHOI DONG TAT CA DICH VU!
echo 4 cua so moi se hien len tuong ung voi 4 dich vu.
echo (Dong cua so nay sau 5 giay...)
echo ==============================================
timeout /t 5

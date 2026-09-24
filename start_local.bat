@echo off
title Parallel Pantry Meal Optimizer - Local Server
echo ========================================================
echo   Starting Parallel Pantry Meal Optimizer Locally
echo ========================================================
echo.
echo [1/2] Launching FastAPI Backend Server on http://127.0.0.1:8000 ...
start "FastAPI Backend" cmd /k "python -m uvicorn backend.main:app --reload --port 8000"
echo.
echo [2/2] Launching React Frontend on http://localhost:5173 ...
start "Vite React Frontend" cmd /k "npm --prefix frontend run dev"
echo.
echo Waiting 3 seconds for servers to initialize...
timeout /t 3 /nobreak >nul
echo Opening web browser at http://localhost:5173 ...
start http://localhost:5173
echo.
echo ========================================================
echo   Both servers are running!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - API Docs: http://127.0.0.1:8000/docs
echo ========================================================

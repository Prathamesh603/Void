@echo off
REM Broq AI Research Agent - Frontend Quick Start
REM Windows batch file for easy setup and launch

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║  🚀 Broq AI Research Agent - Frontend Setup               ║
echo ║     Professional AI Research Platform                    ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    echo    Download from: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Navigate to frontend directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 🎉 Frontend is ready!
echo.
echo 📍 Available commands:
echo    npm run dev      - Start development server (http://localhost:5173)
echo    npm run build    - Create production build
echo    npm run preview  - Preview production build
echo    npm run lint     - Run ESLint checks
echo.
echo 🚀 Starting development server...
echo.
echo ════════════════════════════════════════════════════════════
echo.

call npm run dev
pause

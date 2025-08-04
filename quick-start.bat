@echo off
echo ========================================
echo Restaurant POS System - Quick Start
echo ========================================
echo.

echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please install Node.js which includes npm
    pause
    exit /b 1
)

echo ✓ Node.js and npm are installed
echo.

echo Installing dependencies...
echo This may take a few minutes...
npm run install-all
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully
echo.

echo IMPORTANT: Make sure you have:
echo 1. MySQL running (XAMPP or standalone)
echo 2. Database 'restaurant_pos' created
echo 3. server/config.env file configured
echo.

echo Would you like to setup the database now? (y/n)
set /p setup_db=

if /i "%setup_db%"=="y" (
    echo.
    echo Setting up database...
    npm run setup-db
    if %errorlevel% neq 0 (
        echo ERROR: Database setup failed!
        echo Please check your MySQL connection and config.env file
        pause
        exit /b 1
    )
    echo ✓ Database setup completed
)

echo.
echo Would you like to start the application now? (y/n)
set /p start_app=

if /i "%start_app%"=="y" (
    echo.
    echo Starting Restaurant POS System...
    echo Frontend will be available at: http://localhost:3000
    echo Backend API will be available at: http://localhost:5000
    echo.
    echo Press Ctrl+C to stop the application
    echo.
    npm run dev
) else (
    echo.
    echo To start the application later, run: npm run dev
)

echo.
echo Setup completed! Check SETUP_GUIDE.md for more details.
pause 
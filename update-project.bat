@echo off
echo ========================================
echo Restaurant POS System - Update Project
echo ========================================
echo.

echo Checking current status...
git status
echo.

echo Current branch: 
git branch --show-current
echo.

echo Would you like to update your project? (y/n)
set /p update_choice=

if /i "%update_choice%"=="y" (
    echo.
    echo Checking for local changes...
    git status --porcelain > temp_status.txt
    set /p has_changes=<temp_status.txt
    del temp_status.txt
    
    if "%has_changes%"=="" (
        echo No local changes detected. Safe to update.
        echo.
        echo Pulling latest changes...
        git pull origin main
        if %errorlevel% neq 0 (
            echo ERROR: Failed to pull changes!
            pause
            exit /b 1
        )
    ) else (
        echo Local changes detected!
        echo.
        echo Choose an option:
        echo 1. Backup changes and update (recommended)
        echo 2. Reset to remote version (lose local changes)
        echo 3. Cancel update
        echo.
        set /p update_option=
        
        if "%update_option%"=="1" (
            echo.
            echo Backing up your changes...
            git stash push -m "Local changes before update"
            echo.
            echo Pulling latest changes...
            git pull origin main
            if %errorlevel% neq 0 (
                echo ERROR: Failed to pull changes!
                pause
                exit /b 1
            )
            echo.
            echo Restoring your changes...
            git stash pop
            echo.
            echo Note: You may need to resolve conflicts manually.
        ) else if "%update_option%"=="2" (
            echo.
            echo WARNING: This will lose all local changes!
            echo Are you sure? (y/n)
            set /p confirm_reset=
            if /i "%confirm_reset%"=="y" (
                echo.
                echo Resetting to remote version...
                git fetch origin
                git reset --hard origin/main
                if %errorlevel% neq 0 (
                    echo ERROR: Failed to reset!
                    pause
                    exit /b 1
                )
            ) else (
                echo Update cancelled.
                pause
                exit /b 0
            )
        ) else (
            echo Update cancelled.
            pause
            exit /b 0
        )
    )
    
    echo.
    echo ✓ Project updated successfully!
    echo.
    echo Installing any new dependencies...
    npm run install-all
    if %errorlevel% neq 0 (
        echo WARNING: Some dependencies may not have installed correctly.
    )
    
    echo.
    echo Would you like to update the database schema? (y/n)
    set /p update_db=
    
    if /i "%update_db%"=="y" (
        echo.
        echo Updating database...
        npm run setup-db
        if %errorlevel% neq 0 (
            echo WARNING: Database update may have failed.
        )
    )
    
    echo.
    echo Would you like to start the updated application? (y/n)
    set /p start_app=
    
    if /i "%start_app%"=="y" (
        echo.
        echo Starting updated Restaurant POS System...
        echo Frontend: http://localhost:3000
        echo Backend: http://localhost:5000
        echo.
        echo Press Ctrl+C to stop the application
        echo.
        npm run dev
    ) else (
        echo.
        echo To start the application later, run: npm run dev
    )
    
    echo.
    echo Update completed! Check UPDATE_GUIDE.md for more details.
) else (
    echo Update cancelled.
)

echo.
pause 
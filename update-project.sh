#!/bin/bash

echo "========================================"
echo "Restaurant POS System - Update Project"
echo "========================================"
echo

echo "Checking current status..."
git status
echo

echo "Current branch:"
git branch --show-current
echo

read -p "Would you like to update your project? (y/n): " update_choice

if [[ $update_choice =~ ^[Yy]$ ]]; then
    echo
    echo "Checking for local changes..."
    
    if [[ -z $(git status --porcelain) ]]; then
        echo "No local changes detected. Safe to update."
        echo
        echo "Pulling latest changes..."
        git pull origin main
        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to pull changes!"
            exit 1
        fi
    else
        echo "Local changes detected!"
        echo
        echo "Choose an option:"
        echo "1. Backup changes and update (recommended)"
        echo "2. Reset to remote version (lose local changes)"
        echo "3. Cancel update"
        echo
        read -p "Enter your choice (1-3): " update_option
        
        case $update_option in
            1)
                echo
                echo "Backing up your changes..."
                git stash push -m "Local changes before update"
                echo
                echo "Pulling latest changes..."
                git pull origin main
                if [ $? -ne 0 ]; then
                    echo "ERROR: Failed to pull changes!"
                    exit 1
                fi
                echo
                echo "Restoring your changes..."
                git stash pop
                echo
                echo "Note: You may need to resolve conflicts manually."
                ;;
            2)
                echo
                echo "WARNING: This will lose all local changes!"
                read -p "Are you sure? (y/n): " confirm_reset
                if [[ $confirm_reset =~ ^[Yy]$ ]]; then
                    echo
                    echo "Resetting to remote version..."
                    git fetch origin
                    git reset --hard origin/main
                    if [ $? -ne 0 ]; then
                        echo "ERROR: Failed to reset!"
                        exit 1
                    fi
                else
                    echo "Update cancelled."
                    exit 0
                fi
                ;;
            3)
                echo "Update cancelled."
                exit 0
                ;;
            *)
                echo "Invalid choice. Update cancelled."
                exit 1
                ;;
        esac
    fi
    
    echo
    echo "✓ Project updated successfully!"
    echo
    echo "Installing any new dependencies..."
    npm run install-all
    if [ $? -ne 0 ]; then
        echo "WARNING: Some dependencies may not have installed correctly."
    fi
    
    echo
    read -p "Would you like to update the database schema? (y/n): " update_db
    
    if [[ $update_db =~ ^[Yy]$ ]]; then
        echo
        echo "Updating database..."
        npm run setup-db
        if [ $? -ne 0 ]; then
            echo "WARNING: Database update may have failed."
        fi
    fi
    
    echo
    read -p "Would you like to start the updated application? (y/n): " start_app
    
    if [[ $start_app =~ ^[Yy]$ ]]; then
        echo
        echo "Starting updated Restaurant POS System..."
        echo "Frontend: http://localhost:3000"
        echo "Backend: http://localhost:5000"
        echo
        echo "Press Ctrl+C to stop the application"
        echo
        npm run dev
    else
        echo
        echo "To start the application later, run: npm run dev"
    fi
    
    echo
    echo "Update completed! Check UPDATE_GUIDE.md for more details."
else
    echo "Update cancelled."
fi

echo 
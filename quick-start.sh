#!/bin/bash

echo "========================================"
echo "Restaurant POS System - Quick Start"
echo "========================================"
echo

echo "Checking prerequisites..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed!"
    echo "Please install Node.js which includes npm"
    exit 1
fi

echo "✓ Node.js and npm are installed"
echo

echo "Installing dependencies..."
echo "This may take a few minutes..."
npm run install-all
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo
echo "✓ Dependencies installed successfully"
echo

echo "IMPORTANT: Make sure you have:"
echo "1. MySQL running (XAMPP or standalone)"
echo "2. Database 'restaurant_pos' created"
echo "3. server/config.env file configured"
echo

read -p "Would you like to setup the database now? (y/n): " setup_db

if [[ $setup_db =~ ^[Yy]$ ]]; then
    echo
    echo "Setting up database..."
    npm run setup-db
    if [ $? -ne 0 ]; then
        echo "ERROR: Database setup failed!"
        echo "Please check your MySQL connection and config.env file"
        exit 1
    fi
    echo "✓ Database setup completed"
fi

echo
read -p "Would you like to start the application now? (y/n): " start_app

if [[ $start_app =~ ^[Yy]$ ]]; then
    echo
    echo "Starting Restaurant POS System..."
    echo "Frontend will be available at: http://localhost:3000"
    echo "Backend API will be available at: http://localhost:5000"
    echo
    echo "Press Ctrl+C to stop the application"
    echo
    npm run dev
else
    echo
    echo "To start the application later, run: npm run dev"
fi

echo
echo "Setup completed! Check SETUP_GUIDE.md for more details." 
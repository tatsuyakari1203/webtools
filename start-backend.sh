#!/bin/bash

# Script to start Python backend with virtual environment
# Check and create venv if needed, then run server with nohup

set -e  # Stop script on error

echo "🚀 Starting WebTools Backend Server..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if Python exists
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python3."
    exit 1
fi

echo "✅ Python3 found: $(python3 --version)"

# Check virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check and install dependencies
if [ -f "requirements.txt" ]; then
    echo "📋 Checking dependencies..."
    pip install -r requirements.txt --quiet
    echo "✅ Dependencies installed/updated"
fi

# Start server with nohup
echo "🌟 Starting backend server on http://0.0.0.0:7777"
echo "📝 Server will run in background. Check nohup.out for logs."
echo "💡 To stop the server, use: pkill -f 'uvicorn app.main:app'"
echo "" 

nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 7777 --reload > nohup.out 2>&1 &

echo "✅ Backend server started successfully!"
echo "📄 Log file: $(pwd)/nohup.out"
echo "🔍 To view logs: tail -f $(pwd)/nohup.out"
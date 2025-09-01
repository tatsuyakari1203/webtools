#!/bin/bash

# Script để khởi chạy backend Python với virtual environment
# Kiểm tra và tạo venv nếu cần, sau đó chạy server

set -e  # Dừng script nếu có lỗi

echo "🚀 Starting WebTools Backend Server..."

# Chuyển đến thư mục backend
cd "$(dirname "$0")/backend"

# Kiểm tra Python có tồn tại không
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 không được tìm thấy. Vui lòng cài đặt Python3."
    exit 1
fi

echo "✅ Python3 đã được tìm thấy: $(python3 --version)"

# Kiểm tra virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Tạo virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment đã được tạo"
else
    echo "✅ Virtual environment đã tồn tại"
fi

# Kích hoạt virtual environment
echo "🔧 Kích hoạt virtual environment..."
source venv/bin/activate

# Kiểm tra và cài đặt dependencies
if [ -f "requirements.txt" ]; then
    echo "📋 Kiểm tra dependencies..."
    pip install -r requirements.txt --quiet
    echo "✅ Dependencies đã được cài đặt/cập nhật"
fi

# Khởi chạy server
echo "🌟 Khởi chạy backend server trên http://0.0.0.0:7777"
echo "📝 Logs sẽ hiển thị bên dưới. Nhấn Ctrl+C để dừng server."
echo "" 

python -m uvicorn app.main:app --host 0.0.0.0 --port 7777 --reload
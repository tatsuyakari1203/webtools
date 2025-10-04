#!/bin/bash

# Script deploy Docker tối ưu cho WSL
# Build trên host trước, sau đó copy vào container với tối ưu dung lượng

set -e

# Tham số
LOCAL_ONLY=${1:-false}
DOCKER_USERNAME="tatsuyakari"
IMAGE_NAME="webtools"
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME"

echo "🚀 Bắt đầu quá trình build và deploy Docker image (WSL optimized)"
echo "================================================"

# Kiểm tra Docker
echo "📋 Kiểm tra Docker..."
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Docker không được cài đặt hoặc không chạy"
    exit 1
fi
echo "✅ Docker đang chạy"

# Kiểm tra các file cần thiết
echo "📋 Kiểm tra các file cần thiết..."
if [ ! -f "Dockerfile.wsl" ]; then
    echo "❌ Không tìm thấy Dockerfile.wsl"
    exit 1
fi
echo "✅ Tìm thấy Dockerfile.wsl"

if [ ! -f ".dockerignore.wsl" ]; then
    echo "❌ Không tìm thấy .dockerignore.wsl"
    exit 1
fi
echo "✅ Tìm thấy .dockerignore.wsl"

# Kiểm tra Docker Hub login (chỉ khi không phải local only)
if [ "$LOCAL_ONLY" != "true" ]; then
    echo "🔐 Kiểm tra Docker Hub login..."
    if ! docker info | grep -q "Username"; then
        echo "❌ Chưa login vào Docker Hub. Chạy: docker login"
        echo "💡 Hoặc chạy với tham số 'true' để build local only: ./deploy-docker-wsl.sh true"
        exit 1
    fi
    echo "✅ Đã login vào Docker Hub"
fi

# Build Next.js app trên host
echo "🔨 Build Next.js app trên host..."
echo "Chạy: bun run build"
if ! bun run build; then
    echo "❌ Build thất bại"
    exit 1
fi
echo "✅ Build thành công"

# Backup và sử dụng .dockerignore tối ưu
echo "🔧 Chuẩn bị .dockerignore tối ưu..."
if [ -f ".dockerignore" ]; then
    cp .dockerignore .dockerignore.backup.temp
fi
cp .dockerignore.wsl .dockerignore
echo "✅ Đã áp dụng .dockerignore tối ưu"

# Function để restore .dockerignore
restore_dockerignore() {
    if [ -f ".dockerignore.backup.temp" ]; then
        mv .dockerignore.backup.temp .dockerignore
    fi
}

# Trap để đảm bảo restore .dockerignore khi script kết thúc
trap restore_dockerignore EXIT

# Build Docker image
echo "🐳 Đang build Docker image..."
if [ "$LOCAL_ONLY" = "true" ]; then
    TARGET_IMAGE=$IMAGE_NAME
    echo "🏠 Build local image: $TARGET_IMAGE"
else
    TARGET_IMAGE=$FULL_IMAGE_NAME
    echo "☁️ Build production image: $TARGET_IMAGE"
fi

echo "Dockerfile: Dockerfile.wsl"
echo "Image name: $TARGET_IMAGE"

if ! docker build -f Dockerfile.wsl -t $TARGET_IMAGE:latest .; then
    echo "❌ Docker build thất bại"
    exit 1
fi
echo "✅ Docker build thành công"

# Hiển thị thông tin image
echo "📊 Thông tin image:"
docker images $TARGET_IMAGE --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Push to Docker Hub (chỉ khi không phải local only)
if [ "$LOCAL_ONLY" != "true" ]; then
    echo "📤 Đang push image lên Docker Hub..."
    if ! docker push $TARGET_IMAGE:latest; then
        echo "❌ Push image thất bại"
        exit 1
    fi
    echo "✅ Push image thành công"
fi

# Hiển thị thông tin image
echo ""
echo "📊 Thông tin Docker image:"
if [ "$LOCAL_ONLY" = "true" ]; then
    docker images $TARGET_IMAGE --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
else
    docker images $FULL_IMAGE_NAME --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
fi

echo ""
echo "🎉 HOÀN THÀNH!"
if [ "$LOCAL_ONLY" = "true" ]; then
    echo "🏠 Local image đã được tạo: $TARGET_IMAGE:latest"
    echo "💡 Để chạy container:"
    echo "   docker run -p 3000:3000 -e GOOGLE_API_KEY=your_api_key $TARGET_IMAGE:latest"
else
    echo "☁️ Image đã được push lên Docker Hub: $TARGET_IMAGE:latest"
    echo "💡 Để sử dụng image:"
    echo "   docker pull $TARGET_IMAGE:latest"
    echo "   docker run -p 3000:3000 -e GOOGLE_API_KEY=your_api_key $TARGET_IMAGE:latest"
fi
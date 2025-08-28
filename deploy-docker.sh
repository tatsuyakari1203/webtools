#!/bin/bash

# Script để build Docker image và đẩy lên Docker Hub
# Sử dụng: ./deploy-docker.sh

set -e  # Dừng script nếu có lỗi

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Thông tin Docker Hub
DOCKER_USERNAME="tatsuyakari"
IMAGE_NAME="webtools"
DOCKERFILE="Dockerfile.fullstack"

echo -e "${BLUE}🚀 Bắt đầu quá trình build và deploy Docker image${NC}"
echo "================================================"

# Kiểm tra xem Docker có đang chạy không
echo -e "${YELLOW}📋 Kiểm tra Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker không chạy hoặc chưa được cài đặt${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker đang chạy${NC}"

# Kiểm tra xem Dockerfile có tồn tại không
echo -e "${YELLOW}📋 Kiểm tra Dockerfile...${NC}"
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}❌ Không tìm thấy $DOCKERFILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Tìm thấy $DOCKERFILE${NC}"

# Kiểm tra Docker login
echo -e "${YELLOW}🔐 Kiểm tra Docker Hub login...${NC}"
if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
    echo -e "${YELLOW}⚠️  Chưa login vào Docker Hub. Đang thực hiện login...${NC}"
    if ! docker login; then
        echo -e "${RED}❌ Login Docker Hub thất bại${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Đã login vào Docker Hub${NC}"

# Build Docker image
echo -e "${YELLOW}🔨 Đang build Docker image...${NC}"
echo "Dockerfile: $DOCKERFILE"
echo "Image name: $DOCKER_USERNAME/$IMAGE_NAME"

if ! docker build -f "$DOCKERFILE" -t "$DOCKER_USERNAME/$IMAGE_NAME:latest" .; then
    echo -e "${RED}❌ Build Docker image thất bại${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build Docker image thành công${NC}"

# Tag image với tag fullstack
echo -e "${YELLOW}🏷️  Đang tag image...${NC}"
if ! docker tag "$DOCKER_USERNAME/$IMAGE_NAME:latest" "$DOCKER_USERNAME/$IMAGE_NAME:fullstack"; then
    echo -e "${RED}❌ Tag image thất bại${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Tag image thành công${NC}"

# Push image với tag latest
echo -e "${YELLOW}📤 Đang push image với tag 'latest'...${NC}"
if ! docker push "$DOCKER_USERNAME/$IMAGE_NAME:latest"; then
    echo -e "${RED}❌ Push image với tag 'latest' thất bại${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Push image với tag 'latest' thành công${NC}"

# Push image với tag fullstack
echo -e "${YELLOW}📤 Đang push image với tag 'fullstack'...${NC}"
if ! docker push "$DOCKER_USERNAME/$IMAGE_NAME:fullstack"; then
    echo -e "${RED}❌ Push image với tag 'fullstack' thất bại${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Push image với tag 'fullstack' thành công${NC}"

# Thông báo hoàn thành
echo ""
echo "================================================"
echo -e "${GREEN}🎉 HOÀN THÀNH! Docker image đã được build và push thành công${NC}"
echo -e "${BLUE}📦 Images đã được push:${NC}"
echo -e "   • $DOCKER_USERNAME/$IMAGE_NAME:latest"
echo -e "   • $DOCKER_USERNAME/$IMAGE_NAME:fullstack"
echo ""
echo -e "${BLUE}💡 Để sử dụng image:${NC}"
echo -e "   docker pull $DOCKER_USERNAME/$IMAGE_NAME:latest"
echo -e "   docker run -p 3000:3000 -e GOOGLE_API_KEY=your_api_key $DOCKER_USERNAME/$IMAGE_NAME:latest"
echo ""
echo -e "${YELLOW}⚠️  QUAN TRỌNG - BẢO MẬT:${NC}"
echo -e "   • KHÔNG BAO GIỜ commit file .env vào Git"
echo -e "   • API keys phải được truyền qua environment variables khi chạy container"
echo -e "   • Sử dụng docker-compose.yml với file .env để quản lý secrets an toàn"
echo -e "   • Ví dụ: docker-compose up (cần file .env với GOOGLE_API_KEY)"
echo "================================================"
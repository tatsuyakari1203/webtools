# Backend Docker Deployment Guide

## Tổng quan
Backend đã được tách riêng thành một Docker image độc lập với các tính năng bảo mật:
- Không chứa file .env hoặc thông tin nhạy cảm
- Chạy với non-root user
- Có health check tự động
- Tách biệt hoàn toàn với frontend

## Cấu trúc mới
```
webtools/
├── backend/
│   ├── Dockerfile          # Docker image cho backend
│   ├── .dockerignore       # Loại trừ file nhạy cảm
│   └── ...
├── docker-compose.yml      # 2 services riêng biệt
└── build-backend.sh        # Script build và test
```

## Các bước triển khai

### 1. Build và test backend locally
```bash
./build-backend.sh
```
Script này sẽ:
- Build image `tatsuyakari/webtools-backend:latest`
- Test container trên port 8001
- Kiểm tra health endpoint
- Hỏi có muốn push lên Docker Hub không

### 2. Push lên Docker Hub (sau khi test thành công)
```bash
docker push tatsuyakari/webtools-backend:latest
```

### 3. Deploy với docker-compose
```bash
# Pull images mới nhất
docker-compose pull

# Start services
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f webtools-backend
docker-compose logs -f webtools
```

## Services trong docker-compose.yml

### Frontend (webtools)
- Image: `tatsuyakari/webtools:latest` (không thay đổi)
- Port: 5005:3000
- Environment: BACKEND_URL=http://webtools-backend:8000

### Backend (webtools-backend)
- Image: `tatsuyakari/webtools-backend:latest` (mới)
- Port: 8000:8000
- Environment variables được truyền từ host
- Depends on: không có dependencies

## Biến môi trường cần thiết
Trong file `.env`:
```env
GOOGLE_API_KEY=your_api_key_here
```

## Health checks
- Frontend: `http://localhost:5005`
- Backend: `http://localhost:8000/health`

## Bảo mật
- Container không chứa file .env
- Chạy với user non-root (uid: 1000)
- Chỉ copy các thư mục cần thiết
- CORS được cấu hình cho frontend

## Troubleshooting

### Kiểm tra container status
```bash
docker-compose ps
```

### Xem logs
```bash
docker-compose logs webtools-backend
```

### Test backend riêng lẻ
```bash
docker run --rm -p 8001:8000 \
  -e GOOGLE_API_KEY="$GOOGLE_API_KEY" \
  tatsuyakari/webtools-backend:latest
```

### Rebuild image
```bash
./build-backend.sh
```
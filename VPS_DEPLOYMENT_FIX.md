# Sửa lỗi triển khai trên VPS Linux

## Vấn đề

Trên VPS Linux, `host.docker.internal` không hoạt động mặc định như trên Docker Desktop (Windows/Mac), dẫn đến lỗi 500 khi frontend trong container không thể kết nối đến backend chạy trên host.

## Giải pháp đã áp dụng

### 1. Thay đổi cấu hình mạng

**Trước:**
```yaml
networks:
  - webtools-network
extra_hosts:
  - "host.docker.internal:host-gateway"
```

**Sau:**
```yaml
network_mode: "host"
```

### 2. Cập nhật URL backend

**Trước:**
```yaml
- BACKEND_URL=http://host.docker.internal:7777
- NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:7777
```

**Sau:**
```yaml
- BACKEND_URL=http://172.17.0.1:7777
- NEXT_PUBLIC_BACKEND_URL=http://172.17.0.1:7777
```

### 3. Cấu hình port

- Thêm `PORT=5005` để container chạy trên đúng port
- Bỏ port mapping vì sử dụng host network
- Cập nhật healthcheck để kiểm tra port 5005

## Cách triển khai

### Bước 1: Dừng container hiện tại
```bash
docker compose down
```

### Bước 2: Rebuild và khởi động lại
```bash
docker compose up -d --build
```

### Bước 3: Kiểm tra logs
```bash
docker compose logs -f webtools
```

### Bước 4: Test kết nối
```bash
# Test backend
curl http://localhost:7777/health

# Test frontend
curl http://localhost:5005

# Test API proxy
curl -X POST http://localhost:5005/api/nano-banana/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "width": 512, "height": 512}'
```

## Lưu ý quan trọng

1. **IP 172.17.0.1**: Đây là IP mặc định của Docker bridge network trên Linux. Nếu VPS có cấu hình khác, có thể cần thay đổi.

2. **Network mode host**: Container sẽ sử dụng trực tiếp network của host, không cô lập network.

3. **Firewall**: Đảm bảo port 5005 và 7777 được mở trên VPS.

4. **Alternative solutions** nếu vẫn gặp vấn đề:
   ```yaml
   # Option 1: Sử dụng IP thực của VPS
   - BACKEND_URL=http://YOUR_VPS_IP:7777
   - NEXT_PUBLIC_BACKEND_URL=http://YOUR_VPS_IP:7777
   
   # Option 2: Sử dụng localhost (chỉ hoạt động với host network)
   - BACKEND_URL=http://localhost:7777
   - NEXT_PUBLIC_BACKEND_URL=http://localhost:7777
   ```

## Troubleshooting

### Nếu vẫn gặp lỗi kết nối:

1. **Kiểm tra backend có chạy không:**
   ```bash
   ps aux | grep uvicorn
   netstat -tlnp | grep 7777
   ```

2. **Kiểm tra Docker network:**
   ```bash
   docker network ls
   ip route show
   ```

3. **Test kết nối từ trong container:**
   ```bash
   docker exec -it webtools-frontend-app sh
   wget -qO- http://172.17.0.1:7777/health
   ```

4. **Kiểm tra logs chi tiết:**
   ```bash
   docker compose logs webtools
   ```

### Nếu cần rollback:

Phục hồi cấu hình cũ trong `docker-compose.yml` và chạy:
```bash
docker compose down
docker compose up -d
```
# AskGemini API Security Configuration

## Tổng quan

API AskGemini đã được cấu hình với các biện pháp bảo mật để ngăn chặn việc sử dụng trái phép từ các domain không được ủy quyền.

## Các biện pháp bảo mật đã triển khai

### 1. Middleware Security

**File:** `/src/middleware.ts`

- **Origin Validation**: Kiểm tra header `Origin` của request
- **Referer Validation**: Kiểm tra header `Referer` khi không có Origin
- **Same-Origin Policy**: Tự động cho phép requests từ cùng domain
- **Allowed Origins List**: Danh sách các domain được phép truy cập

### 2. CORS Headers

**File:** `/src/app/api/askgemini/route.ts`

- **Dynamic CORS**: Headers được set dựa trên origin của request
- **Preflight Support**: Hỗ trợ OPTIONS method cho preflight requests
- **Secure Headers**: Chỉ cho phép các methods và headers cần thiết

## Cấu hình

### Cập nhật Allowed Origins

Trong file `/src/middleware.ts`, cập nhật mảng `ALLOWED_ORIGINS`:

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
  // Thêm domain production của bạn
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

### Environment Variables

```env
# Development mode cho phép requests không có origin/referer
NODE_ENV=development  # hoặc production

# Google API Key (bắt buộc)
GOOGLE_API_KEY=your_google_api_key_here
```

## Các tình huống được xử lý

### ✅ Được phép

1. **Same-Origin Requests**: Từ cùng domain/port
2. **Allowed Origins**: Từ các domain trong danh sách cho phép
3. **Development Mode**: Requests không có origin/referer (Postman, curl)

### ❌ Bị từ chối

1. **Unknown Origins**: Từ domain không có trong danh sách
2. **Missing Headers**: Không có origin và referer (trong production)
3. **Invalid Referer**: Referer không hợp lệ hoặc không được phép

## Response Headers

### Successful Requests
```
Access-Control-Allow-Origin: <requesting-origin>
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Preflight Requests (OPTIONS)
```
Access-Control-Allow-Origin: <requesting-origin>
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### Blocked Requests
```
HTTP 403 Forbidden
{
  "success": false,
  "error": "Access denied. This API can only be accessed from authorized domains."
}
```

## Logs và Monitoring

### Security Logs
```
[Security] /api/askgemini - Origin: https://example.com, Referer: https://example.com/page, Host: localhost:3000
[Security] Allowing request without origin/referer in development mode
[Security] Blocked request to /api/askgemini from origin: https://malicious.com, referer: unknown
```

### API Logs
```
[AskGemini-abc123] Starting request
[AskGemini-abc123] Request parameters: { promptLength: 50, hasContext: false, maxTokens: 1000, temperature: 0.7 }
[AskGemini-abc123] Returning successful response: { processingTime: 1234, responsePreview: "Generated text..." }
```

## Best Practices

### 1. Production Deployment

- Đặt `NODE_ENV=production`
- Cập nhật `ALLOWED_ORIGINS` với domain thực tế
- Không bao gồm localhost trong production

### 2. API Key Security

- Sử dụng environment variables
- Không commit API keys vào repository
- Rotate API keys định kỳ

### 3. Monitoring

- Theo dõi logs để phát hiện attempts truy cập trái phép
- Set up alerts cho 403 responses
- Monitor API usage patterns

### 4. Additional Security

```typescript
// Thêm rate limiting (tùy chọn)
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

// Thêm request size limiting
const MAX_REQUEST_SIZE = '1mb';
```

## Testing Security

### Test Cases

1. **Valid Origin**:
```bash
curl -X POST http://localhost:3000/api/askgemini \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

2. **Invalid Origin**:
```bash
curl -X POST http://localhost:3000/api/askgemini \
  -H "Origin: https://malicious.com" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

3. **No Origin (Development)**:
```bash
curl -X POST http://localhost:3000/api/askgemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

4. **Preflight Request**:
```bash
curl -X OPTIONS http://localhost:3000/api/askgemini \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

## Troubleshooting

### Common Issues

1. **CORS Error trong Browser**:
   - Kiểm tra domain có trong `ALLOWED_ORIGINS`
   - Đảm bảo protocol (http/https) khớp

2. **403 Forbidden**:
   - Kiểm tra Origin/Referer headers
   - Xem logs để debug

3. **Development Issues**:
   - Đặt `NODE_ENV=development`
   - Thêm localhost vào `ALLOWED_ORIGINS`

### Debug Commands

```bash
# Kiểm tra headers
curl -I -X POST http://localhost:3000/api/askgemini

# Xem detailed logs
NODE_ENV=development npm run dev

# Test với specific origin
curl -X POST http://localhost:3000/api/askgemini \
  -H "Origin: http://localhost:3000" \
  -v
```

## Cập nhật và Maintenance

- Review `ALLOWED_ORIGINS` khi thêm domain mới
- Update security headers theo best practices mới
- Monitor và analyze security logs định kỳ
- Test security configuration sau mỗi deployment
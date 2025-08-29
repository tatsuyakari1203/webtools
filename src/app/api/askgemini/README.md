# AskGemini API

API tổng quát để tương tác với Google Gemini AI, có thể sử dụng cho nhiều ứng dụng khác nhau bao gồm tạo quotes, động lực, trả lời câu hỏi, và nhiều tác vụ text generation khác.

## Endpoints

### POST `/api/askgemini`
Gửi yêu cầu text generation đến Gemini AI.

#### Request Body
```typescript
{
  prompt: string;           // Câu hỏi hoặc yêu cầu chính (bắt buộc)
  context?: string;         // Ngữ cảnh bổ sung (tùy chọn)
  maxTokens?: number;       // Số token tối đa (mặc định: 1000)
  temperature?: number;     // Độ sáng tạo 0-1 (mặc định: 0.7)
}
```

#### Response
```typescript
{
  success: boolean;         // Trạng thái thành công
  response?: string;        // Nội dung phản hồi từ AI
  error?: string;          // Thông báo lỗi (nếu có)
  processingTime?: number; // Thời gian xử lý (ms)
}
```

### GET `/api/askgemini`
Kiểm tra trạng thái health của API.

#### Response
```typescript
{
  status: 'healthy' | 'error';
  service: string;
  timestamp: string;
  version?: string;
  description?: string;
  message?: string;
  error?: string;
}
```

## Ví dụ sử dụng

### 1. Tạo Quote cho Pomodoro Timer
```typescript
import { createQuotePrompt } from '@/app/api/askgemini/types';

const response = await fetch('/api/askgemini', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: createQuotePrompt('coding a new feature', 'energetic'),
    maxTokens: 100,
    temperature: 0.8
  })
});

const data = await response.json();
if (data.success) {
  console.log('Generated quote:', data.response);
}
```

### 2. Tạo động lực cho task hiện tại
```typescript
import { createMotivationPrompt } from '@/app/api/askgemini/types';

const response = await fetch('/api/askgemini', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: createMotivationPrompt('writing documentation', 1500), // 25 minutes
    maxTokens: 150,
    temperature: 0.6
  })
});
```

### 3. Câu hỏi tổng quát
```typescript
const response = await fetch('/api/askgemini', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Explain the benefits of the Pomodoro Technique',
    context: 'For a productivity blog post',
    maxTokens: 500,
    temperature: 0.5
  })
});
```

### 4. Kiểm tra health
```typescript
const response = await fetch('/api/askgemini');
const health = await response.json();
console.log('API Status:', health.status);
```

## Helper Functions

API cung cấp các helper functions trong `types.ts`:

- `createQuotePrompt(taskName?, mood?)` - Tạo prompt cho việc generate quotes
- `createMotivationPrompt(taskName, timeRemaining?)` - Tạo prompt cho động lực
- `validateAskGeminiRequest(request)` - Validate request data

## Error Handling

API trả về các lỗi phổ biến:

- `400`: Request không hợp lệ (prompt trống, quá dài, etc.)
- `500`: Lỗi server hoặc Google API

Các loại lỗi Google API:
- API key không hợp lệ hoặc hết hạn
- Vượt quá giới hạn sử dụng (quota)
- Vi phạm chính sách an toàn
- Timeout (30 giây)

## Giới hạn

- Prompt tối đa: 10,000 ký tự
- Timeout: 30 giây
- Model sử dụng: `gemini-2.5-flash-lite`
- Streaming: Có hỗ trợ

## Environment Variables

Cần cấu hình:
```env
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=development  # hoặc production
```

## Bảo mật

API đã được cấu hình với các biện pháp bảo mật:

- **Origin Validation**: Chỉ cho phép requests từ domain được ủy quyền
- **CORS Protection**: Headers được set động dựa trên origin
- **Middleware Security**: Kiểm tra origin/referer trước khi xử lý
- **Development Mode**: Cho phép requests từ tools như Postman trong development

### Cấu hình Domain được phép

Cập nhật file `/src/middleware.ts`:
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://yourdomain.com',  // Thêm domain production
];
```

### Chi tiết bảo mật

Xem [SECURITY.md](./SECURITY.md) để biết thêm chi tiết về:
- Cấu hình bảo mật
- Testing security
- Troubleshooting
- Best practices

## Tích hợp với Pomodoro Timer

Để tích hợp với ứng dụng Pomodoro, bạn có thể:

1. Gọi API khi bắt đầu session mới để tạo quote động lực
2. Sử dụng context từ task hiện tại để tạo quote phù hợp
3. Cache quotes để tránh gọi API quá nhiều
4. Fallback về quotes có sẵn nếu API lỗi

```typescript
// Ví dụ tích hợp trong Pomodoro
async function generateTaskQuote(taskName: string) {
  try {
    const response = await fetch('/api/askgemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: createQuotePrompt(taskName, 'focused'),
        maxTokens: 80,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    return data.success ? data.response : getRandomFallbackQuote();
  } catch (error) {
    console.error('Failed to generate quote:', error);
    return getRandomFallbackQuote();
  }
}
```
# NanoBanana Backend API

## Tổng quan

NanoBanana Backend là một API service được xây dựng bằng FastAPI để tạo và chỉnh sửa hình ảnh sử dụng Google Gemini AI. API này cung cấp các endpoint để tạo hình ảnh từ văn bản và chỉnh sửa hình ảnh dựa trên hướng dẫn văn bản.

## Cấu trúc dự án

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application chính
│   └── middleware.py        # Middleware cho error handling và rate limiting
├── services/
│   ├── __init__.py
│   └── gemini_service.py    # Service xử lý Gemini AI API
├── logs/
│   └── nanobanana.log       # Log files
├── requirements.txt         # Python dependencies
├── .env.example            # Template cho environment variables
└── venv/                   # Python virtual environment
```

## Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
# Tạo và kích hoạt virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate     # Windows

# Cài đặt dependencies
pip install -r requirements.txt
```

### 2. Cấu hình environment variables

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa file .env với thông tin của bạn
```

### 3. Chạy server

```bash
# Development mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

| Biến | Mô tả | Giá trị mặc định |
|------|-------|------------------|
| `GOOGLE_API_KEY` | API key của Google Gemini | **Bắt buộc** |
| `HOST` | Host để bind server | `0.0.0.0` |
| `PORT` | Port để chạy server | `8000` |
| `DEBUG` | Chế độ debug | `True` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `MAX_IMAGE_SIZE` | Kích thước tối đa của hình ảnh (px) | `2048` |
| `DEFAULT_IMAGE_FORMAT` | Định dạng hình ảnh mặc định | `PNG` |
| `MAX_PROMPT_LENGTH` | Độ dài tối đa của prompt | `2000` |
| `RATE_LIMIT_REQUESTS` | Số request tối đa mỗi phút | `100` |
| `RATE_LIMIT_WINDOW` | Cửa sổ thời gian rate limit (giây) | `3600` |
| `LOG_LEVEL` | Mức độ logging | `INFO` |
| `DEFAULT_MODEL` | Model Gemini sử dụng | `gemini-2.5-flash-image-preview` |
| `MAX_TOKENS` | Số token tối đa cho response | `1000` |
| `TEMPERATURE` | Temperature cho AI generation | `0.7` |

## API Endpoints

### 1. Health Check

**GET** `/health`

Kiểm tra trạng thái của API và Gemini service.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "gemini_available": true
}
```

**Ví dụ cURL:**
```bash
curl -X GET "http://localhost:8000/health"
```

### 2. Root Endpoint

**GET** `/`

Thông tin cơ bản về API.

**Response:**
```json
{
  "message": "NanoBanana API - AI Image Generation and Editing",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

### 3. Tạo hình ảnh từ văn bản

**POST** `/api/generate`

Tạo hình ảnh từ mô tả văn bản.

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024,
  "style": "photorealistic",
  "quality": "high"
}
```

**Parameters:**
- `prompt` (string, required): Mô tả hình ảnh muốn tạo
- `width` (integer, optional): Chiều rộng hình ảnh (default: 1024)
- `height` (integer, optional): Chiều cao hình ảnh (default: 1024)
- `style` (string, optional): Phong cách hình ảnh
- `quality` (string, optional): Chất lượng hình ảnh (default: "standard")

**Response:**
```json
{
  "success": true,
  "image_data": "base64_encoded_image_data",
  "message": "Image generated successfully"
}
```

**Ví dụ cURL:**
```bash
curl -X POST "http://localhost:8000/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute cat sitting on a windowsill",
    "width": 512,
    "height": 512,
    "style": "cartoon",
    "quality": "high"
  }'
```

**Ví dụ Python:**
```python
import requests
import base64
from PIL import Image
import io

url = "http://localhost:8000/api/generate"
data = {
    "prompt": "A beautiful landscape with mountains and lake",
    "width": 1024,
    "height": 768,
    "style": "photorealistic",
    "quality": "high"
}

response = requests.post(url, json=data)
result = response.json()

if result["success"]:
    # Decode base64 image
    image_data = base64.b64decode(result["image_data"])
    image = Image.open(io.BytesIO(image_data))
    image.save("generated_image.png")
    print("Image saved as generated_image.png")
else:
    print(f"Error: {result['error']}")
```

### 4. Chỉnh sửa hình ảnh

**POST** `/api/edit`

Chỉnh sửa hình ảnh dựa trên hướng dẫn văn bản.

**Request (multipart/form-data):**
- `image` (file, required): File hình ảnh cần chỉnh sửa
- `prompt` (string, required): Mô tả về hình ảnh hiện tại
- `edit_instruction` (string, required): Hướng dẫn chỉnh sửa
- `style` (string, optional): Phong cách mong muốn
- `quality` (string, optional): Chất lượng hình ảnh (default: "standard")

**Response:**
```json
{
  "success": true,
  "image_data": "base64_encoded_edited_image_data",
  "message": "Image edited successfully"
}
```

**Ví dụ cURL:**
```bash
curl -X POST "http://localhost:8000/api/edit" \
  -F "image=@/path/to/your/image.jpg" \
  -F "prompt=A photo of a dog in a park" \
  -F "edit_instruction=Add sunglasses to the dog" \
  -F "style=cartoon" \
  -F "quality=high"
```

**Ví dụ Python:**
```python
import requests
import base64
from PIL import Image
import io

url = "http://localhost:8000/api/edit"

# Prepare files and data
files = {
    'image': open('input_image.jpg', 'rb')
}
data = {
    'prompt': 'A landscape photo with mountains',
    'edit_instruction': 'Add a rainbow in the sky',
    'style': 'vibrant',
    'quality': 'high'
}

response = requests.post(url, files=files, data=data)
result = response.json()

files['image'].close()

if result["success"]:
    # Decode base64 image
    image_data = base64.b64decode(result["image_data"])
    image = Image.open(io.BytesIO(image_data))
    image.save("edited_image.png")
    print("Edited image saved as edited_image.png")
else:
    print(f"Error: {result['error']}")
```

### 5. Kết hợp nhiều hình ảnh

**POST** `/api/compose`

Kết hợp nhiều hình ảnh thành một hình ảnh mới dựa trên prompt.

**Request (multipart/form-data):**
- `images` (files, required): 2-3 file hình ảnh cần kết hợp
- `prompt` (string, required): Mô tả về cách kết hợp hình ảnh
- `composition_type` (string, optional): Loại kết hợp ("combine", "blend", "collage") (default: "combine")
- `style` (string, optional): Phong cách mong muốn
- `quality` (string, optional): Chất lượng hình ảnh (default: "standard")

**Response:**
```json
{
  "success": true,
  "image_data": "base64_encoded_composed_image_data",
  "message": "Images composed successfully"
}
```

**Ví dụ cURL:**
```bash
curl -X POST "http://localhost:8000/api/compose" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "prompt=Combine these images into a beautiful collage" \
  -F "composition_type=collage" \
  -F "style=artistic" \
  -F "quality=high"
```

**Ví dụ Python:**
```python
import requests
import base64
from PIL import Image
import io

url = "http://localhost:8000/api/compose"

# Prepare files and data
files = [
    ('images', open('image1.jpg', 'rb')),
    ('images', open('image2.jpg', 'rb'))
]
data = {
    'prompt': 'Create a seamless blend of these two landscapes',
    'composition_type': 'blend',
    'style': 'photorealistic',
    'quality': 'high'
}

response = requests.post(url, files=files, data=data)
result = response.json()

# Close files
for _, file in files:
    file.close()

if result["success"]:
    # Decode base64 image
    image_data = base64.b64decode(result["image_data"])
    image = Image.open(io.BytesIO(image_data))
    image.save("composed_image.png")
    print("Composed image saved as composed_image.png")
else:
    print(f"Error: {result['error']}")
```

### 6. Chuyển đổi phong cách

**POST** `/api/style-transfer`

Chuyển đổi phong cách từ một hình ảnh sang hình ảnh khác.

**Request (multipart/form-data):**
- `content_image` (file, required): Hình ảnh nội dung
- `style_image` (file, required): Hình ảnh phong cách
- `prompt` (string, required): Mô tả về việc chuyển đổi phong cách
- `intensity` (float, optional): Cường độ chuyển đổi (0.0-1.0) (default: 0.7)
- `quality` (string, optional): Chất lượng hình ảnh (default: "standard")

**Response:**
```json
{
  "success": true,
  "image_data": "base64_encoded_stylized_image_data",
  "message": "Style transfer completed successfully"
}
```

**Ví dụ cURL:**
```bash
curl -X POST "http://localhost:8000/api/style-transfer" \
  -F "content_image=@/path/to/content.jpg" \
  -F "style_image=@/path/to/style.jpg" \
  -F "prompt=Apply the artistic style to the content image" \
  -F "intensity=0.8" \
  -F "quality=high"
```

**Ví dụ Python:**
```python
import requests
import base64
from PIL import Image
import io

url = "http://localhost:8000/api/style-transfer"

# Prepare files and data
files = {
    'content_image': open('content.jpg', 'rb'),
    'style_image': open('style.jpg', 'rb')
}
data = {
    'prompt': 'Transfer the impressionist painting style to the photograph',
    'intensity': 0.8,
    'quality': 'high'
}

response = requests.post(url, files=files, data=data)
result = response.json()

# Close files
for file in files.values():
    file.close()

if result["success"]:
    # Decode base64 image
    image_data = base64.b64decode(result["image_data"])
    image = Image.open(io.BytesIO(image_data))
    image.save("stylized_image.png")
    print("Stylized image saved as stylized_image.png")
else:
    print(f"Error: {result['error']}")
```

### 7. Chỉnh sửa hình ảnh theo hội thoại

**POST** `/api/conversation`

Chỉnh sửa hình ảnh qua nhiều lượt hội thoại để tinh chỉnh dần.

**Request Body (JSON):**
```json
{
  "prompt": "A beautiful landscape",
  "edit_instruction": "Add a rainbow in the sky",
  "previous_image_data": "base64_encoded_image_data",
  "conversation_id": "conv_12345",
  "style": "photorealistic",
  "quality": "high"
}
```

**Parameters:**
- `prompt` (string, required): Mô tả ban đầu về hình ảnh
- `edit_instruction` (string, required): Hướng dẫn chỉnh sửa cho lượt này
- `previous_image_data` (string, optional): Dữ liệu base64 của hình ảnh từ lượt trước
- `conversation_id` (string, optional): ID hội thoại để theo dõi ngữ cảnh
- `style` (string, optional): Phong cách mong muốn
- `quality` (string, optional): Chất lượng hình ảnh (default: "standard")

**Response:**
```json
{
  "success": true,
  "image_data": "base64_encoded_edited_image_data",
  "message": "Conversation edit completed successfully",
  "conversation_id": "conv_12345"
}
```

**Ví dụ cURL:**
```bash
curl -X POST "http://localhost:8000/api/conversation" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape",
    "edit_instruction": "Add a small cabin by the lake",
    "conversation_id": "conv_001",
    "style": "photorealistic",
    "quality": "high"
  }'
```

**Ví dụ Python (Iterative Editing):**
```python
import requests
import base64
from PIL import Image
import io

url = "http://localhost:8000/api/conversation"
conversation_id = None
previous_image = None

# First iteration - generate initial image
data = {
    "prompt": "A peaceful mountain landscape with a lake",
    "edit_instruction": "Create a beautiful scenic view",
    "style": "photorealistic",
    "quality": "high"
}

response = requests.post(url, json=data)
result = response.json()

if result["success"]:
    conversation_id = result["conversation_id"]
    previous_image = result["image_data"]
    print(f"Initial image created. Conversation ID: {conversation_id}")
    
    # Save initial image
    image_data = base64.b64decode(previous_image)
    image = Image.open(io.BytesIO(image_data))
    image.save("iteration_1.png")

# Second iteration - add elements
data = {
    "prompt": "A peaceful mountain landscape with a lake",
    "edit_instruction": "Add a small wooden cabin near the lake shore",
    "previous_image_data": previous_image,
    "conversation_id": conversation_id,
    "style": "photorealistic",
    "quality": "high"
}

response = requests.post(url, json=data)
result = response.json()

if result["success"]:
    previous_image = result["image_data"]
    print("Added cabin to the scene")
    
    # Save second iteration
    image_data = base64.b64decode(previous_image)
    image = Image.open(io.BytesIO(image_data))
    image.save("iteration_2.png")

# Third iteration - final touches
data = {
    "prompt": "A peaceful mountain landscape with a lake and cabin",
    "edit_instruction": "Add warm sunset lighting and some birds in the sky",
    "previous_image_data": previous_image,
    "conversation_id": conversation_id,
    "style": "photorealistic",
    "quality": "high"
}

response = requests.post(url, json=data)
result = response.json()

if result["success"]:
    print("Final image with sunset lighting completed")
    
    # Save final iteration
    image_data = base64.b64decode(result["image_data"])
    image = Image.open(io.BytesIO(image_data))
    image.save("final_image.png")
else:
    print(f"Error: {result['error']}")
```

## Error Handling

Tất cả các endpoint đều trả về cấu trúc phản hồi nhất quán khi có lỗi:

```json
{
  "success": false,
  "error": "Mô tả lỗi chi tiết",
  "error_code": "ERROR_CODE"
}
```

### Các mã lỗi phổ biến:

- `INVALID_IMAGE_FORMAT`: Định dạng hình ảnh không được hỗ trợ
- `IMAGE_TOO_LARGE`: Kích thước hình ảnh vượt quá giới hạn (10MB)
- `PROMPT_TOO_LONG`: Prompt vượt quá 1000 ký tự
- `GEMINI_API_ERROR`: Lỗi từ Gemini API
- `INTERNAL_SERVER_ERROR`: Lỗi máy chủ nội bộ
- `MISSING_REQUIRED_FIELD`: Thiếu trường bắt buộc
- `INVALID_PARAMETER`: Tham số không hợp lệ

### HTTP Status Codes:

- `200`: Thành công
- `400`: Yêu cầu không hợp lệ
- `413`: Payload quá lớn
- `422`: Dữ liệu không thể xử lý
- `500`: Lỗi máy chủ nội bộ

## Giới hạn và Ràng buộc

### Hình ảnh:
- **Kích thước tối đa**: 10MB
- **Định dạng hỗ trợ**: JPEG, PNG, WebP, GIF
- **Độ phân giải tối đa**: 4096x4096 pixels
- **Số lượng hình ảnh tối đa** (cho `/api/compose`): 3 hình ảnh

### Văn bản:
- **Prompt tối đa**: 1000 ký tự
- **Edit instruction tối đa**: 500 ký tự
- **Style tối đa**: 100 ký tự

### Rate Limiting:
- **Tối đa 10 yêu cầu/phút** cho mỗi IP
- **Tối đa 100 yêu cầu/giờ** cho mỗi IP

## Tính năng nâng cao

### 1. Cải thiện hiển thị văn bản
API đã được tối ưu hóa để hiển thị văn bản rõ ràng trong hình ảnh. Khi prompt chứa các từ khóa liên quan đến văn bản như "text", "writing", "words", "letters", "sign", "label", hệ thống sẽ tự động thêm các hướng dẫn để đảm bảo văn bản được hiển thị chính xác và dễ đọc.

### 2. Quản lý ngữ cảnh hội thoại
Endpoint `/api/conversation` hỗ trợ theo dõi ngữ cảnh qua nhiều lượt chỉnh sửa:
- Mỗi hội thoại có một `conversation_id` duy nhất
- Hệ thống lưu trữ lịch sử chỉnh sửa để cải thiện kết quả
- Có thể tiếp tục chỉnh sửa từ hình ảnh trước đó

### 3. Tối ưu hóa chất lượng
Các tùy chọn chất lượng:
- `"standard"`: Chất lượng chuẩn, xử lý nhanh
- `"high"`: Chất lượng cao, thời gian xử lý lâu hơn
- `"ultra"`: Chất lượng siêu cao (chỉ khả dụng cho một số endpoint)

## Ví dụ tích hợp

### Tạo workflow hoàn chỉnh:

```python
import requests
import base64
from PIL import Image
import io

class NanoBananaClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def generate_image(self, prompt, style="photorealistic", quality="high"):
        """Tạo hình ảnh từ prompt"""
        url = f"{self.base_url}/api/generate"
        data = {
            "prompt": prompt,
            "style": style,
            "quality": quality
        }
        response = self.session.post(url, json=data)
        return response.json()
    
    def edit_image(self, image_path, prompt, edit_instruction, style="photorealistic"):
        """Chỉnh sửa hình ảnh"""
        url = f"{self.base_url}/api/edit"
        files = {'image': open(image_path, 'rb')}
        data = {
            'prompt': prompt,
            'edit_instruction': edit_instruction,
            'style': style,
            'quality': 'high'
        }
        response = self.session.post(url, files=files, data=data)
        files['image'].close()
        return response.json()
    
    def compose_images(self, image_paths, prompt, composition_type="combine"):
        """Kết hợp nhiều hình ảnh"""
        url = f"{self.base_url}/api/compose"
        files = [('images', open(path, 'rb')) for path in image_paths]
        data = {
            'prompt': prompt,
            'composition_type': composition_type,
            'quality': 'high'
        }
        response = self.session.post(url, files=files, data=data)
        for _, file in files:
            file.close()
        return response.json()
    
    def save_image(self, image_data, filename):
        """Lưu hình ảnh từ base64"""
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        image.save(filename)
        return filename

# Sử dụng client
client = NanoBananaClient()

# Workflow: Tạo -> Chỉnh sửa -> Kết hợp
result1 = client.generate_image("A beautiful sunset over mountains")
if result1["success"]:
    client.save_image(result1["image_data"], "sunset.png")

result2 = client.generate_image("A peaceful lake with reflections")
if result2["success"]:
    client.save_image(result2["image_data"], "lake.png")

# Kết hợp hai hình ảnh
result3 = client.compose_images(
    ["sunset.png", "lake.png"],
    "Combine the sunset and lake into a harmonious landscape",
    "blend"
)
if result3["success"]:
    client.save_image(result3["image_data"], "combined_landscape.png")
    print("Workflow completed successfully!")
```

## Hỗ trợ và Liên hệ

- **Documentation**: Truy cập `/docs` để xem Swagger UI
- **Health Check**: Truy cập `/health` để kiểm tra trạng thái API
- **Version**: API hiện tại đang ở phiên bản 1.0.0

## Changelog

### Version 1.0.0
- ✅ Tạo hình ảnh từ văn bản (`/api/generate`)
- ✅ Chỉnh sửa hình ảnh (`/api/edit`)
- ✅ Kết hợp nhiều hình ảnh (`/api/compose`)
- ✅ Chuyển đổi phong cách (`/api/style-transfer`)
- ✅ Chỉnh sửa theo hội thoại (`/api/conversation`)
- ✅ Cải thiện hiển thị văn bản
- ✅ Quản lý ngữ cảnh hội thoại
- ✅ Tối ưu hóa chất lượng hình ảnh
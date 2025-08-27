# WebTools - Tổng hợp công cụ tiện ích trực tuyến

WebTools là một web application được xây dựng bằng Next.js, cung cấp tập hợp các công cụ tiện ích trực tuyến giúp người dùng thực hiện các tác vụ hàng ngày một cách nhanh chóng và hiệu quả.

## 🛠️ Các công cụ hiện có

- **Calculator** - Máy tính cơ bản với giao diện thân thiện
- **Text Formatter** - Công cụ định dạng và xử lý văn bản
- **Image Name Processor** ⭐ - Công cụ xử lý tên file ảnh (Featured)
- **Image Converter** - Công cụ chuyển đổi và nén ảnh với thống kê chi tiết

## 🏗️ Cấu trúc dự án

```
src/
├── app/
│   ├── tools/
│   │   └── [toolId]/
│   │       └── page.tsx          # Dynamic routing cho tools
│   └── ...
├── components/
│   ├── landing/
│   │   └── ToolsGrid.tsx          # Hiển thị danh sách tools
│   ├── sections/
│   └── ui/                        # Shadcn/ui components
├── lib/
│   └── tools-registry.ts          # Đăng ký và quản lý tools
└── tools/
    ├── calculator/
    ├── text-formatter/
    ├── image-name-processor/
    ├── image-converter/
    └── index.ts                   # Export tổng hợp
```

## 🚀 Hướng dẫn triển khai tool mới

### Bước 1: Tạo cấu trúc thư mục

Tạo thư mục mới trong `/src/tools/` với cấu trúc sau:

```
src/tools/your-tool-name/
├── YourToolName.tsx              # Component chính
├── index.tsx                     # Export pattern
├── types.ts                      # TypeScript interfaces (tùy chọn)
├── components/                   # Sub-components (tùy chọn)
│   └── SubComponent.tsx
├── utils/                        # Utility functions (tùy chọn)
│   └── helpers.ts
└── workers/                      # Web Workers (tùy chọn)
    └── processor.worker.ts
```

### Bước 2: Tạo component chính

Tạo file `YourToolName.tsx`:

```tsx
import React from 'react';

const YourToolName: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Tool Name</h1>
      {/* Nội dung tool của bạn */}
    </div>
  );
};

export default YourToolName;
```

### Bước 3: Tạo file export

Tạo file `index.tsx` với pattern export:

```tsx
// Pattern 1: Simple export (khuyến nghị cho tools đơn giản)
import YourToolName from './YourToolName';
export default YourToolName;

// Pattern 2: Re-export với types (cho tools phức tạp)
export { default } from './YourToolName';
export * from './types';
```

### Bước 4: Đăng ký tool trong registry

Thêm tool vào `/src/lib/tools-registry.ts`:

```typescript
export const toolsRegistry = [
  // ... existing tools
  {
    id: 'your-tool-id',
    name: 'Your Tool Name',
    description: 'Mô tả ngắn gọn về tool của bạn',
    category: 'productivity', // hoặc 'utility', 'media', etc.
    icon: 'IconName', // Lucide React icon
    path: '/tools/your-tool-id',
    featured: false // true nếu muốn hiển thị ở đầu danh sách
  }
];
```

### Bước 5: Thêm routing

Cập nhật `/src/app/tools/[toolId]/page.tsx`:

```tsx
// Import tool component
import YourToolName from '@/tools/your-tool-name';

// Thêm case mới trong switch statement
switch (tool.id) {
  // ... existing cases
  case 'your-tool-id':
    return <YourToolName />;
  default:
    return <div>Tool not found</div>;
}
```

### Bước 6: Cập nhật exports

Thêm export vào `/src/tools/index.ts`:

```typescript
export { default as YourToolName } from './your-tool-name';
```

## 🎯 Pattern và Best Practices

### Dynamic Routing
- Sử dụng Next.js App Router với dynamic segments `[toolId]`
- Tool ID được lấy từ URL và match với registry
- Mỗi tool được render như một component riêng biệt

### Component Organization
- **Main Component**: Logic chính và UI của tool
- **Sub-components**: Chia nhỏ UI phức tạp thành các component con
- **Types**: Định nghĩa TypeScript interfaces cho type safety
- **Utils**: Các hàm tiện ích và business logic
- **Workers**: Web Workers cho xử lý nặng (như Image Converter)

### Featured Tools
- Sử dụng `featured: true` trong registry để ưu tiên hiển thị
- Featured tools được sắp xếp lên đầu danh sách tự động
- Hiện tại chỉ Image Name Processor được đánh dấu featured

### Styling
- Sử dụng Tailwind CSS cho styling
- Shadcn/ui components cho UI consistency
- Responsive design by default

## 🔧 Development

### Cài đặt dependencies
```bash
npm install
```

### Chạy development server
```bash
npm run dev
```

### Build và kiểm tra
```bash
npm run build
npm run lint
```

### Thêm Shadcn/ui components
```bash
npx shadcn@latest add [component-name]
```

## 📦 Deployment

### Vercel (Khuyến nghị)
1. Push code lên GitHub
2. Connect repository với Vercel
3. Deploy tự động

### Manual Build
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Implement tool theo pattern đã định
4. Test thoroughly
5. Submit pull request

## 📝 Notes

- Tất cả tools đều sử dụng TypeScript
- UI components từ Shadcn/ui để đảm bảo consistency
- Web Workers được khuyến khích cho các tác vụ xử lý nặng
- Responsive design là bắt buộc
- Code phải pass lint checks trước khi deploy

---

**WebTools** - Làm cho công việc hàng ngày trở nên dễ dàng hơn! 🚀

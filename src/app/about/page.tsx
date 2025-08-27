import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">About WebTools Platform</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nền tảng tập hợp các công cụ web tiện ích, giúp bạn thực hiện các tác vụ hàng ngày một cách dễ dàng và hiệu quả.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Mục tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Tạo ra một nền tảng tập trung các webapp tools hữu ích, dễ sử dụng và có giao diện hiện đại.
              Tiết kiệm thời gian cho người dùng khi không cần tìm kiếm nhiều trang web khác nhau.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚡ Tính năng</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              • Giao diện hiện đại với theme trắng đen<br/>
              • Responsive design cho mọi thiết bị<br/>
              • Tools được tổ chức theo danh mục<br/>
              • Hoàn toàn miễn phí và không cần đăng ký
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛠️ Công nghệ</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              • Next.js 14 + React 18<br/>
              • TypeScript cho type safety<br/>
              • Tailwind CSS cho styling<br/>
              • shadcn/ui component library
            </CardDescription>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
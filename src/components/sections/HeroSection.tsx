import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-primary/20 transition-colors">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Công cụ web hiện đại và tiện ích
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Tập hợp{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              công cụ web
            </span>{" "}
            trong một nền tảng
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Khám phá bộ sưu tập các công cụ web mạnh mẽ được thiết kế để tăng năng suất 
            và đơn giản hóa quy trình làm việc của bạn. Từ máy tính đến công cụ định dạng văn bản, 
            tất cả đều có sẵn tại một nơi.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="group">
              <Link href="#tools">
                Khám phá công cụ
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">
                Tìm hiểu thêm
              </Link>
            </Button>
          </div>
        </div>
        


      </div>
    </section>
  )
}
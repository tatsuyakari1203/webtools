'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, RotateCcw, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageNameProcessor() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const processImageName = (text: string): string => {
    if (!text.trim()) return '';

    return text
      // Chuyển về chữ thường
      .toLowerCase()
      // Loại bỏ dấu tiếng Việt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Loại bỏ ký tự đặc biệt, chỉ giữ lại chữ cái, số, dấu cách và dấu gạch ngang
      .replace(/[^a-z0-9\s-]/g, '')
      // Thay thế nhiều dấu cách liên tiếp bằng một dấu cách
      .replace(/\s+/g, ' ')
      // Thay thế dấu cách bằng dấu gạch ngang
      .replace(/\s/g, '-')
      // Loại bỏ nhiều dấu gạch ngang liên tiếp
      .replace(/-+/g, '-')
      // Loại bỏ dấu gạch ngang ở đầu và cuối
      .replace(/^-+|-+$/g, '');
  };

  const removeDuplicateWords = (text: string): string => {
    const words = text.split('-');
    const uniqueWords = words.filter((word, index) => {
      return words.indexOf(word) === index && word.length > 0;
    });
    return uniqueWords.join('-');
  };

  const handleProcess = () => {
    if (!input.trim()) {
      toast.error('Vui lòng nhập tên ảnh cần xử lý');
      return;
    }

    const lines = input.split('\n');
    const processedLines = lines.map(line => {
      if (!line.trim()) return '';
      
      // Tách tên file và extension
      const lastDotIndex = line.lastIndexOf('.');
      let fileName = line;
      let extension = '';
      
      if (lastDotIndex > 0) {
        fileName = line.substring(0, lastDotIndex);
        extension = line.substring(lastDotIndex);
      }
      
      // Xử lý tên file
      let processed = processImageName(fileName);
      processed = removeDuplicateWords(processed);
      
      return processed + extension.toLowerCase();
    });

    setOutput(processedLines.join('\n'));
    toast.success('Đã xử lý tên ảnh thành công!');
  };

  const handleCopy = async () => {
    if (!output) {
      toast.error('Không có nội dung để sao chép');
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      toast.success('Đã sao chép vào clipboard!');
    } catch (err) {
      toast.error('Không thể sao chép vào clipboard');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    toast.success('Đã xóa nội dung');
  };

  const handleDownload = () => {
    if (!output) {
      toast.error('Không có nội dung để tải xuống');
      return;
    }

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-image-names.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Xử lý tên ảnh</h1>
          <Badge variant="secondary">Image</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tên ảnh gốc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Nhập tên ảnh cần xử lý (mỗi tên một dòng)&#10;Ví dụ:&#10;Ảnh Chụp Đẹp 2024.JPG&#10;Hình Nền Máy Tính.png&#10;Photo Wedding Day.jpeg"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleProcess} className="flex-1">
                  Xử lý tên ảnh
                </Button>
                <Button onClick={handleClear} variant="outline" size="icon">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tên ảnh đã xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Kết quả sẽ hiển thị ở đây..."
                value={output}
                readOnly
                className="min-h-[200px] font-mono text-sm bg-muted/50"
              />
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép
                </Button>
                <Button onClick={handleDownload} variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tính năng xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Tối ưu hóa tên file:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Chuyển về chữ thường</li>
                  <li>• Loại bỏ dấu tiếng Việt</li>
                  <li>• Thay thế dấu cách bằng dấu gạch ngang</li>
                  <li>• Loại bỏ ký tự đặc biệt</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Tối ưu cho Lightroom:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Loại bỏ từ trùng lặp</li>
                  <li>• Chuẩn hóa định dạng extension</li>
                  <li>• Tạo tên file dễ tìm kiếm</li>
                  <li>• Tương thích với hệ thống file</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
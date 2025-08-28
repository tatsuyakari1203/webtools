'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Copy, RotateCcw, FileText, Clipboard, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ImageNameProcessor = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [count, setCount] = useState(0);
  const [invalidNumbers, setInvalidNumbers] = useState<string[]>([]);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);

  const handleProcess = () => {
    const numbers = input.match(/\d+/g) || [];
    const uniqueNumbers = [...new Set(numbers)];

    const validNumbers: string[] = [];
    const currentInvalidNumbers: string[] = [];

    uniqueNumbers.forEach((num: string) => {
              if (num.length === 3 || num.length === 4) {
                validNumbers.push(num.length === 3 ? `0${num}` : num);
              } else {
                currentInvalidNumbers.push(num);
              }
            });

    const sortedValidNumbers = validNumbers.sort((a, b) => a.localeCompare(b));

    setOutput(sortedValidNumbers.join(' '));
    setCount(sortedValidNumbers.length);
    setInvalidNumbers(currentInvalidNumbers);
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast.success('Đã sao chép kết quả!');
    }
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setCount(0);
    setInvalidNumbers([]);
  };

  // Xử lý thông minh từ clipboard (text hoặc ảnh)
  const handleSmartPaste = async () => {
    try {
      setIsOCRProcessing(true);
      
      // Thử đọc text trước
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const updatedInput = input ? `${input}\n${text.trim()}` : text.trim();
          setInput(updatedInput);
          
          // Tự động xử lý text
          const numbers = updatedInput.match(/\d+/g) || [];
          const uniqueNumbers = [...new Set(numbers)] as string[];
          
          const validNumbers: string[] = [];
          const currentInvalidNumbers: string[] = [];
          
          uniqueNumbers.forEach((num: string) => {
            if (num.length === 3 || num.length === 4) {
              validNumbers.push(num.length === 3 ? `0${num}` : num);
            } else {
              currentInvalidNumbers.push(num);
            }
          });
          
          const sortedValidNumbers = validNumbers.sort((a, b) => a.localeCompare(b));
          
          setOutput(sortedValidNumbers.join(' '));
          setCount(sortedValidNumbers.length);
          setInvalidNumbers(currentInvalidNumbers);
          
          toast.success('Đã dán text và xử lý tự động!');
          return;
        }
      } catch (textError) {
        // Nếu không có text, thử đọc ảnh
      }
      
      // Đọc ảnh từ clipboard
      const clipboardItems = await navigator.clipboard.read();
      let imageFile: File | null = null;
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            imageFile = new File([blob], 'clipboard-image.png', { type });
            break;
          }
        }
        if (imageFile) break;
      }
      
      if (!imageFile) {
        toast.error('Không tìm thấy text hoặc ảnh trong clipboard.');
        return;
      }
      
      // Gọi API OCR
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('language', 'auto');
      formData.append('accuracy', 'standard');
      
      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi xử lý OCR');
      }
      
      const result = await response.json();
      
      if (result.success) {
         // Thêm text vào input hiện tại
         const newText = result.text.trim();
         if (newText) {
           const updatedInput = input ? `${input}\n${newText}` : newText;
           setInput(updatedInput);
           
           // Tự động xử lý sau khi OCR thành công
            const numbers = updatedInput.match(/\d+/g) || [];
            const uniqueNumbers = [...new Set(numbers)] as string[];
            
            const validNumbers: string[] = [];
            const currentInvalidNumbers: string[] = [];
            
            uniqueNumbers.forEach((num: string) => {
              if (num.length === 3 || num.length === 4) {
                validNumbers.push(num.length === 3 ? `0${num}` : num);
              } else {
                currentInvalidNumbers.push(num);
              }
            });
           
           const sortedValidNumbers = validNumbers.sort((a, b) => a.localeCompare(b));
           
           setOutput(sortedValidNumbers.join(' '));
           setCount(sortedValidNumbers.length);
           setInvalidNumbers(currentInvalidNumbers);
           
           toast.success('Đã trích xuất văn bản từ ảnh và xử lý tự động!');
         } else {
           toast.warning('Không tìm thấy văn bản trong ảnh.');
         }
       } else {
         throw new Error(result.error || 'Lỗi không xác định');
       }
    } catch (error) {
      console.error('Smart Paste Error:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Không có quyền truy cập clipboard. Vui lòng cho phép truy cập.');
      } else {
        toast.error('Lỗi khi xử lý từ clipboard.');
      }
    } finally {
      setIsOCRProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5" />
              Dữ liệu đầu vào
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text" className="text-sm font-medium">
                Dán danh sách tên file hoặc bất kỳ đoạn văn bản nào:
              </Label>
              <Textarea
                id="input-text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ví dụ:\nIMG_123.jpg\nDSC0456.arw\nP1010789.rw2\n124 457 9999"
                rows={8}
                className="font-mono text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleProcess} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Xử lý
              </Button>
              <Button 
                onClick={handleSmartPaste} 
                variant="outline" 
                disabled={isOCRProcessing}
                className="flex-1"
              >
                {isOCRProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Xử lý...
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Smart Paste
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Kết quả
              </div>
              {count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {count} số hợp lệ
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="output-text" className="text-sm font-medium">
                Các số đã được định dạng:
              </Label>
              <Textarea
                id="output-text"
                value={output}
                readOnly
                placeholder="Các số có 3 hoặc 4 chữ số sẽ xuất hiện ở đây, được sắp xếp và cách nhau bằng dấu cách."
                rows={6}
                className="bg-muted/50 font-mono text-sm resize-none"
              />
            </div>
            <Button 
              onClick={handleCopy} 
              disabled={!output}
              className="w-full"
              variant={output ? "default" : "secondary"}
            >
              <Copy className="h-4 w-4 mr-2" />
              Sao chép kết quả
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert */}
      {invalidNumbers.length > 0 && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Cảnh báo: Đã tìm thấy các số không hợp lệ</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">Các số có độ dài 1, 2, hoặc từ 5 chữ số trở lên sẽ bị loại bỏ.</p>
            <div className="flex flex-wrap gap-1">
              <span className="font-medium">Các số không hợp lệ:</span>
              {invalidNumbers.map((num, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {num}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cách thức hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Quy tắc xử lý:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Chỉ giữ lại số có 3 hoặc 4 chữ số
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Tự động thêm số 0 vào trước số có 3 chữ số
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Loại bỏ số trùng lặp
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Sắp xếp theo thứ tự tăng dần
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">🔍</span>
                  Hỗ trợ OCR từ ảnh trong clipboard
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Ví dụ:</h4>
              <div className="space-y-2 text-muted-foreground">
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="font-medium text-foreground mb-1">Đầu vào:</div>
                  <code className="text-xs">IMG_123.jpg DSC0456.arw P1010789.rw2</code>
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="font-medium text-foreground mb-1">Đầu ra:</div>
                  <code className="text-xs">0123 0456 0789 1010</code>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                   <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Tính năng OCR:</div>
                   <p className="text-xs text-blue-600 dark:text-blue-400">
                     Copy text hoặc ảnh chứa tên file → Click &ldquo;Smart Paste&rdquo; → Tự động trích xuất và xử lý
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageNameProcessor;
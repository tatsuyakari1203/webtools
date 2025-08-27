"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function ImageNameProcessor() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [count, setCount] = useState(0)
  const [hasWarning, setHasWarning] = useState(false)
  const [showButtons, setShowButtons] = useState(false)

  const processImageNames = () => {
    if (!input.trim()) {
      toast.error("Vui lòng nhập dữ liệu")
      return
    }

    // Extract numbers from input
    const numbers = (input.match(/\d+/g) || []).filter(item => item.length > 0)
    
    // Remove duplicates
    const uniqueNumbers = [...new Set(numbers)]
    
    // Add leading zeros to 3-digit numbers
    const formattedNumbers = uniqueNumbers.map(num => 
      num.length === 3 ? num.padStart(4, '0') : num
    )
    
    const result = formattedNumbers.join(" ")
    setOutput(result)
    setCount(uniqueNumbers.length)
    setShowButtons(true)
    
    // Check for warnings (1-2 digits or 5+ digits)
    const warning = numbers.some(num => num.length === 1 || num.length === 2 || num.length >= 5)
    setHasWarning(warning)
    
    toast.success("Xử lý thành công!")
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} đã được sao chép!`)
    } catch (error) {
      toast.error("Không thể sao chép")
    }
  }

  const copyValidNumbers = () => {
    const numbers = (input.match(/\d+/g) || []).filter(item => item.length > 0)
    const validNumbers = numbers.filter(num => num.length > 2 && num.length < 5)
    const result = [...new Set(validNumbers)].join(" ")
    
    if (result) {
      copyToClipboard(result, "Số hợp lệ")
    } else {
      toast.error("Không có số hợp lệ để sao chép!")
    }
  }

  return (
    <div className="space-y-6">


      <div className="space-y-4">
          <div>
            <Textarea
              placeholder="Nhập dãy số ở đây..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={processImageNames}>
              Xử Lý
            </Button>
            
            {showButtons && output && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(output, "Kết quả")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                
                {hasWarning && (
                  <Button 
                    variant="outline" 
                    onClick={copyValidNumbers}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Valid
                  </Button>
                )}
                

              </>
            )}
          </div>

          {count > 0 && (
            <p className="text-sm text-muted-foreground">
              Count: {count}
            </p>
          )}

          {output && (
            <Card>
              <CardContent className="p-4">
                <p className="font-mono break-all">{output}</p>
              </CardContent>
            </Card>
          )}

          {hasWarning && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Warning: Có tên ảnh không phù hợp.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn sử dụng trong Adobe Lightroom</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Vào tab <strong>Library</strong>, nhấn phím <strong>G</strong>, sau đó nhấn phím <strong>"\"</strong> để hiển thị <em>Filter Bar</em>.</li>
              <li>• Nhấn vào phần <strong>Text</strong> để bắt đầu tìm kiếm.</li>
              <li>• Chọn <strong>Any Searchable Field</strong> và <strong>Contains</strong>.</li>
              <li>• Dán chuỗi tên ảnh vào ô tìm kiếm và nhấn Enter để tìm kiếm.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn sử dụng công cụ</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Dán dãy số tên ảnh vào ô nhập liệu.</li>
              <li>• Công cụ sẽ xử lý và hiển thị dãy số đã được phân tách, cách nhau bằng dấu cách.</li>
              <li>• Chú ý: Tránh sử dụng các số có 1, 2 hoặc 3 chữ số, hoặc các số có từ 5 chữ số trở lên, vì điều này có thể gây khó khăn trong việc tìm kiếm ảnh chính xác.</li>
              <li>• Kiểm tra kết quả và nếu có thông báo cảnh báo, hãy điều chỉnh lại dãy số để đảm bảo tính chính xác.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
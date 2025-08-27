"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Copy, RotateCcw, Type, FileText } from "lucide-react"
import { toast } from "sonner"

export default function TextFormatterTool() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")

  const formatToUpperCase = () => {
    const formatted = inputText.toUpperCase()
    setOutputText(formatted)
  }

  const formatToLowerCase = () => {
    const formatted = inputText.toLowerCase()
    setOutputText(formatted)
  }

  const formatToTitleCase = () => {
    const formatted = inputText.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
    setOutputText(formatted)
  }

  const formatToCamelCase = () => {
    const formatted = inputText
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, '')
    setOutputText(formatted)
  }

  const formatToPascalCase = () => {
    const formatted = inputText
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase()
      })
      .replace(/\s+/g, '')
    setOutputText(formatted)
  }

  const formatToKebabCase = () => {
    const formatted = inputText
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
    setOutputText(formatted)
  }

  const formatToSnakeCase = () => {
    const formatted = inputText
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase()
    setOutputText(formatted)
  }

  const removeExtraSpaces = () => {
    const formatted = inputText.replace(/\s+/g, ' ').trim()
    setOutputText(formatted)
  }

  const removeAllSpaces = () => {
    const formatted = inputText.replace(/\s/g, '')
    setOutputText(formatted)
  }

  const reverseText = () => {
    const formatted = inputText.split('').reverse().join('')
    setOutputText(formatted)
  }

  const countWords = () => {
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0)
    const characters = inputText.length
    const charactersNoSpaces = inputText.replace(/\s/g, '').length
    const lines = inputText.split('\n').length
    
    const stats = `Thống kê văn bản:
- Từ: ${words.length}
- Ký tự: ${characters}
- Ký tự (không khoảng trắng): ${charactersNoSpaces}
- Dòng: ${lines}`
    setOutputText(stats)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      toast.success("Đã sao chép vào clipboard!")
    } catch {
      toast.error("Không thể sao chép văn bản")
    }
  }

  const clearAll = () => {
    setInputText("")
    setOutputText("")
  }

  const formatOptions = [
    { label: "UPPERCASE", action: formatToUpperCase, icon: Type },
    { label: "lowercase", action: formatToLowerCase, icon: Type },
    { label: "Title Case", action: formatToTitleCase, icon: Type },
    { label: "camelCase", action: formatToCamelCase, icon: Type },
    { label: "PascalCase", action: formatToPascalCase, icon: Type },
    { label: "kebab-case", action: formatToKebabCase, icon: Type },
    { label: "snake_case", action: formatToSnakeCase, icon: Type },
    { label: "Xóa khoảng trắng thừa", action: removeExtraSpaces, icon: FileText },
    { label: "Xóa tất cả khoảng trắng", action: removeAllSpaces, icon: FileText },
    { label: "Đảo ngược văn bản", action: reverseText, icon: FileText },
    { label: "Đếm từ & ký tự", action: countWords, icon: FileText },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Text Formatter</CardTitle>
            <Badge variant="secondary">Text</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="input-text" className="text-sm font-medium">
              Văn bản đầu vào
            </Label>
            <Textarea
              id="input-text"
              placeholder="Nhập văn bản cần format..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] resize-y"
            />
          </div>

          {/* Format Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tùy chọn format</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {formatOptions.map((option, index) => {
                const IconComponent = option.icon
                return (
                  <Button
                    key={index}
                    onClick={option.action}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2 px-3"
                    disabled={!inputText.trim()}
                  >
                    <IconComponent className="mr-2 h-3 w-3" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="output-text" className="text-sm font-medium">
                Kết quả
              </Label>
              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  disabled={!outputText}
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Sao chép
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="mr-2 h-3 w-3" />
                  Xóa tất cả
                </Button>
              </div>
            </div>
            <Textarea
              id="output-text"
              placeholder="Kết quả sẽ hiển thị ở đây..."
              value={outputText}
              readOnly
              className="min-h-[120px] resize-y bg-muted/50"
            />
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Nhập văn bản và chọn định dạng mong muốn. Kết quả sẽ hiển thị bên dưới.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
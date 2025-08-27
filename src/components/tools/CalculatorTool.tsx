"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Delete, RotateCcw } from "lucide-react"

export default function CalculatorTool() {
  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? num : display + num)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".")
    }
  }

  const clear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay("0")
    }
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue
      case "-":
        return firstValue - secondValue
      case "×":
        return firstValue * secondValue
      case "÷":
        return secondValue !== 0 ? firstValue / secondValue : 0
      case "=":
        return secondValue
      default:
        return secondValue
    }
  }

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display)
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }

  const buttonClass = "h-14 text-lg font-semibold transition-all duration-200 hover:scale-105"
  const numberButtonClass = `${buttonClass} bg-background hover:bg-muted border-2`
  const operatorButtonClass = `${buttonClass} bg-primary hover:bg-primary/90 text-primary-foreground`
  const specialButtonClass = `${buttonClass} bg-muted hover:bg-muted/80`

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Máy tính</CardTitle>
            <Badge variant="secondary">Math</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Display */}
          <div className="bg-muted/50 rounded-lg p-4 border-2">
            <div className="text-right">
              {operation && previousValue !== null && (
                <div className="text-sm text-muted-foreground mb-1">
                  {previousValue} {operation}
                </div>
              )}
              <div className="text-3xl font-mono font-bold text-foreground break-all">
                {display}
              </div>
            </div>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <Button
              onClick={clear}
              className={`${specialButtonClass} col-span-2`}
              variant="outline"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button
              onClick={deleteLast}
              className={specialButtonClass}
              variant="outline"
            >
              <Delete className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => performOperation("÷")}
              className={operatorButtonClass}
            >
              ÷
            </Button>

            {/* Row 2 */}
            <Button onClick={() => inputNumber("7")} className={numberButtonClass} variant="outline">
              7
            </Button>
            <Button onClick={() => inputNumber("8")} className={numberButtonClass} variant="outline">
              8
            </Button>
            <Button onClick={() => inputNumber("9")} className={numberButtonClass} variant="outline">
              9
            </Button>
            <Button
              onClick={() => performOperation("×")}
              className={operatorButtonClass}
            >
              ×
            </Button>

            {/* Row 3 */}
            <Button onClick={() => inputNumber("4")} className={numberButtonClass} variant="outline">
              4
            </Button>
            <Button onClick={() => inputNumber("5")} className={numberButtonClass} variant="outline">
              5
            </Button>
            <Button onClick={() => inputNumber("6")} className={numberButtonClass} variant="outline">
              6
            </Button>
            <Button
              onClick={() => performOperation("-")}
              className={operatorButtonClass}
            >
              -
            </Button>

            {/* Row 4 */}
            <Button onClick={() => inputNumber("1")} className={numberButtonClass} variant="outline">
              1
            </Button>
            <Button onClick={() => inputNumber("2")} className={numberButtonClass} variant="outline">
              2
            </Button>
            <Button onClick={() => inputNumber("3")} className={numberButtonClass} variant="outline">
              3
            </Button>
            <Button
              onClick={() => performOperation("+")}
              className={operatorButtonClass}
            >
              +
            </Button>

            {/* Row 5 */}
            <Button
              onClick={() => inputNumber("0")}
              className={`${numberButtonClass} col-span-2`}
              variant="outline"
            >
              0
            </Button>
            <Button onClick={inputDecimal} className={numberButtonClass} variant="outline">
              .
            </Button>
            <Button
              onClick={handleEquals}
              className={`${operatorButtonClass} bg-green-600 hover:bg-green-700`}
            >
              =
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Sử dụng các nút số và phép toán để thực hiện tính toán</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
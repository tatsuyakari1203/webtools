'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  const handleButtonClick = (value: string) => {
    if (value === 'C') {
      clear();
    } else if (value === '=') {
      performCalculation();
    } else if (['+', '-', '×', '÷'].includes(value)) {
      inputOperation(value);
    } else if (value === '.') {
      if (display.indexOf('.') === -1) {
        inputNumber(value);
      }
    } else if (value === '±') {
      setDisplay(String(parseFloat(display) * -1));
    } else if (value === '%') {
      setDisplay(String(parseFloat(display) / 100));
    } else {
      inputNumber(value);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-right text-2xl font-mono">
            {display}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {buttons.flat().map((button, index) => (
              <Button
                key={index}
                variant={['+', '-', '×', '÷', '='].includes(button) ? 'default' : 'outline'}
                className={`h-12 text-lg ${
                  button === '0' ? 'col-span-2' : ''
                } ${
                  button === 'C' ? 'bg-red-500 hover:bg-red-600 text-white' : ''
                }`}
                onClick={() => handleButtonClick(button)}
              >
                {button}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator as CalcIcon, Sigma, Code, ArrowLeftRight, History, Thermometer, Ruler, Weight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type CalculatorMode = 'basic' | 'scientific' | 'programmer' | 'converter';
type HistoryEntry = {
  expression: string;
  result: string;
  timestamp: Date;
};

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expression, setExpression] = useState('');
  const [converterCategory, setConverterCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [converterValue, setConverterValue] = useState('');
  const [programmerBase, setProgrammerBase] = useState<'bin' | 'oct' | 'dec' | 'hex'>('dec');
  const [programmerValue, setProgrammerValue] = useState('0');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

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
      case '^':
        return Math.pow(firstValue, secondValue);
      case 'mod':
        return firstValue % secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const scientificCalculate = (value: number, func: string) => {
    switch (func) {
      case 'sin':
        return Math.sin(value * Math.PI / 180);
      case 'cos':
        return Math.cos(value * Math.PI / 180);
      case 'tan':
        return Math.tan(value * Math.PI / 180);
      case 'log':
        return Math.log10(value);
      case 'ln':
        return Math.log(value);
      case 'sqrt':
        return Math.sqrt(value);
      case 'x²':
        return value * value;
      case '1/x':
        return 1 / value;
      case 'x!':
        return factorial(value);
      case 'π':
        return Math.PI;
      case 'e':
        return Math.E;
      default:
        return value;
    }
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
  };

  const addToHistory = (expr: string, result: string) => {
    const newEntry: HistoryEntry = {
      expression: expr,
      result: result,
      timestamp: new Date()
    };
    setHistory(prev => [newEntry, ...prev.slice(0, 19)]); // Keep last 20 entries
  };

  // Unit conversion data
  const unitData = {
    length: {
      name: 'Length',
      icon: Ruler,
      units: {
        mm: { name: 'Millimeter', factor: 1 },
        cm: { name: 'Centimeter', factor: 10 },
        m: { name: 'Meter', factor: 1000 },
        km: { name: 'Kilometer', factor: 1000000 },
        inch: { name: 'Inch', factor: 25.4 },
        ft: { name: 'Feet', factor: 304.8 },
        yard: { name: 'Yard', factor: 914.4 },
        mile: { name: 'Mile', factor: 1609344 }
      }
    },
    weight: {
      name: 'Weight',
      icon: Weight,
      units: {
        mg: { name: 'Milligram', factor: 1 },
        g: { name: 'Gram', factor: 1000 },
        kg: { name: 'Kilogram', factor: 1000000 },
        oz: { name: 'Ounce', factor: 28349.5 },
        lb: { name: 'Pound', factor: 453592 },
        ton: { name: 'Ton', factor: 1000000000 }
      }
    },
    temperature: {
      name: 'Temperature',
      icon: Thermometer,
      units: {
        celsius: { name: 'Celsius (°C)', factor: 1 },
        fahrenheit: { name: 'Fahrenheit (°F)', factor: 1 },
        kelvin: { name: 'Kelvin (K)', factor: 1 }
      }
    }
  };

  const convertUnits = (value: number, from: string, to: string, category: string) => {
    if (category === 'temperature') {
      return convertTemperature(value, from, to);
    }
    
    const categoryData = unitData[category as keyof typeof unitData];
    if (!categoryData) return value;
    
    const units = categoryData.units as Record<string, { name: string; factor: number }>;
    const fromFactor = units[from]?.factor || 1;
    const toFactor = units[to]?.factor || 1;
    
    return (value * fromFactor) / toFactor;
  };

  const convertTemperature = (value: number, from: string, to: string) => {
    let celsius = value;
    
    // Convert to Celsius first
    if (from === 'fahrenheit') {
      celsius = (value - 32) * 5/9;
    } else if (from === 'kelvin') {
      celsius = value - 273.15;
    }
    
    // Convert from Celsius to target
    if (to === 'fahrenheit') {
      return celsius * 9/5 + 32;
    } else if (to === 'kelvin') {
      return celsius + 273.15;
    }
    
    return celsius;
  };

  const handleUnitConversion = () => {
    if (!converterValue || !fromUnit || !toUnit) return;
    
    const inputValue = parseFloat(converterValue);
    if (isNaN(inputValue)) return;
    
    const result = convertUnits(inputValue, fromUnit, toUnit, converterCategory);
    const categoryData = unitData[converterCategory as keyof typeof unitData];
    const units = categoryData.units as Record<string, { name: string; factor: number }>;
    const fromUnitName = units[fromUnit]?.name || fromUnit;
    const toUnitName = units[toUnit]?.name || toUnit;
    
    const expr = `${inputValue} ${fromUnitName} = ${result.toFixed(6)} ${toUnitName}`;
    addToHistory(expr, result.toString());
    setDisplay(result.toString());
  };

  // Programmer calculator functions
  const convertToBase = (value: number, base: 'bin' | 'oct' | 'dec' | 'hex'): string => {
    if (isNaN(value)) return '0';
    const intValue = Math.floor(Math.abs(value));
    
    switch (base) {
      case 'bin':
        return intValue.toString(2);
      case 'oct':
        return intValue.toString(8);
      case 'dec':
        return intValue.toString(10);
      case 'hex':
        return intValue.toString(16).toUpperCase();
      default:
        return intValue.toString();
    }
  };

  const parseFromBase = (value: string, base: 'bin' | 'oct' | 'dec' | 'hex'): number => {
    switch (base) {
      case 'bin':
        return parseInt(value, 2);
      case 'oct':
        return parseInt(value, 8);
      case 'dec':
        return parseInt(value, 10);
      case 'hex':
        return parseInt(value, 16);
      default:
        return parseInt(value, 10);
    }
  };

  const handleProgrammerInput = (input: string) => {
    if (programmerValue === '0' && input !== '.') {
      setProgrammerValue(input);
    } else {
      setProgrammerValue(prev => prev + input);
    }
  };

  const handleBitwiseOperation = (operation: string) => {
    const currentValue = parseFromBase(programmerValue, programmerBase);
    let result: number;
    
    switch (operation) {
      case 'NOT':
        result = ~currentValue;
        break;
      case 'AND':
        // For demo, AND with itself
        result = currentValue & currentValue;
        break;
      case 'OR':
        // For demo, OR with itself  
        result = currentValue | currentValue;
        break;
      case 'XOR':
        // For demo, XOR with 0
        result = currentValue ^ 0;
        break;
      case 'LSH':
        result = currentValue << 1;
        break;
      case 'RSH':
        result = currentValue >> 1;
        break;
      default:
        result = currentValue;
    }
    
    const resultStr = convertToBase(result, programmerBase);
    setProgrammerValue(resultStr);
    setDisplay(result.toString());
    addToHistory(`${operation}(${currentValue})`, result.toString());
  };

  const clearProgrammer = () => {
    setProgrammerValue('0');
    setDisplay('0');
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      const expr = `${previousValue} ${operation} ${inputValue}`;
      
      addToHistory(expr, String(newValue));
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
      setExpression('');
    }
  };

  const handleScientificFunction = (func: string) => {
    const inputValue = parseFloat(display);
    const result = scientificCalculate(inputValue, func);
    const expr = `${func}(${inputValue})`;
    
    addToHistory(expr, String(result));
    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const selectHistoryResult = (result: string) => {
    setDisplay(result);
    setWaitingForOperand(true);
    setShowHistory(false);
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const inputDecimal = () => {
    if (display.indexOf('.') === -1) {
      inputNumber('.');
    }
  };

  const equals = () => {
    performCalculation();
  };

  const renderBasicCalculator = () => (
    <div className="grid grid-cols-4 gap-2">
      <Button variant="outline" onClick={clear} className="col-span-2 h-14 text-lg font-semibold">
        Clear
      </Button>
      <Button variant="outline" onClick={deleteLast} className="h-14 text-lg font-semibold">
        ⌫
      </Button>
      <Button variant="outline" onClick={() => inputOperation('÷')} className="h-14 text-lg font-semibold">
        ÷
      </Button>
      
      <Button variant="outline" onClick={() => inputNumber('7')} className="h-14 text-lg font-semibold">
        7
      </Button>
      <Button variant="outline" onClick={() => inputNumber('8')} className="h-14 text-lg font-semibold">
        8
      </Button>
      <Button variant="outline" onClick={() => inputNumber('9')} className="h-14 text-lg font-semibold">
        9
      </Button>
      <Button variant="outline" onClick={() => inputOperation('×')} className="h-14 text-lg font-semibold">
        ×
      </Button>
      
      <Button variant="outline" onClick={() => inputNumber('4')} className="h-14 text-lg font-semibold">
        4
      </Button>
      <Button variant="outline" onClick={() => inputNumber('5')} className="h-14 text-lg font-semibold">
        5
      </Button>
      <Button variant="outline" onClick={() => inputNumber('6')} className="h-14 text-lg font-semibold">
        6
      </Button>
      <Button variant="outline" onClick={() => inputOperation('-')} className="h-14 text-lg font-semibold">
        -
      </Button>
      
      <Button variant="outline" onClick={() => inputNumber('1')} className="h-14 text-lg font-semibold">
        1
      </Button>
      <Button variant="outline" onClick={() => inputNumber('2')} className="h-14 text-lg font-semibold">
        2
      </Button>
      <Button variant="outline" onClick={() => inputNumber('3')} className="h-14 text-lg font-semibold">
        3
      </Button>
      <Button variant="outline" onClick={() => inputOperation('+')} className="h-14 text-lg font-semibold">
        +
      </Button>
      
      <Button variant="outline" onClick={() => inputNumber('0')} className="col-span-2 h-14 text-lg font-semibold">
        0
      </Button>
      <Button variant="outline" onClick={inputDecimal} className="h-14 text-lg font-semibold">
        .
      </Button>
      <Button variant="default" onClick={equals} className="h-14 text-lg font-semibold">
        =
      </Button>
    </div>
  );

  const renderScientificCalculator = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        <Button variant="outline" onClick={() => handleScientificFunction('sin')} className="h-12 text-sm font-semibold">
          sin
        </Button>
        <Button variant="outline" onClick={() => handleScientificFunction('cos')} className="h-12 text-sm font-semibold">
          cos
        </Button>
        <Button variant="outline" onClick={() => handleScientificFunction('tan')} className="h-12 text-sm font-semibold">
          tan
        </Button>
        <Button variant="outline" onClick={() => handleScientificFunction('log')} className="h-12 text-sm font-semibold">
          log
        </Button>
        <Button variant="outline" onClick={() => handleScientificFunction('ln')} className="h-12 text-sm font-semibold">
          ln
        </Button>
        
        <Button variant="outline" onClick={() => handleScientificFunction('sqrt')} className="h-12 text-sm font-semibold">
          √
        </Button>
        <Button variant="outline" onClick={() => handleScientificFunction('x²')} className="h-12 text-sm font-semibold">
          x²
        </Button>
        <Button variant="outline" onClick={() => inputOperation('^')} className="h-12 text-sm font-semibold">
          x^y
        </Button>
        <Button variant="outline" onClick={() => handleScientificFunction('1/x')} className="h-12 text-sm font-semibold">
          1/x
        </Button>
        <Button variant="outline" onClick={() => handleScientificFunction('x!')} className="h-12 text-sm font-semibold">
          x!
        </Button>
        
        <Button variant="outline" onClick={() => setDisplay(String(Math.PI))} className="h-12 text-sm font-semibold">
          π
        </Button>
        <Button variant="outline" onClick={() => setDisplay(String(Math.E))} className="h-12 text-sm font-semibold">
          e
        </Button>
        <Button variant="outline" onClick={() => inputOperation('mod')} className="h-12 text-sm font-semibold">
          mod
        </Button>
        <Button variant="outline" onClick={() => inputOperation('(')} className="h-12 text-sm font-semibold">
          (
        </Button>
        <Button variant="outline" onClick={() => inputOperation(')')} className="h-12 text-sm font-semibold">
          )
        </Button>
      </div>
      {renderBasicCalculator()}
    </div>
  );

  const renderHistoryPanel = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Calculation History</h3>
        <Button variant="outline" size="sm" onClick={clearHistory}>
          Clear All
        </Button>
      </div>
      <div className="max-h-60 overflow-y-auto space-y-1">
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No calculations yet</p>
        ) : (
          history.map((entry, index) => (
            <div 
              key={index} 
              className="p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted"
              onClick={() => selectHistoryResult(entry.result)}
            >
              <div className="text-sm text-muted-foreground">{entry.expression}</div>
              <div className="font-mono">{entry.result}</div>
              <div className="text-xs text-muted-foreground/70">
                {entry.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Calculator</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Math</Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 border-2">
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">
              {expression && <span>{expression}</span>}
            </div>
            <div className="text-3xl font-mono font-bold text-foreground break-all">{display}</div>
          </div>
        </div>
        
        {showHistory ? (
          renderHistoryPanel()
        ) : (
          <Tabs value={mode} onValueChange={(value) => setMode(value as CalculatorMode)}>
           <TabsList className="grid w-full grid-cols-4">
             <TabsTrigger value="basic" className="flex items-center gap-1">
               <CalcIcon className="h-4 w-4" />
               Basic
             </TabsTrigger>
             <TabsTrigger value="scientific" className="flex items-center gap-1">
               <Sigma className="h-4 w-4" />
               Scientific
             </TabsTrigger>
             <TabsTrigger value="programmer" className="flex items-center gap-1">
               <Code className="h-4 w-4" />
               Programmer
             </TabsTrigger>
             <TabsTrigger value="converter" className="flex items-center gap-1">
               <ArrowLeftRight className="h-4 w-4" />
               Converter
             </TabsTrigger>
           </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              {renderBasicCalculator()}
            </TabsContent>
            
            <TabsContent value="scientific" className="space-y-4">
              {renderScientificCalculator()}
            </TabsContent>
            
            <TabsContent value="programmer" className="space-y-4">
               <div className="space-y-4">
                 <div className="grid grid-cols-4 gap-2">
                   <Button 
                     variant={programmerBase === 'bin' ? 'default' : 'outline'}
                     onClick={() => setProgrammerBase('bin')}
                     className="h-12 text-sm font-semibold"
                   >
                     BIN
                   </Button>
                   <Button 
                     variant={programmerBase === 'oct' ? 'default' : 'outline'}
                     onClick={() => setProgrammerBase('oct')}
                     className="h-12 text-sm font-semibold"
                   >
                     OCT
                   </Button>
                   <Button 
                     variant={programmerBase === 'dec' ? 'default' : 'outline'}
                     onClick={() => setProgrammerBase('dec')}
                     className="h-12 text-sm font-semibold"
                   >
                     DEC
                   </Button>
                   <Button 
                     variant={programmerBase === 'hex' ? 'default' : 'outline'}
                     onClick={() => setProgrammerBase('hex')}
                     className="h-12 text-sm font-semibold"
                   >
                     HEX
                   </Button>
                 </div>
                 
                 <div className="bg-muted/50 p-3 rounded text-right font-mono border">
                   <div className="text-sm text-muted-foreground">{programmerBase.toUpperCase()}</div>
                   <div className="text-lg">{programmerValue}</div>
                   <div className="text-xs text-muted-foreground">
                     DEC: {parseFromBase(programmerValue, programmerBase)}
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-6 gap-2">
                   <Button variant="outline" onClick={() => handleBitwiseOperation('NOT')} className="h-10 text-sm font-semibold">
                     NOT
                   </Button>
                   <Button variant="outline" onClick={() => handleBitwiseOperation('AND')} className="h-10 text-sm font-semibold">
                     AND
                   </Button>
                   <Button variant="outline" onClick={() => handleBitwiseOperation('OR')} className="h-10 text-sm font-semibold">
                     OR
                   </Button>
                   <Button variant="outline" onClick={() => handleBitwiseOperation('XOR')} className="h-10 text-sm font-semibold">
                     XOR
                   </Button>
                   <Button variant="outline" onClick={() => handleBitwiseOperation('LSH')} className="h-10 text-sm font-semibold">
                     LSH
                   </Button>
                   <Button variant="outline" onClick={() => handleBitwiseOperation('RSH')} className="h-10 text-sm font-semibold">
                     RSH
                   </Button>
                 </div>
                 
                 <div className="bg-muted/50 rounded-lg p-4 border-2">
                   <div className="text-right">
                     <div className="text-2xl font-mono font-bold text-foreground break-all">
                       {converterValue || '0'}
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-4 gap-2">
                   <Button variant="outline" onClick={clearProgrammer} className="col-span-2 h-12 text-sm font-semibold">
                     Clear
                   </Button>
                   <Button variant="outline" onClick={() => handleProgrammerInput('0')} className="h-12 text-sm font-semibold">
                     0
                   </Button>
                   <Button variant="outline" onClick={() => handleProgrammerInput('1')} className="h-12 text-sm font-semibold">
                     1
                   </Button>
                   
                   {programmerBase !== 'bin' && (
                     <>
                       <Button variant="outline" onClick={() => handleProgrammerInput('2')} className="h-12 text-sm font-semibold">
                         2
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('3')} className="h-12 text-sm font-semibold">
                         3
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('4')} className="h-12 text-sm font-semibold">
                         4
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('5')} className="h-12 text-sm font-semibold">
                         5
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('6')} className="h-12 text-sm font-semibold">
                         6
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('7')} className="h-12 text-sm font-semibold">
                         7
                       </Button>
                     </>
                   )}
                   
                   {(programmerBase === 'dec' || programmerBase === 'hex') && (
                     <>
                       <Button variant="outline" onClick={() => handleProgrammerInput('8')} className="h-12 text-sm font-semibold">
                         8
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('9')} className="h-12 text-sm font-semibold">
                         9
                       </Button>
                     </>
                   )}
                   
                   {programmerBase === 'hex' && (
                     <>
                       <Button variant="outline" onClick={() => handleProgrammerInput('A')} className="h-12 text-sm font-semibold">
                         A
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('B')} className="h-12 text-sm font-semibold">
                         B
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('C')} className="h-12 text-sm font-semibold">
                         C
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('D')} className="h-12 text-sm font-semibold">
                         D
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('E')} className="h-12 text-sm font-semibold">
                         E
                       </Button>
                       <Button variant="outline" onClick={() => handleProgrammerInput('F')} className="h-12 text-sm font-semibold">
                         F
                       </Button>
                     </>
                   )}
                 </div>
               </div>
             </TabsContent>
            
            <TabsContent value="converter" className="space-y-4">
               <div className="space-y-4">
                 <div className="grid grid-cols-4 gap-2">
                   <Button 
                     variant={converterCategory === 'length' ? 'default' : 'outline'} 
                     onClick={() => setConverterCategory('length')} 
                     className="h-10 text-sm font-semibold"
                   >
                     <Ruler className="h-4 w-4 mr-1" />
                     Length
                   </Button>
                   <Button 
                     variant={converterCategory === 'weight' ? 'default' : 'outline'} 
                     onClick={() => setConverterCategory('weight')} 
                     className="h-10 text-sm font-semibold"
                   >
                     <Weight className="h-4 w-4 mr-1" />
                     Weight
                   </Button>
                   <Button 
                     variant={converterCategory === 'temperature' ? 'default' : 'outline'} 
                     onClick={() => setConverterCategory('temperature')} 
                     className="h-10 text-sm font-semibold"
                   >
                     <Thermometer className="h-4 w-4 mr-1" />
                     Temperature
                   </Button>
                   <Button 
                     variant="outline" 
                     disabled 
                     className="h-10 text-sm font-semibold opacity-50"
                   >
                     Volume
                   </Button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="from-unit" className="text-sm font-medium mb-2 block">From</Label>
                     <Select value={fromUnit} onValueChange={setFromUnit}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select unit" />
                       </SelectTrigger>
                       <SelectContent>
                         {Object.entries(unitData[converterCategory as keyof typeof unitData].units).map(([key, unit]) => (
                           <SelectItem key={key} value={key}>
                             {(unit as { name: string }).name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div>
                     <Label htmlFor="to-unit" className="text-sm font-medium mb-2 block">To</Label>
                     <Select value={toUnit} onValueChange={setToUnit}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select unit" />
                       </SelectTrigger>
                       <SelectContent>
                         {Object.entries(unitData[converterCategory as keyof typeof unitData].units).map(([key, unit]) => (
                           <SelectItem key={key} value={key}>
                             {(unit as { name: string }).name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 
                 <div className="bg-muted/50 rounded-lg p-4 border-2">
                   <div className="text-right">
                     <div className="text-2xl font-mono font-bold text-foreground break-all">
                       {converterValue || '0'}
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-4 gap-2">
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '7')} className="h-12 text-sm font-semibold">
                     7
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '8')} className="h-12 text-sm font-semibold">
                     8
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '9')} className="h-12 text-sm font-semibold">
                     9
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue('')} className="h-12 text-sm font-semibold">
                     C
                   </Button>
                   
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '4')} className="h-12 text-sm font-semibold">
                     4
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '5')} className="h-12 text-sm font-semibold">
                     5
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '6')} className="h-12 text-sm font-semibold">
                     6
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev.slice(0, -1) || '')} className="h-12 text-sm font-semibold">
                     ⌫
                   </Button>
                   
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '1')} className="h-12 text-sm font-semibold">
                     1
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '2')} className="h-12 text-sm font-semibold">
                     2
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '3')} className="h-12 text-sm font-semibold">
                     3
                   </Button>
                   <Button 
                     variant="default" 
                     onClick={handleUnitConversion} 
                     className="h-12 text-sm font-semibold"
                     disabled={!converterValue || !fromUnit || !toUnit}
                   >
                     =
                   </Button>
                   
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev + '0')} className="col-span-2 h-12 text-sm font-semibold">
                     0
                   </Button>
                   <Button variant="outline" onClick={() => setConverterValue(prev => prev.includes('.') ? prev : prev + '.')} className="h-12 text-sm font-semibold">
                     .
                   </Button>
                   <Button variant="outline" onClick={() => { const temp = fromUnit; setFromUnit(toUnit); setToUnit(temp); }} className="h-12 text-sm font-semibold">
                     ⇄
                   </Button>
                 </div>
               </div>
             </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
export interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForOperand: boolean;
}

export type CalculatorOperation = '+' | '-' | '×' | '÷' | '=';

export type CalculatorButton = CalculatorOperation | 'C' | '±' | '%' | '.' | string;
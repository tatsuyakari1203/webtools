'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  selectedModel: 'seedream' | 'flux-kontext';
  onModelChange: (model: 'seedream' | 'flux-kontext') => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false
}: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Model</Label>
      <Select 
        value={selectedModel} 
        onValueChange={(value: 'seedream' | 'flux-kontext') => {
          console.log('Model changed to:', value);
          onModelChange(value);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="seedream">Seedream</SelectItem>
          <SelectItem value="flux-kontext">Flux Kontext</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
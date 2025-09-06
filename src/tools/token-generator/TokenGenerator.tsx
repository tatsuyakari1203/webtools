'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw } from 'lucide-react';

export default function TokenGenerator() {
  const [token, setToken] = useState('');
  const [length, setLength] = useState([64]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);

  const generateToken = () => {
    let charset = '';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (charset === '') {
      setToken('Please select at least one character type');
      return;
    }
    
    let result = '';
    for (let i = 0; i < length[0]; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setToken(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      // You could add a toast notification here
      alert('Token copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };



  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">

        <div className="space-y-6">
          {/* Character Type Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="uppercase">Uppercase (ABC...)</Label>
                <Badge variant={includeUppercase ? "default" : "outline"}>
                  {includeUppercase ? "ON" : "OFF"}
                </Badge>
              </div>
              <Switch
                id="uppercase"
                checked={includeUppercase}
                onCheckedChange={setIncludeUppercase}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="lowercase">Lowercase (abc...)</Label>
                <Badge variant={includeLowercase ? "default" : "outline"}>
                  {includeLowercase ? "ON" : "OFF"}
                </Badge>
              </div>
              <Switch
                id="lowercase"
                checked={includeLowercase}
                onCheckedChange={setIncludeLowercase}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="numbers">Numbers (123...)</Label>
                <Badge variant={includeNumbers ? "default" : "outline"}>
                  {includeNumbers ? "ON" : "OFF"}
                </Badge>
              </div>
              <Switch
                id="numbers"
                checked={includeNumbers}
                onCheckedChange={setIncludeNumbers}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="symbols">Symbols (!-...)</Label>
                <Badge variant={includeSymbols ? "default" : "outline"}>
                  {includeSymbols ? "ON" : "OFF"}
                </Badge>
              </div>
              <Switch
                id="symbols"
                checked={includeSymbols}
                onCheckedChange={setIncludeSymbols}
              />
            </div>
          </div>

          {/* Length Slider */}
          <div className="space-y-3">
            <Label>Length ({length[0]})</Label>
            <Slider
              value={length}
              onValueChange={setLength}
              max={128}
              min={4}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4</span>
              <span>128</span>
            </div>
          </div>

          {/* Generated Token Display */}
          <div className="space-y-3">
            <Label>Generated Token</Label>
            <div className="relative">
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-lg resize-none bg-muted/50 font-mono text-sm"
                value={token}
                readOnly
                placeholder="Click 'Generate' or 'Refresh' to create a new token..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={generateToken} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              {token ? 'Refresh' : 'Generate'}
            </Button>
            <Button 
              variant="outline" 
              onClick={copyToClipboard}
              disabled={!token || token.includes('Please select')}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TextFormatter() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  const formatters = [
    {
      name: 'Uppercase',
      action: () => setResult(text.toUpperCase()),
      description: 'Convert all text to uppercase'
    },
    {
      name: 'Lowercase',
      action: () => setResult(text.toLowerCase()),
      description: 'Convert all text to lowercase'
    },
    {
      name: 'Title Case',
      action: () => setResult(text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())),
      description: 'Capitalize the first letter of each word'
    },
    {
      name: 'Sentence Case',
      action: () => setResult(text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()),
      description: 'Capitalize the first letter of the sentence'
    },
    {
      name: 'Remove Spaces',
      action: () => setResult(text.replace(/\s+/g, '')),
      description: 'Remove all spaces'
    },
    {
      name: 'Remove Extra Spaces',
      action: () => setResult(text.replace(/\s+/g, ' ').trim()),
      description: 'Remove extra spaces'
    },
    {
      name: 'Reverse Text',
      action: () => setResult(text.split('').reverse().join('')),
      description: 'Reverse the text'
    },
    {
      name: 'Word Count',
      action: () => {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;
        setResult(`Words: ${words.length}\nCharacters: ${chars}\nCharacters (no spaces): ${charsNoSpaces}`);
      },
      description: 'Count words and characters'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearAll = () => {
    setText('');
    setResult('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Text Formatter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Text</label>
              <textarea
                className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter text to format..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Result</label>
              <textarea
                className="w-full h-40 p-3 border rounded-lg resize-none bg-gray-50 dark:bg-gray-800"
                placeholder="Result will be displayed here..."
                value={result}
                readOnly
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={copyToClipboard} disabled={!result}>
              Copy Result
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formatting Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formatters.map((formatter, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{formatter.name}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatter.description}
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={formatter.action}
                  disabled={!text.trim()}
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
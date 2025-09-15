'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditInstructionsProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  includeImageContext: boolean;
  onIncludeImageContextChange: (include: boolean) => void;
  hasImages: boolean;
  isEnhancing?: boolean;
  onEnhancePrompt?: () => Promise<void>;
}

const EditInstructions: React.FC<EditInstructionsProps> = ({
  prompt,
  onPromptChange,
  includeImageContext,
  onIncludeImageContextChange,
  hasImages,
  isEnhancing = false,
  onEnhancePrompt
}) => {

  // Use the provided onEnhancePrompt function or fallback to local implementation
  const handleEnhancePrompt = async () => {
    if (onEnhancePrompt) {
      await onEnhancePrompt();
    } else {
      if (!prompt.trim()) {
        toast.error('Please enter a prompt first');
        return;
      }

      try {
        const response = await fetch('/api/seedream/enhance-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            category: 'image-editing',
            ...(includeImageContext && hasImages && {
              image: null // This would be filled by the parent component
            })
          })
        });

        const data = await response.json();

        if (data.success) {
          onPromptChange(data.enhanced_prompt);
          toast.success('Prompt enhanced successfully!');
        } else {
          toast.error(data.error || 'Failed to enhance prompt');
        }
      } catch (error) {
        console.error('Error enhancing prompt:', error);
        toast.error('Failed to enhance prompt');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Edit Instructions</CardTitle>
        <CardDescription>
          Configure your AI-powered image editing parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Edit Prompt
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-8 px-3 text-xs font-medium">
                Image Editing
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="h-8 px-3 text-xs"
              >
                {isEnhancing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isEnhancing ? 'Enhancing...' : 'Enhance'}
              </Button>
            </div>
          </div>
          <Textarea
            id="prompt"
            placeholder="Describe how you want to edit the images (e.g., 'make it more colorful', 'add a sunset background', 'change to winter scene')..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-image-context"
              checked={includeImageContext}
              onCheckedChange={(checked) => onIncludeImageContextChange(checked as boolean)}
              disabled={!hasImages}
            />
            <Label htmlFor="include-image-context" className="text-xs text-muted-foreground cursor-pointer">
              Include image context for more accurate enhancement {!hasImages && '(upload images first)'}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Be specific about the changes you want to make. Use the Enhance button to improve your prompt with AI.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditInstructions;
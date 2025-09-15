'use client';

import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";

interface GenerateButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  disabled: boolean;
  hasPrompt: boolean;
  hasImages: boolean;
}

export function GenerateButton({
  onClick,
  isProcessing,
  disabled,
  hasPrompt,
  hasImages
}: GenerateButtonProps) {
  return (
    <div className="mt-3 mb-3">
      <Button
        onClick={onClick}
        disabled={disabled || isProcessing || !hasImages || !hasPrompt}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Images...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Edited Images
          </>
        )}
      </Button>
      {(!hasPrompt || !hasImages) && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {!hasPrompt ? 'Enter an edit prompt to continue' : 'Upload images to get started'}
        </p>
      )}
    </div>
  );
}
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Upload } from 'lucide-react';

interface PreviewProps {
  resultImages: string[];
  onDownload: (url: string, index: number) => void;
}

export default function Preview({
  resultImages,
  onDownload
}: PreviewProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Preview</CardTitle>
        <CardDescription>
          Edited images will appear here
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Results Preview */}
        {resultImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium mb-3">Edited Results</h4>
            <div className="space-y-4">
              {resultImages.map((imageUrl, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Result {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(imageUrl, index)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={imageUrl}
                      alt={`Result ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {resultImages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">No edited images yet</h3>
            <p className="text-xs text-muted-foreground">
              Add edit instructions and generate images to see results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
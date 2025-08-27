import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart3, Info } from 'lucide-react';
import { StatisticsPanelProps } from '../types';
import { formatFileSize, formatProcessingTime } from '../utils/statistics';

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ 
  statistics 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {statistics.completedFiles}
            </p>
            <p className="text-sm text-muted-foreground">Files Processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatFileSize(statistics.totalSavedSize)}
            </p>
            <p className="text-sm text-muted-foreground">Space Saved</p>
          </div>
          <div className="text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                      {statistics.averageCompressionRatio.toFixed(1)}%
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Compression</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Weighted average based on total data size</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                      {formatProcessingTime(statistics.totalProcessingTime)}
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {statistics.actualProcessingTime ? 'Actual Time' : 'Total Time'}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {statistics.actualProcessingTime 
                      ? 'Real elapsed time for parallel processing' 
                      : 'Sum of individual file processing times'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Original Size:</span>
              <span className="font-medium">{formatFileSize(statistics.totalOriginalSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Converted Size:</span>
              <span className="font-medium">{formatFileSize(statistics.totalConvertedSize)}</span>
            </div>
            {statistics.zipSize && statistics.zipSize > 0 && (
              <div className="flex justify-between">
                <span>ZIP File Size:</span>
                <span className="font-medium">{formatFileSize(statistics.zipSize)}</span>
              </div>
            )}
            {statistics.parallelEfficiency && (
              <div className="flex justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help flex items-center gap-1">
                        Parallel Efficiency:
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Actual time vs sum of individual times</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-medium text-green-600">{statistics.parallelEfficiency}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsPanel;
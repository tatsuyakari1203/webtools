'use client';

import { useState, useEffect } from 'react';
import { getRandomQuote, shouldShowQuote } from './motivationalQuotes';

interface QuoteDisplayProps {
  className?: string;
}

export default function QuoteDisplay({ className = '' }: QuoteDisplayProps) {
  const [quote, setQuote] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    const checkQuoteVisibility = () => {
      const shouldShow = shouldShowQuote(startTime);
      
      if (shouldShow && !isVisible) {
        // Start showing a new quote
        setQuote(getRandomQuote());
        setIsVisible(true);
        setIsAnimating(true);
      } else if (!shouldShow && isVisible) {
        // Start hide animation
        setIsAnimating(false);
        // Hide the quote after animation completes
        setTimeout(() => {
          setIsVisible(false);
        }, 300);
      }
    };

    // Check immediately
    checkQuoteVisibility();

    // Check every second
    const interval = setInterval(checkQuoteVisibility, 1000);

    return () => clearInterval(interval);
  }, [startTime, isVisible]);

  if (!isVisible || !quote) {
    return null;
  }

  return (
    <div 
      className={`
        text-sm text-muted-foreground 
        whitespace-nowrap overflow-hidden text-ellipsis
        transition-all duration-300 ease-in-out
        transform
        ${isAnimating 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-2 scale-95'
        }
        ${className}
      `}
    >
      {quote}
    </div>
  );
}
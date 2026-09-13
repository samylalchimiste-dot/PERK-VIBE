import React, { useRef, useCallback } from 'react';
import { hapticFeedback } from '../services/telegram/telegramService';
import { playClickSound } from '../services/audio/soundService';

/**
 * Hook to trigger a callback when an element is tapped N times within a time window
 */
export function useTapCounter(
  targetCount: number = 5,
  timeWindowMs: number = 3500,
  onTrigger: () => void
) {
  const tapHistoryRef = useRef<number[]>([]);

  const handleTap = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Record tap timestamp
    const now = Date.now();
    
    // Filter taps older than timeWindowMs
    const recentTaps = tapHistoryRef.current.filter((time) => now - time < timeWindowMs);
    recentTaps.push(now);
    tapHistoryRef.current = recentTaps;

    if (recentTaps.length >= targetCount) {
      // Trigger secret action
      tapHistoryRef.current = [];
      hapticFeedback('heavy');
      playClickSound();
      onTrigger();
    } else {
      // Subtle tap feedback
      hapticFeedback('light');
    }
  }, [targetCount, timeWindowMs, onTrigger]);

  return { handleTap };
}

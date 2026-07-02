import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal distance in px to trigger a swipe. Default: 50 */
  threshold?: number;
  /** Maximum vertical drift in px before the gesture is ignored. Default: 80 */
  verticalThreshold?: number;
}

/**
 * Returns touch event handlers that detect horizontal swipe gestures.
 * Attach `onTouchStart` and `onTouchEnd` to any element you want to make swipeable.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  verticalThreshold = 80,
}: UseSwipeOptions): SwipeHandlers {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      // Ignore if vertical movement is too large (user is scrolling)
      if (Math.abs(dy) > verticalThreshold) return;

      if (dx < -threshold) {
        onSwipeLeft?.();
      } else if (dx > threshold) {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, verticalThreshold]
  );

  return { onTouchStart, onTouchEnd };
}

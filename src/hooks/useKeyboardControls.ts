import { useCallback, useEffect } from "react";

type Direction = "up" | "down" | "left" | "right";

interface KeyboardControlsOptions {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  enabled?: boolean;
}

const keyToDirectionMap: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const useKeyboardControls = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  enabled = true,
}: KeyboardControlsOptions) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const direction = keyToDirectionMap[e.key];
      if (!direction) return;

      // Prevent default behavior for arrow keys (e.g., scrolling)
      e.preventDefault();

      switch (direction) {
        case "up":
          onUp?.();
          break;
        case "down":
          onDown?.();
          break;
        case "left":
          onLeft?.();
          break;
        case "right":
          onRight?.();
          break;
      }
    },
    [onUp, onDown, onLeft, onRight, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    keyToDirectionMap,
  };
};

export default useKeyboardControls;

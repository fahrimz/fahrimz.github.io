import { useCallback, useMemo, useState } from "react";
import useScreenWidth from "../hooks/screenWidth";
import ArrowControls from "./ArrowControls";

type Direction = "up" | "down" | "left" | "right";

const BOARD_SIZE = 4; // 4x4 grid. If you change this, adjust the grid-cols below accordingly.

const Board = () => {
  const screenWidth = useScreenWidth();
  const [coord, setCoord] = useState({ x: 0, y: 0 });

  const CELL_SIZE = useMemo(
    () => (screenWidth * 0.8) / BOARD_SIZE,
    [screenWidth]
  );

  const computedPosition = useMemo(() => {
    return {
      top: CELL_SIZE * coord.y + (8  * (coord.y + 1)),
      left: CELL_SIZE * coord.x + (8 * (coord.x + 1)),
    };
  }, [coord, CELL_SIZE]);

  const initialCells = Array.from(
    { length: BOARD_SIZE * BOARD_SIZE },
    (_, index) => <Tile key={index} cellSize={CELL_SIZE} />
  );

  const move = useCallback((direction: Direction) => {
    setCoord((prev) => {
      switch (direction) {
        case "up":
          return { ...prev, y: prev.y > 0 ? prev.y - 1 : 0 };
        case "down":
          return { ...prev, y: prev.y < BOARD_SIZE - 1 ? prev.y + 1 : BOARD_SIZE - 1 };
        case "left":
          return { ...prev, x: prev.x > 0 ? prev.x - 1 : 0 };
        case "right":
          return { ...prev, x: prev.x < BOARD_SIZE - 1 ? prev.x + 1 : BOARD_SIZE - 1 };
        default:
          return prev;
      }
    });
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* board */}
      <div className="absolute">
        <div className="grid grid-cols-4 bg-blue-400 gap-2 border-8 border-blue-400 rounded">
          {initialCells}
        </div>

        <div
          className="absolute"
          style={{ top: computedPosition.top, left: computedPosition.left }}
        >
          <Tile value={2} cellSize={CELL_SIZE} color="#A1E3F9" />
        </div>

        <div className="mt-8">
          <ArrowControls
            onUp={() => move("up")}
            onDown={() => move("down")}
            onLeft={() => move("left")}
            onRight={() => move("right")}
          />
        </div>
      </div>
    </div>
  );
};

const Tile = ({ value, cellSize, color }: { value?: number; cellSize: number, color?: string }) => {
  return (
    <div
    style={{ width: cellSize, height: cellSize, backgroundColor: color || "#C4E1F6" }}
    className="rounded flex items-center justify-center text-2xl font-bold text-white"
    >
      {value !== undefined && <span>{value}</span>}
    </div>
  );
};

const Game2048 = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-100">
      <Board />
    </div>
  );
};

export default Game2048;

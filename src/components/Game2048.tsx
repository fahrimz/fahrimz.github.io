import { useCallback, useEffect, useMemo, useState } from "react";
import useScreenWidth from "../hooks/useScreenWidth";
import useKeyboardControls from "../hooks/useKeyboardControls";
import ArrowControls from "./ArrowControls";

type Direction = "up" | "down" | "left" | "right";
type MoveStatus = "moved" | "merged" | "stay";
type Coord = {
  id: string;
  x: number;
  y: number;
  value: number;
  status: MoveStatus;
};

const BOARD_SIZE = 4; // 4x4 grid. If you change this, adjust the grid-cols below accordingly.
const LOWEST_TILE_VALUE = 2; // The lowest value for a tile in the game
const HIGHEST_TILE_VALUE = 2048; // The highest value for a tile in the game

const getColor = (value: number): string => {
  switch (value) {
    case LOWEST_TILE_VALUE:
      return "#A1E3F9"; // Light blue
    case 4:
      return "#A1E3F9"; // Blue
    case 8:
      return "#7DD3FC"; // Darker blue
    case 16:
      return "#38BDF8"; // Even darker blue
    case 32:
      return "#0EA5E9"; // Dark blue
    case 64:
      return "#0284C7"; // Deep blue
    case 128:
      return "#0369A1"; // Darker deep blue
    case 256:
      return "#075985"; // Very dark blue
    case 512:
      return "#0C4A6E"; // Almost black blue
    case 1024:
      return "#1E40AF"; // Blackish blue
    case HIGHEST_TILE_VALUE:
      return "#1D4ED8"; // Deepest blue for the highest tile value
    default:
      return "#C4E1F6"; // Default color for unknown values
  }
};

const Board = () => {
  const screenWidth = useScreenWidth();
  const [coords, setCoords] = useState<Coord[]>([]);

  const CELL_SIZE = useMemo(
    () => (screenWidth * 0.8) / BOARD_SIZE,
    [screenWidth]
  );

  const computedPositions = useMemo(() => {
    return coords.map((coord) => ({
      id: coord.id,
      value: coord.value,
      top: CELL_SIZE * coord.y + 8 * (coord.y + 1),
      left: CELL_SIZE * coord.x + 8 * (coord.x + 1),
    }));
  }, [coords, CELL_SIZE]);

  const initialCells = Array.from(
    { length: BOARD_SIZE * BOARD_SIZE },
    (_, index) => <Tile key={index} cellSize={CELL_SIZE} />
  );

  useEffect(() => {
    initialize();
    // mockInitialize();
  }, []);

  useEffect(() => {
    console.log(
      JSON.stringify(
        coords.map(
          (coord) => `${coord.id} => ${coord.value} at [${coord.x}, ${coord.y}]`
        ),
        null,
        2
      )
    );
  }, [coords]);

  const initialize = () => {
    const availableCoords = getAvailableCoords([]);
    const newCoord = createNewCoord(availableCoords)!;
    setCoords([newCoord]);
  };

  const mockInitialize = () => {
    setCoords([
      { id: generateCoordId(), x: 0, y: 0, value: 4, status: "moved" },
      { id: generateCoordId(), x: 1, y: 0, value: 2, status: "moved" },
      { id: generateCoordId(), x: 2, y: 0, value: 2, status: "moved" },
      { id: generateCoordId(), x: 3, y: 0, value: 2, status: "moved" },
      { id: generateCoordId(), x: 0, y: 1, value: 2, status: "moved" },
      { id: generateCoordId(), x: 1, y: 1, value: 2, status: "moved" },
      { id: generateCoordId(), x: 3, y: 1, value: 2, status: "moved" },
      { id: generateCoordId(), x: 1, y: 2, value: 8, status: "moved" },
      { id: generateCoordId(), x: 3, y: 2, value: 8, status: "moved" },
    ]);
  };

  const getAvailableCoords = (coords: Coord[]) => {
    const occupiedCoords = coords.map((coord) => `${coord.x},${coord.y}`);
    const availableCoords: Coord[] = [];

    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (!occupiedCoords.includes(`${x},${y}`)) {
          availableCoords.push({
            x,
            y,
            id: generateCoordId(),
            value: 2,
            status: "moved",
          });
        }
      }
    }

    return availableCoords;
  };

  const generateCoordId = () => {
    const newId = `coord_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    if (coords.some((coord) => coord.id === newId)) {
      return generateCoordId(); // Ensure unique ID
    }
    return newId;
  };

  const createNewCoord = (availableCoords: Coord[]) => {
    if (availableCoords.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableCoords.length);
    const newCoord = availableCoords[randomIndex];

    return newCoord;
  };

  const getNewCoord = (coord: Coord, direction: Direction): Coord | null => {
    const isVertical = ["up", "down"].includes(direction);
    const accumulator = ["up", "left"].includes(direction) ? -1 : 1;
    const field = isVertical ? "y" : "x";
    let nextCoord = { ...coord };
    const newValue = coord[field] + accumulator;
    if (newValue >= 0 && newValue < BOARD_SIZE) {
      nextCoord[field] = newValue;
      return nextCoord;
    }
    return null;
  };

  const tileCanMove = (coord: Coord, direction: Direction): boolean => {
    const newCoord = getNewCoord(coord, direction);
    return Boolean(newCoord);
  };

  const moveCoord = (
    coord: Coord,
    coords: Coord[],
    direction: Direction
  ): Coord => {
    const newCoordCandidate = getNewCoord(coord, direction);
    if (!newCoordCandidate) {
      return { ...coord, status: "stay" }; // No movement possible
    }

    // check for collision
    const collidedCoord = coords.find(
      (c) =>
        c.x === newCoordCandidate.x &&
        c.y === newCoordCandidate.y &&
        c.id !== coord.id
    );

    if (!collidedCoord) {
      return { ...newCoordCandidate, status: "moved" }; // No collision, move to new position
    }

    if (
      collidedCoord.status === "stay" &&
      collidedCoord.value !== coord.value
    ) {
      return { ...coord, status: "stay" }; // Cannot move, occupied by a different value
    }

    if (collidedCoord.status === "merged") {
      return { ...coord, status: "stay" }; // Cannot move, occupied by a merged tile
    }

    // If there's a collision, merge the tiles if they have the same value
    if (collidedCoord.value === coord.value) {
      // Merge the tiles by increasing the value and removing the old tile
      const mergedCoord = {
        ...collidedCoord,
        value: coord.value * 2,
      };
      return { ...mergedCoord, status: "merged" };
    }

    // If the collided tile has a different value, we cannot merge
    return { ...coord, status: "stay" };
  };

  const onMove = useCallback(
    (direction: Direction) => {
      // TODO:
      // change from moving per-tile to sliding until boundary or collision

      // group coordinates by direction first, then move each group
      const isVertical = direction === "up" || direction === "down";
      const groupedCoords = coords.reduce((acc, coord) => {
        const groupKey = isVertical ? coord.x : coord.y; // it's grouped by either x or y depending on the direction
        acc[groupKey] = acc[groupKey] || [];
        acc[groupKey].push(coord);

        acc[groupKey] = acc[groupKey].toSorted((a, b) => {
          if (isVertical) {
            return direction === "up" ? a.y - b.y : b.y - a.y; // sort by y for vertical movement
          } else {
            return direction === "left" ? a.x - b.x : b.x - a.x; // sort by x for horizontal movement
          }
        });

        return acc;
      }, {} as Record<string, Coord[]>);

      const movedCoords: Coord[] = [];
      Object.entries(groupedCoords).forEach(([key, group]) => {
        const newGroup: Coord[] = [];
        group.forEach((coord, idx) => {
          const newCoordCandidate = moveCoord(coord, newGroup, direction);
          switch (newCoordCandidate.status) {
            case "merged":
              const existingCoord = newGroup.find(
                (c) =>
                  c.x === newCoordCandidate.x && c.y === newCoordCandidate.y
              );
              if (existingCoord) {
                existingCoord.value = newCoordCandidate.value; // Merge the values
                existingCoord.status = "merged"; // Update status to merged
              }
              break;
            default:
              newGroup.push(newCoordCandidate);
          }
        });
        movedCoords.push(...newGroup);
      });

      // create new tile at random coordinate
      const availableCoords = getAvailableCoords(movedCoords);
      const newCoord = createNewCoord(availableCoords);

      setCoords(newCoord ? [...movedCoords, newCoord] : movedCoords);
    },
    [coords]
  );

  // Add keyboard controls
  useKeyboardControls({
    onUp: () => onMove("up"),
    onDown: () => onMove("down"),
    onLeft: () => onMove("left"),
    onRight: () => onMove("right"),
    enabled: true,
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* board */}
      <div className="absolute">
        <div className="grid grid-cols-4 bg-blue-400 gap-2 border-8 border-blue-400 rounded">
          {initialCells}
        </div>

        {computedPositions.map((computedPosition, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{ top: computedPosition.top, left: computedPosition.left }}
          >
            <Tile
              value={computedPosition.value}
              cellSize={CELL_SIZE}
              color={getColor(computedPosition.value)}
            />
          </div>
        ))}

        <div className="mt-8">
          <ArrowControls
            onUp={() => onMove("up")}
            onDown={() => onMove("down")}
            onLeft={() => onMove("left")}
            onRight={() => onMove("right")}
          />
        </div>
      </div>
    </div>
  );
};

const Tile = ({
  value,
  cellSize,
  color,
}: {
  value?: number;
  cellSize: number;
  color?: string;
}) => {
  return (
    <div
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: color || "#C4E1F6",
      }}
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

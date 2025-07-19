import { useCallback, useEffect, useMemo, useState } from "react";
import useScreenWidth from "../hooks/useScreenWidth";
import useKeyboardControls from "../hooks/useKeyboardControls";
import ArrowControls from "./ArrowControls";
import { AnimatePresence, motion } from "motion/react";
import ConfirmRestart from "./ConfirmRestart";

type Direction = "up" | "down" | "left" | "right";
type MoveStatus = "moved" | "merged" | "stay";
type Coord = {
  id: string;
  x: number;
  y: number;
  value: number;
  status: MoveStatus;
};

const isDev = import.meta.env.DEV;
const BOARD_SIZE = 4; // 4x4 grid. If you change this, adjust the grid-cols below accordingly.

const Board = ({
  coords,
  setCoords,
  console,
  colorArray,
}: {
  coords: Coord[];
  setCoords: React.Dispatch<React.SetStateAction<Coord[]>>;
  console: { log: (message: string) => void };
  colorArray: string[];
}) => {
  const tileBaseColor = colorArray[0];
  const tileColors = colorArray.slice(1);

  const screenWidth = useScreenWidth();
  const [isGameOver, setIsGameOver] = useState(false);

  const highestTile = useMemo(
    () => Math.max(...coords.map((coord) => coord.value)),
    [coords]
  );

  const tileColorMap: Record<number, string> = tileColors
    .map((color, index) => ({
      [Math.pow(2, index + 1)]: color, // 2, 4, 8, ..., 2048
    }))
    .reduce((acc, cur) => ({ ...acc, ...cur }), {});

  const CELL_SIZE = useMemo(
    () => (screenWidth * 0.6) / BOARD_SIZE,
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

  useEffect(() => {
    if (isDev) {
      mockInitialize();
    } else {
      initialize();
    }
  }, []);

  useEffect(() => {
    console.log(
      JSON.stringify(
        coords.map(
          (coord) =>
            `${coord.id} => ${coord.value} at [${coord.x}, ${coord.y}] (${coord.status})`
        ),
        null,
        2
      )
    );

    if (coords.length < BOARD_SIZE * BOARD_SIZE) {
      return;
    }

    // Check if any tile can move
    const nonStayCoords = coords.filter((coord) => coord.status !== "stay");
    const directions: Direction[] = ["up", "down", "left", "right"];
    const canMove = nonStayCoords.some((coord) => {
      return directions.some((direction) => {
        const newCoordCandidate = moveCoord(coord, coords, direction);
        return (
          newCoordCandidate.status !== "stay" &&
          !isCoordsEqual(coords, [...nonStayCoords, newCoordCandidate])
        );
      });
    });

    if (!canMove) {
      setTimeout(() => setIsGameOver(true), 300);
    }
  }, [coords]);

  const initialize = () => {
    const availableCoords = getAvailableCoords([]);
    const newCoord = createNewCoord(availableCoords)!;
    setCoords([newCoord]);
  };

  const mockInitialize = () => {
    // const array = [
    //   { x: 0, y: 0, value: 2 },
    //   { x: 1, y: 0, value: 2 },
    //   { x: 2, y: 0, value: 2 },
    //   { x: 3, y: 0, value: 2 },
    //   { x: 0, y: 1, value: 2 },
    //   { x: 1, y: 1, value: 2 },
    //   { x: 3, y: 1, value: 2 },
    //   { x: 1, y: 2, value: 8 },
    //   { x: 3, y: 2, value: 8 },
    // ];

    // const array = [
    //   { x: 0, y: 3, value: 8 },
    //   { x: 0, y: 2, value: 4 },
    //   { x: 0, y: 1, value: 2 },
    //   { x: 0, y: 0, value: 4 },
    //   { x: 1, y: 3, value: 32 },
    //   { x: 1, y: 2, value: 8 },
    //   { x: 1, y: 1, value: 256 },
    //   { x: 1, y: 0, value: 2 },
    //   { x: 2, y: 3, value: 8 },
    //   { x: 2, y: 2, value: 16 },
    //   { x: 2, y: 1, value: 32 },
    //   { x: 2, y: 0, value: 256 },
    //   { x: 3, y: 3, value: 2 },
    //   { x: 3, y: 2, value: 8 },
    //   { x: 3, y: 1, value: 4 },
    // ];

    const array = [
      {x: 0, y: 0, value: 2, id: 'a'},
      {x: 3, y: 0, value: 2, id: 'b'},
    ]

    setCoords(
      array.map((coord) => ({
        ...coord,
        id: coord.id || generateCoordId(),
        status: "stay",
      }))
    );
  };

  const isCoordsEqual = (a: Coord[], b: Coord[]) => {
    if (a.length !== b.length) return false;
    return a.every((coord) => {
      const otherCoord = b.find((c) => c.id === coord.id);
      if (!otherCoord) return false;

      const isSame =
        coord.x === otherCoord.x &&
        coord.y === otherCoord.y &&
        coord.value === otherCoord.value &&
        coord.status === otherCoord.status;

      return isSame;
    });
  };

  const getAvailableCoords = (coords: Coord[]) => {
    const occupiedCoords = coords.map((coord) => `${coord.x},${coord.y}`);
    const availableCoords: Coord[] = [];

    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (!occupiedCoords.includes(`${x},${y}`)) {
          const id = generateCoordId();
          availableCoords.push({
            x,
            y,
            id,
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
      return moveCoord(newCoordCandidate, coords, direction); // Recursively move until no collision
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
        ...newCoordCandidate,
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
      // [done] change from moving per-tile to sliding until boundary or collision
      // when there's [2, 2, 2, 2] and move left, it should become [4, 2, 2, 0]

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
                existingCoord.id = newCoordCandidate.id; // Update ID to the new one
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

      // move the tiles to the new positions
      setCoords(movedCoords);

      // create new tile at random coordinate after a few milliseconds
      const availableCoords = getAvailableCoords(movedCoords);
      const newCoord = createNewCoord(availableCoords);

      setTimeout(() => {
        if (!newCoord) return;
        const newCoords = [...movedCoords, newCoord];
        setCoords(newCoords);
      }, 215);
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
      <div className="absolute flex flex-col items-center justify-center">
        <div className="flex flex-row w-full">
          <div
            className="flex flex-row text-2xl font-bold mb-4 gap-2"
            style={{ color: tileColorMap[highestTile] || tileBaseColor }}
          >
            <span>Highest Tile: </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={highestTile}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
              >
                {highestTile}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div
          className="relative rounded"
          style={{
            width: BOARD_SIZE * (CELL_SIZE + 8) + 8,
            height: BOARD_SIZE * (CELL_SIZE + 8) + 8,
            backgroundColor: tileBaseColor,
          }}
        >
          {computedPositions.map((computedPosition, idx) => (
            <motion.div
              key={computedPosition.id}
              className="absolute"
              style={{
                top: 0,
                left: 0,
              }}
              initial={{
                x: computedPosition.left,
                y: computedPosition.top,
                scale: 0.5,
              }}
              animate={{
                scale: 1,
                x: computedPosition.left,
                y: computedPosition.top,
              }}
              transition={{
                type: "spring",
                bounce: 0.1,
                duration: 0.6,
              }}
            >
              <Tile
                value={computedPosition.value}
                cellSize={CELL_SIZE}
                color={tileColorMap[computedPosition.value] || tileBaseColor}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <ArrowControls
            onUp={() => onMove("up")}
            onDown={() => onMove("down")}
            onLeft={() => onMove("left")}
            onRight={() => onMove("right")}
          />
        </div>
      </div>

      {isGameOver && (
        <ConfirmRestart
          score={highestTile}
          onRestart={() => {
            setIsGameOver(false);
            initialize();
          }}
          onCancel={() => setIsGameOver(false)}
        />
      )}
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
  color: string;
}) => {
  return (
    <div
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: color,
      }}
      className="rounded flex items-center justify-center sm:text-2xl font-bold text-white"
    >
      {value !== undefined && <span>{value}</span>}
    </div>
  );
};

const Game2048 = () => {
  const [prevCoords, setPrevCoords] = useState<Coord[]>([]);
  const [coords, setCoords] = useState<Coord[]>([]);

  const colorArrayGreen = [
    "var(--color-green-950)",
    "#8CD090",
    "#85C689",
    "#7EBB82",
    "#77B17B",
    "#70A774",
    "#699D6E",
    "#619267",
    "#5A8860",
    "#537E59",
    "#4C7452",
    "#45694B",
    "#3E5F44",
  ];

  const colorArrayRed = [
    "var(--color-red-950)",
    "#EEE2DF",
    "#E8D3D1",
    "#E1C5C2",
    "#DBB6B3",
    "#D4A8A5",
    "#CE9996",
    "#C78B87",
    "#C07C79",
    "#BA6E6A",
    "#B35F5B",
    "#AD514D",
    "#A6423E",
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center h-screen">
      {/* previous board state */}
      {/* {isDev && (
        <Board
          coords={prevCoords}
          setCoords={() => undefined}
          console={{ log: () => undefined }}
          colorArray={colorArrayRed}
        />
      )} */}

      {/* the real board currently being played */}
      <Board
        coords={coords}
        setCoords={(newCoords) => {
          setPrevCoords(coords); // Save current state as previous
          setCoords(newCoords);
        }}
        console={isDev ? console : { log: () => undefined }}
        colorArray={colorArrayGreen}
      />
    </div>
  );
};

export default Game2048;

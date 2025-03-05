import clsx from "clsx";
import { useEffect, useState } from "react";

type Coord = [number, number];
type Direction = "up" | "down" | "left" | "right";

export default function SnakeGame() {
  const BOARD_SIZE = 15; // board size, 15x15
  const CELL_SIZE = 40;

  const CENTER_COORD: Coord = [0, 0];
  const INITIAL_SNAKE_COORDS: Coord[] = [CENTER_COORD, [-1, 0]];
  const INITIAL_FOOD_COORD: Coord = [5, 5];

  const TOP_LEFT_COORD: Coord = [
    -Math.floor(BOARD_SIZE / 2),
    -Math.floor(BOARD_SIZE / 2),
  ];
  const TOP_RIGHT_COORD: Coord = [
    Math.floor(BOARD_SIZE / 2),
    -Math.floor(BOARD_SIZE / 2),
  ];
  const BOTTOM_LEFT_COORD: Coord = [
    -Math.floor(BOARD_SIZE / 2),
    Math.floor(BOARD_SIZE / 2),
  ];
  const BOTTOM_RIGHT_CORD: Coord = [
    Math.floor(BOARD_SIZE / 2),
    Math.floor(BOARD_SIZE / 2),
  ];
  const MIN_VALUE: number = TOP_LEFT_COORD[0]; // minimum value for x and y coord. If BOARD_SIZE is 15, then -7
  const MAX_VALUE: number = BOTTOM_RIGHT_CORD[0]; // maximum value for x and y coord. If BOARD_SIZE is 15, then 7

  const [foodPosition, setFoodPosition] = useState<Coord>(INITIAL_FOOD_COORD);
  const [snakeCoords, setSnakeCoords] = useState<Coord[]>(INITIAL_SNAKE_COORDS);
  const snakeHeadCoord = snakeCoords[0];
  const [lastDirection, setLastDirection] = useState<Direction>("right");

  const setSnakePosition = (newCoord: Coord) => {
    setSnakeCoords((prev) => {
      const newSnake = [...prev];
      newSnake.unshift(newCoord);
      newSnake.pop();
      return newSnake;
    });
  };

  const generateSpawnCoord = (): Coord => {
    // Generate random coordinates within the bounds of minValue and maxValue
    const x =
      Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;
    const y =
      Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;

    // if x and y is the same as the snake position, generate new coord
    if (x === snakeHeadCoord[0] && y === snakeHeadCoord[1]) {
      return generateSpawnCoord();
    }

    // if x and y is out of bound, generate new coord
    if (x < MIN_VALUE || x > MAX_VALUE || y < MIN_VALUE || y >= MAX_VALUE) {
      return generateSpawnCoord();
    }

    return [x, y];
  };

  const spawnFood = () => {
    setFoodPosition(generateSpawnCoord());
  };

  const calculateNewSnakeCoords = (
    coords: Coord[],
    direction: Direction
  ): Coord[] => {
    const newCoords = [...coords];
    const head = newCoords[0];
    let newHead: Coord = [0, 0];

    switch (direction) {
      case "up":
        newHead = [head[0], head[1] - 1];
        break;
      case "down":
        newHead = [head[0], head[1] + 1];
        break;
      case "left":
        newHead = [head[0] - 1, head[1]];
        break;
      case "right":
        newHead = [head[0] + 1, head[1]];
        break;
    }

    newCoords.unshift(newHead);
    newCoords.pop();

    return newCoords;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let headCoord = snakeHeadCoord;
      let newCoords: Coord[] = [...snakeCoords];
      let tailCoord = newCoords[newCoords.length - 1];

      switch (e.key) {
        case "ArrowUp":
          if (lastDirection === "down") return;

          // if current position is already at top, do nothing
          if (headCoord[1] === MIN_VALUE) return;

          newCoords = calculateNewSnakeCoords(newCoords, "up");
          setLastDirection("up");
          break;
        case "ArrowDown":
          if (lastDirection === "up") return;

          // if current position is already at bottom, do nothing
          if (headCoord[1] === MAX_VALUE) return;

          newCoords = calculateNewSnakeCoords(newCoords, "down");
          setLastDirection("down");
          break;
        case "ArrowLeft":
          if (lastDirection === "right") return;

          // if current position is already at most left, do nothing
          if (headCoord[0] === MIN_VALUE) return;

          newCoords = calculateNewSnakeCoords(newCoords, "left");
          setLastDirection("left");
          break;
        case "ArrowRight":
          if (lastDirection === "left") return;

          // if current position is already at most right, do nothing
          if (headCoord[0] === MAX_VALUE) return;

          newCoords = calculateNewSnakeCoords(newCoords, "right");
          setLastDirection("right");
          break;
      }

      setSnakeCoords(newCoords);

      // if snake head is on the food, spawn new food and increase snake length
      headCoord = newCoords[0];
      if (
        headCoord[0] === foodPosition[0] &&
        headCoord[1] === foodPosition[1]
      ) {
        setSnakeCoords([...newCoords, tailCoord]);
        spawnFood();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setSnakePosition, snakeHeadCoord]);

  // spawn food for first time
  useEffect(() => {
    spawnFood();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen gap-4">
      {/* score */}
      <div className="bg-white p-2 rounded-lg shadow-md">
        <p className="text-lg font-semibold">
          Score: {snakeCoords.length - INITIAL_SNAKE_COORDS.length}
        </p>
      </div>
      <div className="flex justify-center items-center">
        {/* board */}
        {Array.from({ length: BOARD_SIZE }).map((_, i) => (
          <div key={i}>
            {Array.from({ length: BOARD_SIZE }).map((_, j) => (
              <div
                key={j}
                className={clsx(
                  "flex justify-center items-center",
                  (j + BOARD_SIZE * i) % 2 === 0 ? "bg-blue-300" : "bg-blue-200"
                )}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
              />
            ))}
          </div>
        ))}

        {/* food */}
        <div className="absolute">
          <div
            className="bg-red-500"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              transform: `translate(${CELL_SIZE * foodPosition[0]}px, ${
                CELL_SIZE * foodPosition[1]
              }px)`,
            }}
          />
        </div>

        {/* snake */}
        {snakeCoords.map((coord, index) => (
          <div
            key={index}
            className="bg-green-500 absolute flex justify-center items-center"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              transform: `translate(${CELL_SIZE * coord[0]}px, ${
                CELL_SIZE * coord[1]
              }px)`,
              zIndex: index === 0 ? 10 : 0,
            }}
          >
            {index === 0 ? (
              <div className="flex gap-2 flex-col justify-center items-center">
                <div className="flex gap-2">
                  <div
                    style={{ width: CELL_SIZE / 4, height: CELL_SIZE / 4 }}
                    className="bg-black"
                  />
                  <div
                    style={{ width: CELL_SIZE / 4, height: CELL_SIZE / 4 }}
                    className="bg-black"
                  />
                </div>
                <div
                  style={{ width: CELL_SIZE / 2, height: CELL_SIZE / 8 }}
                  className="bg-red-300"
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

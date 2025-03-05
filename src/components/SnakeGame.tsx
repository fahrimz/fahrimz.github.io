import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

type Coord = [number, number];
type Direction = "up" | "down" | "left" | "right";

const directionToDegreeMap: Record<Direction, number> = {
  right: 270,
  left: 90,
  up: 180,
  down: 360,
};

const keyToDirectionMap: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function StartGameDialog({ onStart }: { onStart: () => void }) {
  return (
    <motion.div className="absolute bg-white z-50" key="modal" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col justify-center items-center gap-4 w-xl h-fit p-8">
        <h1 className="text-2xl font-semibold">Start Game?</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer"
          onClick={onStart}
        >
          Start
        </button>
      </div>
    </motion.div>
  );
}

function ConfirmRestart({
  score,
  onRestart,
  onCancel,
}: {
  score: number;
  onRestart: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div className="absolute bg-white z-50" key="modal" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col justify-center items-center gap-4 w-xl h-fit p-8">
        <h1 className="text-2xl font-semibold">Game Over!</h1>
        <p className="text-lg">Your score is {score}. Restart?</p>
        <div className="flex flex-row gap-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer"
            onClick={onCancel}
          >
            No
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer"
            onClick={onRestart}
          >
            Yes
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SnakeGame() {
  const BOARD_SIZE = 15; // board size, 15x15
  const CELL_SIZE = 40;
  const MOVEMENT_SPEED = 150; // movement speed in ms

  const CENTER_COORD: Coord = [0, 0];
  const INITIAL_SNAKE_COORDS: Coord[] = [CENTER_COORD, [-1, 0]];
  const INITIAL_FOOD_COORD: Coord = [0, 0];

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
  const score = snakeCoords.length - INITIAL_SNAKE_COORDS.length;
  const snakeHeadCoord = snakeCoords[0];
  const [lastDirection, setLastDirection] = useState<Direction>("right");

  const movementInterval = useRef<NodeJS.Timer | null>(null);

  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">();
  const showConfirmRestart = useMemo(
    () => gameState === "gameover",
    [gameState]
  );
  const showStartGame = useMemo(() => gameState === "idle", [gameState]);
  const isPlaying = useMemo(() => gameState === "playing", [gameState]);

  const generateSpawnCoord = (): Coord => {
    // Generate random coordinates within the bounds of minValue and maxValue
    const x =
      Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;
    const y =
      Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;

    // if x and y is part of the snake coordinates, generate new coord
    if (snakeCoords.some(([snakeX, snakeY]) => snakeX === x && snakeY === y)) {
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

  const calculateNextSnakeCoord = (
    coord: Coord,
    direction: Direction
  ): Coord => {
    let newCoord: Coord = [0, 0];
    switch (direction) {
      case "up":
        newCoord = [coord[0], coord[1] - 1];
        break;
      case "down":
        newCoord = [coord[0], coord[1] + 1];
        break;
      case "left":
        newCoord = [coord[0] - 1, coord[1]];
        break;
      case "right":
        newCoord = [coord[0] + 1, coord[1]];
        break;
    }
    return newCoord;
  };

  const calculateNewSnakeCoords = (
    coords: Coord[],
    direction: Direction
  ): Coord[] => {
    const newCoords = [...coords];
    const head = newCoords[0];
    const newHead = calculateNextSnakeCoord(head, direction);

    newCoords.unshift(newHead);
    newCoords.pop();

    return newCoords;
  };

  const resetGame = () => {
    setSnakeCoords(INITIAL_SNAKE_COORDS);
    setLastDirection("right");
  };

  const gameOver = () => {
    setGameState("gameover");
  };

  const moveSnake = useCallback(
    (newDirection: Direction) => {
      if (!isPlaying) return;

      let headCoord = snakeHeadCoord;
      const tailCoord = snakeCoords[snakeCoords.length - 1];

      switch (newDirection) {
        case "up":
          if (lastDirection === "down") return;
          if (headCoord[1] === MIN_VALUE) {
            gameOver();
            return;
          }
          break;
        case "down":
          if (lastDirection === "up") return;
          if (headCoord[1] === MAX_VALUE) {
            gameOver();
            return;
          }
          break;
        case "left":
          if (lastDirection === "right") return;
          if (headCoord[0] === MIN_VALUE) {
            gameOver();
            return;
          }
          break;
        case "right":
          if (lastDirection === "left") return;
          if (headCoord[0] === MAX_VALUE) {
            gameOver();
            return;
          }
          break;
      }

      // if next snake head is on the body, game over
      const nextHeadCoord = calculateNextSnakeCoord(headCoord, newDirection);
      console.log("nextHeadCoord", nextHeadCoord);
      if (
        snakeCoords
          .slice(1)
          .some(
            ([snakeX, snakeY]) =>
              snakeX === nextHeadCoord[0] && snakeY === nextHeadCoord[1]
          )
      ) {
        gameOver();
        return;
      }

      const newCoords = calculateNewSnakeCoords(snakeCoords, newDirection);

      setSnakeCoords(newCoords);
      setLastDirection(newDirection);

      // if snake head is on the food, spawn new food and increase snake length
      headCoord = newCoords[0];
      if (
        headCoord[0] === foodPosition[0] &&
        headCoord[1] === foodPosition[1]
      ) {
        setSnakeCoords([...newCoords, tailCoord]);
        spawnFood();
      }
    },
    [snakeCoords, snakeHeadCoord, lastDirection, foodPosition, isPlaying]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying) return;

      const direction = keyToDirectionMap[e.key];
      if (!direction) return;
      if (direction === lastDirection) return;
      moveSnake(direction);
    },
    [lastDirection, moveSnake, isPlaying]
  );

  const startGame = () => {
    resetGame();
    spawnFood();
    setGameState("playing");
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [snakeHeadCoord, handleKeyDown]);

  useEffect(() => {
    movementInterval.current = setInterval(
      () => moveSnake(lastDirection),
      MOVEMENT_SPEED
    );

    return () => {
      clearInterval(movementInterval.current!);
    };
  }, [moveSnake, lastDirection]);

  useEffect(() => {
    setGameState("idle");
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen gap-4">
      {/* score */}
      <div className="bg-white p-2 rounded-lg shadow-md">
        <p className="text-lg font-semibold">Score: {score}</p>
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
                  (j + BOARD_SIZE * i) % 2 === 0 ? "bg-blue-100" : "bg-blue-50"
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
            className={clsx(
              "absolute flex justify-center items-center bg-green-400",
              index === 0 && "bg-green-500",
              index === snakeCoords.length - 1 && "bg-green-100"
            )}
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
              <div
                className="flex gap-2 flex-col justify-center items-center"
                style={{
                  rotate: `${directionToDegreeMap[lastDirection]}deg`,
                }}
              >
                <div className="flex gap-2">
                  <div
                    style={{ width: CELL_SIZE / 4, height: CELL_SIZE / 4 }}
                    className="bg-white"
                  />
                  <div
                    style={{ width: CELL_SIZE / 4, height: CELL_SIZE / 4 }}
                    className="bg-white"
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
      {showStartGame && <StartGameDialog onStart={startGame} />}
      {showConfirmRestart && (
        <ConfirmRestart
          onCancel={() => {
            resetGame;
            setGameState("idle");
            clearInterval(movementInterval.current!);
            movementInterval.current = null;
          }}
          onRestart={() => {
            resetGame();
            setGameState("playing");
          }}
          score={score}
        />
      )}
    </div>
  );
}

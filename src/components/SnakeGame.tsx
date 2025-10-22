import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setGameStarted(true);
    setScore(0);
    setIsPaused(false);
  }, [generateFood]);

  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // 检查是否撞墙
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // 检查是否撞到自己
    return body.some((segment) => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      let newHead: Position;

      switch (directionRef.current) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // 检查碰撞
      if (checkCollision(newHead, prevSnake)) {
        setGameOver(true);
        setGameStarted(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // 检查是否吃到食物
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prev) => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, gameStarted, isPaused, food, checkCollision, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      const key = e.key;
      const currentDirection = directionRef.current;

      if (key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
        return;
      }

      let newDirection: Direction | null = null;

      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDirection !== 'DOWN') newDirection = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDirection !== 'UP') newDirection = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDirection !== 'RIGHT') newDirection = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDirection !== 'LEFT') newDirection = 'RIGHT';
          break;
      }

      if (newDirection) {
        e.preventDefault();
        directionRef.current = newDirection;
        setDirection(newDirection);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [gameStarted, gameOver, isPaused, moveSnake]);

  const isCellSnake = (x: number, y: number): boolean => {
    return snake.some((segment) => segment.x === x && segment.y === y);
  };

  const isCellSnakeHead = (x: number, y: number): boolean => {
    return snake[0].x === x && snake[0].y === y;
  };

  const isCellFood = (x: number, y: number): boolean => {
    return food.x === x && food.y === y;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent mb-2">
          贪吃蛇
        </h1>
        <p className="text-muted-foreground">使用方向键或 WASD 控制</p>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur">
        <div className="flex gap-8 items-center mb-4">
          <div className="text-xl font-semibold">
            得分: <span className="text-emerald-500">{score}</span>
          </div>
          {isPaused && gameStarted && (
            <div className="text-lg font-medium text-amber-500">已暂停</div>
          )}
        </div>

        <div
          className="relative bg-muted/30 rounded-lg p-2 border-2 border-border"
          style={{
            width: GRID_SIZE * CELL_SIZE + 16,
            height: GRID_SIZE * CELL_SIZE + 16,
          }}
        >
          {Array.from({ length: GRID_SIZE }).map((_, y) => (
            <div key={y} className="flex">
              {Array.from({ length: GRID_SIZE }).map((_, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`transition-colors duration-100
                    ${isCellSnakeHead(x, y) 
                      ? 'bg-emerald-500 rounded-sm shadow-lg shadow-emerald-500/50' 
                      : isCellSnake(x, y)
                      ? 'bg-emerald-400 rounded-sm'
                      : isCellFood(x, y)
                      ? 'bg-rose-500 rounded-full shadow-lg shadow-rose-500/50 animate-pulse'
                      : 'bg-transparent'
                    }`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                />
              ))}
            </div>
          ))}

          {gameOver && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-destructive">游戏结束!</h2>
                <p className="text-xl">最终得分: {score}</p>
              </div>
            </div>
          )}

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">准备开始</h2>
                <p className="text-muted-foreground">点击开始按钮开始游戏</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4 justify-center">
          {!gameStarted ? (
            <Button onClick={resetGame} size="lg" className="min-w-32">
              开始游戏
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="outline"
                size="lg"
                className="min-w-32"
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
              <Button onClick={resetGame} variant="outline" size="lg" className="min-w-32">
                重新开始
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>空格键: 暂停/继续</p>
        </div>
      </Card>
    </div>
  );
}

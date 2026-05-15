'use client';

import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';

interface SnaktocatGameProps {
  username: string;
  attemptNumber: number;
  maxAttempts: number;
  bestScore: number;
  onGameOver: (score: number) => void;
  onGameStart: () => void;
}

export interface SnaktocatGameRef {
  handleDirection: (dir: Direction) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'waiting' | 'playing' | 'dead';

interface Point { x: number; y: number; }

const GRID_SIZE = 20;
const CELL_SIZE = 13;
const CANVAS_W = GRID_SIZE * CELL_SIZE;
const CANVAS_H = GRID_SIZE * CELL_SIZE;

// Nokia green LCD colors
const LCD_BG = '#9bbc0f';
const LCD_DARK = '#0f380f';
const LCD_MID = '#306230';
const LCD_LIGHT = '#8bac0f';

function getSpeed(score: number): number {
  const base = 250;
  const reduction = Math.floor(score / 5) * 10;
  return Math.max(80, base - reduction);
}

const SnaktocatGame = forwardRef<SnaktocatGameRef, SnaktocatGameProps>(function SnaktocatGame({
  username,
  attemptNumber,
  maxAttempts,
  bestScore,
  onGameOver,
  onGameStart,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    snake: Point[];
    direction: Direction;
    nextDirection: Direction;
    food: Point;
    score: number;
    gameState: GameState;
    lastTick: number;
    touchStart: Point | null;
  }>({
    snake: [{ x: 10, y: 10 }],
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    food: { x: 15, y: 10 },
    score: 0,
    gameState: 'waiting',
    lastTick: 0,
    touchStart: null,
  });

  const animRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('waiting');

  const spawnFood = useCallback(() => {
    const s = stateRef.current;
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (s.snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    s.food = newFood;
  }, []);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    s.direction = 'RIGHT';
    s.nextDirection = 'RIGHT';
    s.score = 0;
    s.gameState = 'waiting';
    s.lastTick = 0;
    setDisplayScore(0);
    setGameState('waiting');
    spawnFood();
  }, [spawnFood]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'waiting') return;
    s.gameState = 'playing';
    s.lastTick = performance.now();
    setGameState('playing');
    onGameStart();
  }, [onGameStart]);

  const handleDirection = useCallback((dir: Direction) => {
    const s = stateRef.current;
    if (s.gameState === 'waiting') {
      startGame();
    }
    if (s.gameState !== 'playing') return;
    switch (dir) {
      case 'UP': if (s.direction !== 'DOWN') s.nextDirection = 'UP'; break;
      case 'DOWN': if (s.direction !== 'UP') s.nextDirection = 'DOWN'; break;
      case 'LEFT': if (s.direction !== 'RIGHT') s.nextDirection = 'LEFT'; break;
      case 'RIGHT': if (s.direction !== 'LEFT') s.nextDirection = 'RIGHT'; break;
    }
  }, [startGame]);

  useImperativeHandle(ref, () => ({ handleDirection }), [handleDirection]);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing') return;

    s.direction = s.nextDirection;
    const head = { ...s.snake[0] };
    switch (s.direction) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      s.gameState = 'dead';
      setGameState('dead');
      setTimeout(() => onGameOver(s.score), 500);
      return;
    }

    if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      s.gameState = 'dead';
      setGameState('dead');
      setTimeout(() => onGameOver(s.score), 500);
      return;
    }

    s.snake.unshift(head);

    if (head.x === s.food.x && head.y === s.food.y) {
      s.score++;
      setDisplayScore(s.score);
      spawnFood();
    } else {
      s.snake.pop();
    }
  }, [onGameOver, spawnFood]);

  // Game loop: Nokia LCD pixel style
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = (time: number) => {
      const s = stateRef.current;

      if (s.gameState === 'playing') {
        const speed = getSpeed(s.score);
        if (time - s.lastTick >= speed) {
          tick();
          s.lastTick = time;
        }
      }

      // Green LCD background
      ctx.fillStyle = LCD_BG;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw border (Nokia snake had walls)
      ctx.fillStyle = LCD_DARK;
      for (let i = 0; i < GRID_SIZE; i++) {
        // Top and bottom border
        ctx.fillRect(i * CELL_SIZE, 0, CELL_SIZE - 1, CELL_SIZE - 1);
        ctx.fillRect(i * CELL_SIZE, (GRID_SIZE - 1) * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
      }
      for (let i = 1; i < GRID_SIZE - 1; i++) {
        // Left and right border
        ctx.fillRect(0, i * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        ctx.fillRect((GRID_SIZE - 1) * CELL_SIZE, i * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
      }

      // Draw food as a small dark pixel block
      ctx.fillStyle = LCD_DARK;
      const fx = s.food.x * CELL_SIZE + 2;
      const fy = s.food.y * CELL_SIZE + 2;
      ctx.fillRect(fx, fy, CELL_SIZE - 5, CELL_SIZE - 5);
      // Small dot pattern for food
      ctx.fillRect(fx + 2, fy - 2, CELL_SIZE - 9, 2);
      ctx.fillRect(fx - 2, fy + 2, 2, CELL_SIZE - 9);

      // Draw snake: dark pixel blocks like original Nokia
      ctx.fillStyle = LCD_DARK;
      s.snake.forEach((seg, i) => {
        const x = seg.x * CELL_SIZE;
        const y = seg.y * CELL_SIZE;
        if (i === 0) {
          // Head: slightly larger looking block
          ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        } else {
          // Body: standard pixel block
          ctx.fillRect(x + 1, y + 1, CELL_SIZE - 3, CELL_SIZE - 3);
        }
      });

      // HUD: Score at top
      ctx.fillStyle = LCD_DARK;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Score:${s.score}`, CELL_SIZE + 2, 2);
      ctx.textAlign = 'right';
      ctx.fillText(`Best:${bestScore}`, CANVAS_W - CELL_SIZE - 2, 2);

      // Waiting state overlay
      if (s.gameState === 'waiting') {
        ctx.fillStyle = LCD_BG;
        ctx.fillRect(CELL_SIZE * 3, CELL_SIZE * 6, CELL_SIZE * 14, CELL_SIZE * 8);
        ctx.fillStyle = LCD_DARK;
        ctx.strokeStyle = LCD_DARK;
        ctx.lineWidth = 2;
        ctx.strokeRect(CELL_SIZE * 3, CELL_SIZE * 6, CELL_SIZE * 14, CELL_SIZE * 8);

        ctx.fillStyle = LCD_DARK;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SNAKTOCAT', CANVAS_W / 2, CANVAS_H / 2 - 24);

        ctx.font = '9px monospace';
        ctx.fillText(`@${username}`, CANVAS_W / 2, CANVAS_H / 2 - 4);
        ctx.fillText(`Attempt ${attemptNumber}/${maxAttempts}`, CANVAS_W / 2, CANVAS_H / 2 + 12);

        ctx.font = 'bold 9px monospace';
        ctx.fillText('Press any direction', CANVAS_W / 2, CANVAS_H / 2 + 30);
      }

      // Dead state
      if (s.gameState === 'dead') {
        ctx.fillStyle = LCD_BG;
        ctx.fillRect(CELL_SIZE * 4, CELL_SIZE * 7, CELL_SIZE * 12, CELL_SIZE * 6);
        ctx.fillStyle = LCD_DARK;
        ctx.strokeStyle = LCD_DARK;
        ctx.lineWidth = 2;
        ctx.strokeRect(CELL_SIZE * 4, CELL_SIZE * 7, CELL_SIZE * 12, CELL_SIZE * 6);

        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 8);
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 14);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick, username, attemptNumber, maxAttempts, bestScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dir = e.key.replace('Arrow', '').toUpperCase() as Direction;
        handleDirection(dir);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleDirection]);

  // Touch swipe controls on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      const touch = e.touches[0];
      s.touchStart = { x: touch.clientX, y: touch.clientY };
      if (s.gameState === 'waiting') startGame();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (!s.touchStart || s.gameState !== 'playing') return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - s.touchStart.x;
      const dy = touch.clientY - s.touchStart.y;
      const minSwipe = 20;
      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        handleDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        handleDirection(dy > 0 ? 'DOWN' : 'UP');
      }
      s.touchStart = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startGame, handleDirection]);

  useEffect(() => { resetGame(); }, [resetGame]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="w-full h-full"
      style={{ touchAction: 'none', imageRendering: 'pixelated' }}
    />
  );
});

export default SnaktocatGame;

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface SnaktocatGameProps {
  username: string;
  attemptNumber: number;
  maxAttempts: number;
  bestScore: number;
  onGameOver: (score: number) => void;
  onGameStart: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'waiting' | 'playing' | 'dead';

interface Point { x: number; y: number; }

// Food types with emojis (GitHub + Bouygues mix)
const FOOD_TYPES = [
  { emoji: '🐙', name: 'octocat' },
  { emoji: '⭐', name: 'star' },
  { emoji: '✨', name: 'copilot' },
  { emoji: '📱', name: 'phone' },
  { emoji: '📡', name: 'signal' },
  { emoji: '💎', name: 'gem' },
];

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const CANVAS_W = GRID_SIZE * CELL_SIZE;
const CANVAS_H = GRID_SIZE * CELL_SIZE;

// Speed: starts at 150ms, decreases every 5 points
function getSpeed(score: number): number {
  const base = 150;
  const reduction = Math.floor(score / 5) * 10;
  return Math.max(60, base - reduction);
}

export default function SnaktocatGame({
  username,
  attemptNumber,
  maxAttempts,
  bestScore,
  onGameOver,
  onGameStart,
}: SnaktocatGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    snake: Point[];
    direction: Direction;
    nextDirection: Direction;
    food: Point;
    foodType: number;
    score: number;
    gameState: GameState;
    lastTick: number;
    touchStart: Point | null;
  }>({
    snake: [{ x: 10, y: 10 }],
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    food: { x: 15, y: 10 },
    foodType: 0,
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
    s.foodType = Math.floor(Math.random() * FOOD_TYPES.length);
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

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      s.gameState = 'dead';
      setGameState('dead');
      setTimeout(() => onGameOver(s.score), 500);
      return;
    }

    // Self collision
    if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      s.gameState = 'dead';
      setGameState('dead');
      setTimeout(() => onGameOver(s.score), 500);
      return;
    }

    s.snake.unshift(head);

    // Ate food?
    if (head.x === s.food.x && head.y === s.food.y) {
      s.score++;
      setDisplayScore(s.score);
      spawnFood();
    } else {
      s.snake.pop();
    }
  }, [onGameOver, spawnFood]);

  // Game loop
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

      // Clear
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines (subtle)
      ctx.strokeStyle = '#161b22';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CANVAS_W, y * CELL_SIZE);
        ctx.stroke();
      }

      // Draw food
      ctx.font = `${CELL_SIZE - 2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        FOOD_TYPES[s.foodType].emoji,
        s.food.x * CELL_SIZE + CELL_SIZE / 2,
        s.food.y * CELL_SIZE + CELL_SIZE / 2
      );

      // Draw snake body
      s.snake.forEach((seg, i) => {
        const x = seg.x * CELL_SIZE;
        const y = seg.y * CELL_SIZE;
        const pad = 1;

        if (i === 0) {
          // Head: Mona-colored (purple-ish)
          const gradient = ctx.createRadialGradient(
            x + CELL_SIZE / 2, y + CELL_SIZE / 2, 0,
            x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2
          );
          gradient.addColorStop(0, '#a371f7');
          gradient.addColorStop(1, '#8957e5');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 4);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          const eyeSize = 3;
          let eyeOffX1 = 0, eyeOffY1 = 0, eyeOffX2 = 0, eyeOffY2 = 0;
          switch (s.direction) {
            case 'RIGHT':
              eyeOffX1 = 7; eyeOffY1 = 3; eyeOffX2 = 7; eyeOffY2 = 9; break;
            case 'LEFT':
              eyeOffX1 = 5; eyeOffY1 = 3; eyeOffX2 = 5; eyeOffY2 = 9; break;
            case 'UP':
              eyeOffX1 = 3; eyeOffY1 = 5; eyeOffX2 = 9; eyeOffY2 = 5; break;
            case 'DOWN':
              eyeOffX1 = 3; eyeOffY1 = 7; eyeOffX2 = 9; eyeOffY2 = 7; break;
          }
          ctx.beginPath();
          ctx.arc(x + eyeOffX1, y + eyeOffY1, eyeSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + eyeOffX2, y + eyeOffY2, eyeSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Body segments: gradient from GitHub purple to darker
          const alpha = 1 - (i / (s.snake.length + 5)) * 0.6;
          ctx.fillStyle = `rgba(137, 87, 229, ${alpha})`;
          ctx.beginPath();
          ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 3);
          ctx.fill();
        }
      });

      // HUD
      ctx.fillStyle = '#8b949e';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Score: ${s.score}`, 4, 4);
      ctx.textAlign = 'right';
      ctx.fillText(`Best: ${bestScore}`, CANVAS_W - 4, 4);

      // Waiting state
      if (s.gameState === 'waiting') {
        ctx.fillStyle = 'rgba(13, 17, 23, 0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐍 Snaktocat', CANVAS_W / 2, CANVAS_H / 2 - 30);

        ctx.fillStyle = '#8b949e';
        ctx.font = '12px sans-serif';
        ctx.fillText(`@${username}`, CANVAS_W / 2, CANVAS_H / 2);
        ctx.fillText(`Attempt ${attemptNumber}/${maxAttempts}`, CANVAS_W / 2, CANVAS_H / 2 + 20);

        ctx.fillStyle = '#58a6ff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Tap or press any arrow key', CANVAS_W / 2, CANVAS_H / 2 + 50);
      }

      // Dead state
      if (s.gameState === 'dead') {
        ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = '#f85149';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀 Game Over', CANVAS_W / 2, CANVAS_H / 2 - 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 25);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick, username, attemptNumber, maxAttempts, bestScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;

      if (s.gameState === 'waiting') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          startGame();
        }
      }

      if (s.gameState !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
          if (s.direction !== 'DOWN') s.nextDirection = 'UP';
          break;
        case 'ArrowDown':
          if (s.direction !== 'UP') s.nextDirection = 'DOWN';
          break;
        case 'ArrowLeft':
          if (s.direction !== 'RIGHT') s.nextDirection = 'LEFT';
          break;
        case 'ArrowRight':
          if (s.direction !== 'LEFT') s.nextDirection = 'RIGHT';
          break;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startGame]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      const touch = e.touches[0];
      s.touchStart = { x: touch.clientX, y: touch.clientY };

      if (s.gameState === 'waiting') {
        startGame();
      }
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
        if (dx > 0 && s.direction !== 'LEFT') s.nextDirection = 'RIGHT';
        else if (dx < 0 && s.direction !== 'RIGHT') s.nextDirection = 'LEFT';
      } else {
        if (dy > 0 && s.direction !== 'UP') s.nextDirection = 'DOWN';
        else if (dy < 0 && s.direction !== 'DOWN') s.nextDirection = 'UP';
      }

      s.touchStart = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startGame]);

  // Initialize
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-gray-500 text-xs">
        Attempt {attemptNumber}/{maxAttempts} · Score: {displayScore}
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-lg border border-[#30363d]"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SnaktocatGame from '@/components/game/SnaktocatGame';
import type { SnaktocatGameRef } from '@/components/game/SnaktocatGame';
import Nokia3310Frame from '@/components/game/Nokia3310Frame';
import ScoreCard from '@/components/game/ScoreCard';
import { encodePayload } from '@/lib/crypto';

interface Player {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  pin: string;
}

type Phase = 'playing' | 'result' | 'finished';

const SCREEN_W = 260;
const SCREEN_H = 260;

export default function GamePage() {
  const router = useRouter();
  const gameRef = useRef<SnaktocatGameRef>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [bestScore, setBestScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [sessionStart, setSessionStart] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [magicCode, setMagicCode] = useState('');
  const [codeMsg, setCodeMsg] = useState('');
  const [redeemingCode, setRedeemingCode] = useState(false);

  const loadAttemptStatus = useCallback(async (p: Player) => {
    try {
      const res = await fetch('/api/score?playerId=' + p.id);
      const data = await res.json();
      if (data.attemptsUsed !== undefined) {
        setAttemptsUsed(data.attemptsUsed);
        setAttemptNumber(data.attemptsUsed + 1);
        setBestScore(data.bestScore || 0);
        setMaxAttempts(data.maxAttempts || 3);
        if (data.attemptsUsed >= (data.maxAttempts || 3)) {
          setPhase('finished');
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('player');
    if (!stored) { router.push('/'); return; }
    try {
      const p = JSON.parse(stored);
      setPlayer(p);
      loadAttemptStatus(p).then(() => setLoading(false));
    } catch { router.push('/'); }
  }, [router, loadAttemptStatus]);

  const handleGameStart = useCallback(() => {
    setSessionStart(Date.now());
  }, []);

  const handleGameOver = useCallback(async (score: number) => {
    if (!player || submitting) return;
    setSubmitting(true);
    setLastScore(score);

    try {
      const { payload, ts } = encodePayload({
        playerId: player.id,
        score,
        pin: player.pin,
        sessionStart,
      });
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, ts }),
      });
      const data = await res.json();

      if (res.ok) {
        setBestScore(data.bestScore || Math.max(bestScore, score));
        setAttemptsUsed(data.attemptNumber);
        setMaxAttempts(data.maxAttempts || maxAttempts);
        if (data.attemptsRemaining <= 0) {
          setPhase('finished');
        } else {
          setAttemptNumber(data.attemptNumber + 1);
          setPhase('result');
        }
      } else if (data.error === 'Maximum attempts reached.') {
        setBestScore(Math.max(bestScore, score));
        setPhase('finished');
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
      setBestScore(Math.max(bestScore, score));
      setPhase('result');
    }

    setSubmitting(false);
  }, [player, sessionStart, bestScore, submitting, maxAttempts]);

  const redeemCode = async () => {
    if (!player || !magicCode.trim() || redeemingCode) return;
    setRedeemingCode(true);
    setCodeMsg('');
    try {
      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id, pin: player.pin, code: magicCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodeMsg('🎉 +1 bonus attempt unlocked!');
        setMagicCode('');
        await loadAttemptStatus(player);
        if (phase === 'finished') setPhase('result');
      } else {
        setCodeMsg(data.error || 'Invalid code.');
      }
    } catch {
      setCodeMsg('Network error.');
    }
    setRedeemingCode(false);
  };

  const playAgain = () => {
    setGameKey(k => k + 1);
    setPhase('playing');
  };

  const MagicCodeInput = () => (
    <div className="mt-4 w-full max-w-sm">
      <p className="text-gray-500 text-xs text-center mb-2">Got a bonus code from staff?</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={magicCode}
          onChange={(e) => setMagicCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="Enter code"
          className="flex-1 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-white text-center font-mono tracking-widest uppercase focus:border-[#58a6ff] focus:outline-none text-sm"
          maxLength={6}
        />
        <button
          onClick={redeemCode}
          disabled={redeemingCode || magicCode.length < 4}
          className="px-4 py-2 bg-[#58a6ff] hover:bg-[#4a90e2] disabled:bg-[#58a6ff]/30 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {redeemingCode ? '...' : 'Redeem'}
        </button>
      </div>
      {codeMsg && (
        <p className={`text-xs text-center mt-1 ${codeMsg.includes('🎉') ? 'text-green-400' : 'text-red-400'}`}>
          {codeMsg}
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading game...</div>
      </div>
    );
  }

  if (!player) return null;

  // Between-attempts result screen
  if (phase === 'result') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <ScoreCard
          username={player.username}
          bestScore={bestScore}
          lastScore={lastScore}
          attempts={attemptsUsed}
          maxAttempts={maxAttempts}
          isFinal={false}
        />
        <button
          onClick={playAgain}
          className="mt-6 w-full max-w-sm py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-xl transition-colors text-lg"
        >
          🐍 Play Again ({maxAttempts - attemptsUsed} left)
        </button>
        <MagicCodeInput />
      </main>
    );
  }

  // Final score screen
  if (phase === 'finished') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <ScoreCard
          username={player.username}
          bestScore={bestScore}
          lastScore={lastScore}
          attempts={attemptsUsed}
          maxAttempts={maxAttempts}
          isFinal={true}
        />
        <MagicCodeInput />
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Back to home
        </button>
      </main>
    );
  }

  // Game screen with Nokia 3310 frame
  return (
    <main className="min-h-screen flex flex-col items-center justify-center overflow-hidden p-2 sm:p-4 bg-[#0d1117]">
      <Nokia3310Frame
        screenWidth={SCREEN_W}
        screenHeight={SCREEN_H}
        onDpadUp={() => gameRef.current?.handleDirection('UP')}
        onDpadDown={() => gameRef.current?.handleDirection('DOWN')}
        onDpadLeft={() => gameRef.current?.handleDirection('LEFT')}
        onDpadRight={() => gameRef.current?.handleDirection('RIGHT')}
      >
        <SnaktocatGame
          ref={gameRef}
          key={gameKey}
          username={player.username}
          attemptNumber={attemptNumber}
          maxAttempts={maxAttempts}
          bestScore={bestScore}
          onGameOver={handleGameOver}
          onGameStart={handleGameStart}
        />
      </Nokia3310Frame>
      {submitting && (
        <div className="mt-4 text-sm text-gray-400 animate-pulse">Saving score...</div>
      )}
    </main>
  );
}

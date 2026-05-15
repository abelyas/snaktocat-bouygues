'use client';

interface ScoreCardProps {
  username: string;
  bestScore: number;
  lastScore: number;
  attempts: number;
  maxAttempts: number;
  isFinal: boolean;
}

export default function ScoreCard({ username, bestScore, lastScore, attempts, maxAttempts, isFinal }: ScoreCardProps) {
  return (
    <div className="w-full max-w-sm mx-auto bg-gradient-to-br from-[#161b22] to-[#0d1117] border-2 border-[#30363d] rounded-2xl p-6 shadow-[0_0_60px_rgba(88,166,255,0.1)]">
      {/* GitHub Logo */}
      <div className="flex justify-center mb-3">
        <svg height="32" viewBox="0 0 16 16" width="32" fill="white" opacity={0.6}>
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
        </svg>
      </div>

      {/* Event */}
      <p className="text-center text-gray-500 text-xs mb-4 tracking-wider uppercase">
        Snaktocat · GitHub × Bouygues Telecom
      </p>

      {/* Player username */}
      <div className="text-center mb-2 bg-[#0d1117] rounded-xl py-3 px-4 border border-[#21262d]">
        <p className="text-gray-500 text-xs mb-1">Player</p>
        <p className="text-[#58a6ff] text-2xl font-mono font-bold">@{username}</p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="text-center bg-[#0d1117] rounded-xl py-3 px-2 border border-[#21262d]">
          <p className="text-gray-500 text-xs mb-1">This Round</p>
          <p className="text-3xl font-bold text-white tabular-nums">{lastScore}</p>
        </div>
        <div className="text-center bg-[#0d1117] rounded-xl py-3 px-2 border border-[#f0883e]/30">
          <p className="text-[#f0883e] text-xs mb-1 font-medium">★ Best Score</p>
          <p className="text-3xl font-bold text-[#f0883e] tabular-nums">{bestScore}</p>
        </div>
      </div>

      {/* Attempts */}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: maxAttempts }, (_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              i < attempts
                ? 'bg-[#238636]/20 border-[#238636] text-[#3fb950]'
                : 'bg-[#161b22] border-[#30363d] text-gray-600'
            }`}
          >
            {i < attempts ? '✓' : i + 1}
          </div>
        ))}
      </div>

      {/* Status message */}
      {isFinal ? (
        <div className="bg-[#f0883e]/10 border border-[#f0883e]/30 rounded-xl p-4 text-center mb-3">
          <p className="text-[#f0883e] text-lg font-bold mb-1">🏆 Contest Complete!</p>
          <p className="text-gray-400 text-sm">
            Your final score: <span className="text-[#f0883e] font-bold text-lg">{bestScore}</span>
          </p>
        </div>
      ) : (
        <div className="bg-[#238636]/10 border border-[#238636]/30 rounded-xl p-3 text-center mb-3">
          <p className="text-[#3fb950] text-sm font-medium">
            {maxAttempts - attempts} attempt{maxAttempts - attempts > 1 ? 's' : ''} remaining
          </p>
        </div>
      )}

      {/* Screenshot CTA */}
      <div className="bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-xl p-3 text-center">
        <p className="text-[#58a6ff] text-sm font-medium">📸 Screenshot this card!</p>
        <p className="text-gray-400 text-xs mt-1">
          Show it at the GitHub booth to claim your prize
        </p>
      </div>

      {/* Branding */}
      <p className="text-center text-gray-600 text-xs mt-4">
        🐍 Snaktocat · github.com
      </p>
    </div>
  );
}

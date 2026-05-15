'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LeaderboardEntry {
  username: string;
  bestScore: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
      {/* Header */}
      <div className="text-center mb-6 lg:mb-12">
        <div className="flex items-center justify-center gap-4 lg:gap-6 mb-3 lg:mb-6">
          <svg height="48" viewBox="0 0 16 16" width="48" fill="white" className="lg:w-16 lg:h-16 xl:w-20 xl:h-20">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <span className="text-gray-600 text-2xl lg:text-4xl">×</span>
          <Image
            src="/assets/logos/bouygues-telecom.png"
            alt="Bouygues Telecom"
            width={120}
            height={90}
            className="object-contain lg:w-40"
          />
          <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold">🐍 Snaktocat</h1>
        </div>
        <p className="text-lg sm:text-xl lg:text-3xl text-gray-400">GitHub × Bouygues Telecom Workshop · Leaderboard</p>
      </div>

      {/* Leaderboard Table */}
      <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-500 text-2xl lg:text-4xl py-20">
            <p className="text-6xl lg:text-8xl mb-4">🐍</p>
            <p>No scores yet, be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.username}
                className={`flex items-center gap-3 sm:gap-4 lg:gap-8 px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 rounded-xl lg:rounded-2xl border-2 transition-all duration-500 ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/10 border-yellow-600/60 scale-[1.03] shadow-lg shadow-yellow-900/20'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-700/30 to-gray-600/10 border-gray-500/50 scale-[1.01]'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-900/30 to-orange-800/10 border-orange-700/50'
                    : 'bg-[#161b22] border-[#30363d]'
                }`}
              >
                <div className="text-3xl sm:text-4xl lg:text-6xl w-12 sm:w-16 lg:w-24 text-center flex-shrink-0">
                  {index < 3 ? MEDALS[index] : (
                    <span className="text-gray-500 font-mono text-xl lg:text-4xl">#{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-mono text-lg sm:text-xl lg:text-4xl xl:text-5xl truncate ${
                    index === 0 ? 'text-yellow-300 font-bold' : 'text-white'
                  }`}>
                    @{entry.username}
                  </p>
                </div>

                <div className={`text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold tabular-nums flex-shrink-0 ${
                  index === 0 ? 'text-yellow-300' : index < 3 ? 'text-gray-200' : 'text-gray-400'
                }`}>
                  {entry.bestScore}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 lg:mt-12 text-gray-600 text-sm lg:text-xl flex items-center gap-2">
        <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full animate-pulse" />
        Live · Updated {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PlayerRow {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  bestScore: number;
  attempts: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [gameActive, setGameActive] = useState(true);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('adminToken');
    if (!stored) {
      router.push('/admin/login');
      return;
    }
    setToken(stored);
  }, [router]);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const fetchPlayers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/players?search=${encodeURIComponent(search)}&page=${page}`, {
        headers: headers(),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setPlayers(data.players || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      console.error('Failed to fetch players');
    }
    setLoading(false);
  }, [token, search, page, headers, router]);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/toggle', { headers: headers() });
      const data = await res.json();
      setGameActive(data.active);
    } catch {}
  }, [token, headers]);

  useEffect(() => {
    if (token) {
      fetchPlayers();
      fetchStatus();
    }
  }, [token, fetchPlayers, fetchStatus]);

  const toggleGame = async () => {
    const res = await fetch('/api/admin/toggle', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ active: !gameActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setGameActive(data.active);
      setStatusMsg(data.active ? 'Game activated ✅' : 'Game deactivated ⛔');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const exportXls = async () => {
    const res = await fetch('/api/admin/export', { headers: headers() });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snaktocat-participants-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const deletePlayer = async (id: string, username: string) => {
    if (!confirm(`Delete player @${username} and all their scores? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/player/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (res.ok) {
      setStatusMsg(`Deleted @${username} ✅`);
      setTimeout(() => setStatusMsg(''), 3000);
      fetchPlayers();
    }
  };

  const purgeAll = async () => {
    const res = await fetch('/api/admin/purge', {
      method: 'DELETE',
      headers: headers(),
    });
    if (res.ok) {
      setStatusMsg('All data purged ✅');
      setConfirmPurge(false);
      setTimeout(() => setStatusMsg(''), 3000);
      fetchPlayers();
    }
  };

  // Magic codes
  const [codeCount, setCodeCount] = useState(5);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [codeStats, setCodeStats] = useState({ total: 0, unused: 0, used: 0 });

  const generateCodes = async () => {
    const res = await fetch('/api/admin/codes', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ count: codeCount }),
    });
    if (res.ok) {
      const data = await res.json();
      setGeneratedCodes(data.codes);
      setStatusMsg(`Generated ${data.generated} magic codes ✅`);
      setTimeout(() => setStatusMsg(''), 3000);
      fetchCodeStats();
    }
  };

  const fetchCodeStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/codes', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setCodeStats(data.stats);
      }
    } catch {}
  }, [token, headers]);

  useEffect(() => {
    if (token) fetchCodeStats();
  }, [token, fetchCodeStats]);

  const logout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (!token) return null;

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">🐍 Snaktocat Admin</h1>
          <p className="text-gray-500 text-sm">GitHub × Bouygues Telecom Workshop · Contest Management</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-300">
          Logout →
        </button>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className="mb-4 px-4 py-2 bg-green-900/30 border border-green-800 rounded-lg text-green-300 text-sm">
          {statusMsg}
        </div>
      )}

      {/* Stats & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-gray-500 text-sm">Total Registrations</p>
          <p className="text-3xl font-bold mt-1">{total}</p>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-gray-500 text-sm">Game Status</p>
          <div className="flex items-center gap-3 mt-1">
            <div className={`w-3 h-3 rounded-full ${gameActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xl font-bold">{gameActive ? 'Active' : 'Paused'}</span>
          </div>
          <button
            onClick={toggleGame}
            className={`mt-2 text-sm px-3 py-1 rounded-lg transition-colors ${
              gameActive
                ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-800'
                : 'bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-800'
            }`}
          >
            {gameActive ? '⏸ Pause Game' : '▶ Activate Game'}
          </button>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-gray-500 text-sm">Actions</p>
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={exportXls}
              className="text-sm px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg transition-colors"
            >
              📥 Export .xlsx
            </button>
            <button
              onClick={() => setConfirmPurge(true)}
              className="text-sm px-3 py-1.5 bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-800 rounded-lg transition-colors"
            >
              🗑 Purge All Data
            </button>
          </div>
        </div>
      </div>

      {/* Purge confirmation */}
      {confirmPurge && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl">
          <p className="text-red-300 font-medium mb-3">
            ⚠️ Are you sure you want to delete ALL participants and scores? This is irreversible.
          </p>
          <div className="flex gap-3">
            <button
              onClick={purgeAll}
              className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmPurge(false)}
              className="px-4 py-2 bg-[#30363d] text-gray-300 rounded-lg hover:bg-[#484f58] text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Magic Codes Section */}
      <div className="mb-8 bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3">🎟️ Magic Codes (Bonus Attempts)</h3>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm">
            {codeStats.unused} unused / {codeStats.total} total ({codeStats.used} redeemed)
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={codeCount}
              onChange={(e) => setCodeCount(Number(e.target.value))}
              className="px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm"
            >
              {[1, 5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button
              onClick={generateCodes}
              className="px-4 py-1.5 bg-[#58a6ff] hover:bg-[#4a90e2] text-white text-sm rounded-lg transition-colors"
            >
              Generate Codes
            </button>
          </div>
        </div>
        {generatedCodes.length > 0 && (
          <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
            <p className="text-xs text-gray-500 mb-2">New codes (give these to players):</p>
            <div className="flex flex-wrap gap-2">
              {generatedCodes.map(code => (
                <span key={code} className="px-3 py-1 bg-[#238636]/20 border border-[#238636]/50 rounded-lg text-[#3fb950] font-mono text-lg tracking-widest">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, username, or email..."
          className="w-full px-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:border-[#58a6ff] focus:outline-none"
        />
      </div>

      {/* Players Table */}
      <div className="overflow-x-auto rounded-xl border border-[#30363d]">
        <table className="w-full text-sm">
          <thead className="bg-[#161b22]">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Best</th>
              <th className="px-4 py-3 text-center">Tries</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : players.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No players found</td>
              </tr>
            ) : (
              players.map((p) => (
                <tr key={p.id} className="hover:bg-[#161b22]/50">
                  <td className="px-4 py-3 font-mono text-[#58a6ff]">@{p.username}</td>
                  <td className="px-4 py-3">{p.firstName} {p.lastName}</td>
                  <td className="px-4 py-3 text-gray-400">{p.email}</td>
                  <td className="px-4 py-3 text-center font-mono">{p.bestScore}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{p.attempts}/3</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deletePlayer(p.id, p.username)}
                      className="text-red-400 hover:text-red-300 text-xs"
                      title="Delete player (GDPR)"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-lg text-sm disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="px-3 py-1 text-gray-500 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-lg text-sm disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}

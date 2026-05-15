'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/admin/toggle', {
      headers: { Authorization: `Bearer ${password}` },
    });

    if (res.ok) {
      localStorage.setItem('adminToken', password);
      router.push('/admin');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">🔒 Admin Access</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-lg text-white focus:border-[#58a6ff] focus:outline-none"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-medium rounded-lg transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEmailError } from '@/lib/email-validation';

export default function RegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    username: '',
    pin: '',
  });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailError, setEmailError] = useState('');
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gameInactive, setGameInactive] = useState(false);

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'username') {
      const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
      setForm((prev) => ({ ...prev, username: sanitized }));
      checkUsername(sanitized);
    }
    if (field === 'pin') {
      const digits = value.replace(/[^0-9]/g, '').slice(0, 6);
      setForm((prev) => ({ ...prev, pin: digits }));
    }
    if (field === 'email') {
      const trimmed = value.trim().toLowerCase();
      setForm((prev) => ({ ...prev, email: trimmed }));
      if (trimmed.includes('@')) {
        setEmailError(getEmailError(trimmed) || '');
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consent) {
      setError('Please accept the data consent to continue.');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('Username is already taken. Please choose another.');
      return;
    }
    if (form.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (form.pin.length < 4) {
      setError('Game PIN must be 4-6 digits.');
      return;
    }
    const emailErr = getEmailError(form.email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, avatar: 'mona' }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.gameInactive) {
          setGameInactive(true);
        }
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      localStorage.setItem('player', JSON.stringify({ ...data.player, pin: form.pin, avatar: 'mona' }));
      router.push('/game');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (gameInactive) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏁</div>
        <h2 className="text-2xl font-bold mb-2">Contest Has Ended</h2>
        <p className="text-gray-400">Thank you for your interest! The Snaktocat contest is now closed.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
          <input
            type="text"
            required
            value={form.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="w-full px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] transition-colors"
            placeholder="Mona"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={form.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="w-full px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] transition-colors"
            placeholder="Octocat"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Job Title *</label>
        <input
          type="text"
          required
          value={form.jobTitle}
          onChange={(e) => handleChange('jobTitle', e.target.value)}
          className="w-full px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] transition-colors"
          placeholder="Developer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Professional Email * <span className="text-gray-500 text-xs">(one registration per email)</span>
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full px-3 py-2.5 bg-[#161b22] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
            emailError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : form.email && !emailError && form.email.includes('@')
              ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
              : 'border-[#30363d] focus:border-[#58a6ff] focus:ring-[#58a6ff]'
          }`}
          placeholder="prenom.nom@bouyguestelecom.fr"
        />
        {emailError && (
          <p className="text-red-400 text-xs mt-1">{emailError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Username * <span className="text-gray-500 text-xs">(shown on leaderboard)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            required
            minLength={3}
            maxLength={30}
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`w-full px-3 py-2.5 bg-[#161b22] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
              usernameStatus === 'available'
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                : usernameStatus === 'taken'
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-[#30363d] focus:border-[#58a6ff] focus:ring-[#58a6ff]'
            }`}
            placeholder="mona-the-octocat"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            {usernameStatus === 'checking' && <span className="text-gray-400">⏳</span>}
            {usernameStatus === 'available' && <span className="text-green-400">✓</span>}
            {usernameStatus === 'taken' && <span className="text-red-400">✗</span>}
          </div>
        </div>
        {usernameStatus === 'taken' && (
          <p className="text-red-400 text-xs mt-1">This username is already taken</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Game PIN * <span className="text-gray-500 text-xs">(4-6 digits, remember it to protect your score!)</span>
        </label>
        <input
          type="password"
          inputMode="numeric"
          required
          minLength={4}
          maxLength={6}
          value={form.pin}
          onChange={(e) => handleChange('pin', e.target.value)}
          className="w-full px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] transition-colors font-mono tracking-widest text-center text-lg"
          placeholder="• • • •"
        />
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[#30363d] bg-[#161b22] text-[#58a6ff] focus:ring-[#58a6ff]"
        />
        <label htmlFor="consent" className="text-xs text-gray-400 leading-relaxed">
          Yes please, I&apos;d like GitHub to use my information for personalized communications, targeted advertising and campaign effectiveness. See the{' '}
          <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">GitHub Privacy Statement</a>{' '}
          for more details.
        </label>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || usernameStatus === 'taken'}
        className="w-full py-3 px-4 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-lg"
      >
        {submitting ? 'Registering...' : '🐍 Play Snaktocat!'}
      </button>
    </form>
  );
}

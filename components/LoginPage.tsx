import React, { useState } from 'react';

interface Props {
  onAuthenticated: () => void;
}

const LoginPage: React.FC<Props> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('app_auth_token', data.token);
        onAuthenticated();
      } else {
        setError(data.error || 'Incorrect password');
      }
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#e9e9e7] w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-[#37352f] mb-1 tracking-tight">Time Tracking</h1>
        <p className="text-sm text-[#a4a4a2] mb-8">Enter your password to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            required
            className="w-full px-4 py-3 border border-[#e9e9e7] rounded-xl text-[#37352f] placeholder-[#a4a4a2] outline-none focus:border-[#37352f] transition-colors text-sm"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-[#37352f] text-white rounded-xl font-medium text-sm hover:bg-[#25241f] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

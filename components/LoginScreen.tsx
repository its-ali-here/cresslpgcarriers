'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function Wheel({ cx, r }: { cx: number; r: number }) {
  return (
    <g className="login-wheel">
      <circle cx={cx} cy={93} r={r} className="login-outline" />
      <line x1={cx - r + 3} y1={93} x2={cx + r - 3} y2={93} className="login-outline-thin" />
      <line x1={cx} y1={93 - r + 3} x2={cx} y2={93 + r - 3} className="login-outline-thin" />
    </g>
  );
}

function LoginIllustration() {
  const stripes = Array.from({ length: 14 }, (_, i) => -32 + i * 32);
  return (
    <div className="login-illustration">
      <svg viewBox="0 0 340 120" preserveAspectRatio="xMidYMid meet">
        <line x1="0" y1="104" x2="340" y2="104" className="login-road-line" />
        <g className="login-road-stripes">
          {stripes.map(x => (
            <line key={x} x1={x} y1="110" x2={x + 16} y2="110" className="login-stripe-dash" />
          ))}
        </g>

        <g className="login-vehicle">
          {/* tanker (bowser) — its front tip sits right up against the cab's back wall, resting
              on the tractor's chassis bed; no wheels under its front (hitch) end, a tri-axle
              cluster under its rear end */}
          <rect x="32" y="38" width="218" height="44" rx="22" className="login-outline" />
          <line x1="38" y1="52" x2="244" y2="52" className="login-tank-band" />
          <text x="141" y="64" textAnchor="middle" className="login-tank-text">CRESS LPG CARRIERS</text>
          <line x1="38" y1="76" x2="244" y2="76" className="login-tank-band" />
          <Wheel cx={55} r={11} />
          <Wheel cx={80} r={11} />
          <Wheel cx={105} r={11} />

          {/* chassis bed — thin connecting frame, mostly hidden beneath the tanker's resting weight,
              with just a clean sliver showing before the cab; the tractor's 2nd/3rd wheel rows sit beneath it */}
          <rect x="230" y="78" width="28" height="4" className="login-outline" />

          {/* prime mover — HOWO/Sino-style cab-over tractor, sized to leave room for the bed */}
          <path d="M258,82 L258,44 L285,44 L300,60 L303,74 L305,74 L305,82 Z" className="login-outline" />
          <rect x="283" y="41" width="12" height="3" rx="1" className="login-outline-thin" />
          <rect x="262" y="49" width="20" height="12" rx="2" className="login-outline-thin" />
          <circle cx="301" cy="66" r="2.2" className="login-outline-thin" />
          <line x1="264" y1="44" x2="264" y2="28" className="login-outline-thin" />
          <line x1="261" y1="28" x2="267" y2="28" className="login-outline-thin" />
          <Wheel cx={226} r={11} />
          <Wheel cx={252} r={11} />
          <Wheel cx={298} r={11} />
        </g>
      </svg>
    </div>
  );
}

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Resolve username → email via DB function, then authenticate
    const { data: email, error: lookupErr } = await supabase.rpc('get_email_by_username', { p_username: username.trim() });
    if (lookupErr || !email) {
      setError('Username not found.');
      setLoading(false);
      return;
    }

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) setError('Incorrect password.');
    setLoading(false);
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark" style={{ width: 48, height: 48 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 26, height: 26 }}>
              <rect x="1" y="3" width="15" height="13" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <div className="brand-name" style={{ fontSize: 20, color: 'var(--navy)' }}>CRESS LPG CARRIERS</div>
            <div className="brand-sub">Logistics Management System</div>
          </div>
        </div>
        <LoginIllustration />
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px 15px' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

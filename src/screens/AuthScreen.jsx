import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import HeroDish from '../components/HeroDish';

export default function AuthScreen() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | check-email | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setStatus('check-email');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // App.jsx's onAuthStateChange listener picks up the session from here
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.');
      setStatus('error');
    }
  }

  if (status === 'check-email') {
    return (
      <div className="auth-screen">
        <HeroDish />
        <div className="auth-card">
          <div className="auth-brand"><span className="auth-dot" />Nutrition Snapshot</div>
          <h2>Check your inbox</h2>
          <p className="auth-sub">We sent a confirmation link to {email}. Confirm it, then come back and log in.</p>
          <button className="auth-link-btn" onClick={() => { setMode('login'); setStatus('idle'); }}>
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <HeroDish />
      <div className="auth-hero-text">
        <p className="auth-hero-tagline">Stop wasting grocery money on nutrition you're not getting.</p>
      </div>
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-dot" />Nutrition Snapshot
        </div>
        <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
        <p className="auth-sub">
          {mode === 'signup'
            ? 'Free forever. 1 photo scan a day, no card needed.'
            : 'Log in to keep tracking your meals.'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? '...' : mode === 'signup' ? 'Sign up free' : 'Log in'}
          </button>
        </form>

        {status === 'error' && <p className="auth-error">{errorMsg}</p>}

        <button
          className="auth-toggle"
          onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setStatus('idle'); }}
        >
          {mode === 'signup' ? 'Already have an account? Log in' : "New here? Sign up"}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthScreen from './screens/AuthScreen';
import Dashboard from './screens/Dashboard';
import './index.css';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="app-loading">Loading...</div>;
  }

  return session ? <Dashboard session={session} /> : <AuthScreen />;
}

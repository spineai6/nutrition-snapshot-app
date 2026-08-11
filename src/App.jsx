import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthScreen from './screens/AuthScreen';
import Dashboard from './screens/Dashboard';
import OnboardingScreen from './screens/OnboardingScreen';
import './index.css';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [onboardingDone, setOnboardingDone] = useState(undefined);
  const [existingProfile, setExistingProfile] = useState(null);

  const checkOnboarding = useCallback(async (sess) => {
    if (!sess) {
      setOnboardingDone(undefined);
      setExistingProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sess.user.id)
      .single();
    setExistingProfile(data || null);
    setOnboardingDone(!!data?.onboarding_completed);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkOnboarding(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkOnboarding(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [checkOnboarding]);

  if (session === undefined || (session && onboardingDone === undefined)) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!session) return <AuthScreen />;
  if (!onboardingDone) {
    return (
      <OnboardingScreen
        session={session}
        existingProfile={existingProfile}
        onComplete={() => setOnboardingDone(true)}
      />
    );
  }
  return <Dashboard session={session} />;
}

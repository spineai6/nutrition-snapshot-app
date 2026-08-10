import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import PhotoScan from '../components/PhotoScan';
import BarcodeScan from '../components/BarcodeScan';
import ManualLogForm from '../components/ManualLogForm';
import MilestoneProgress from '../components/MilestoneProgress';
import SavingsTeaser from '../components/SavingsTeaser';
import LedgerCard from '../components/LedgerCard';
import MealCard from '../components/MealCard';

export default function Dashboard({ session }) {
  const userId = session.user.id;

  const [profile, setProfile] = useState(null);
  const [meals, setMeals] = useState([]);
  const [teaser, setTeaser] = useState(null);
  const [currentLedger, setCurrentLedger] = useState(null);
  const [showManualLog, setShowManualLog] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [profileRes, mealsRes, teaserRes, ledgerRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(20),
      supabase.rpc('get_weekly_savings_teaser', { p_user_id: userId }),
      supabase
        .from('weekly_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (mealsRes.data) setMeals(mealsRes.data);
    if (teaserRes.data !== null) setTeaser(teaserRes.data);
    if (ledgerRes.data) setCurrentLedger(ledgerRes.data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function handleLogged() {
    loadAll();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand"><span className="auth-dot" />Nutrition Snapshot</div>
        <div className="dashboard-header-right">
          <span className="dashboard-tier">{profile?.tier === 'paid' ? 'Premium' : 'Free'}</span>
          <button className="dashboard-logout" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-log-section">
          <PhotoScan userId={userId} onLogged={handleLogged} />
          <BarcodeScan userId={userId} onLogged={handleLogged} />
          <button className="manual-log-trigger" onClick={() => setShowManualLog(true)}>
            + Log a meal manually
          </button>
        </section>

        {/* Ledger takes over once the user has hit preview/frozen/active state; otherwise show the milestone bar */}
        {currentLedger && currentLedger.status !== 'preview' ? (
          <LedgerCard ledger={currentLedger} />
        ) : (
          <MilestoneProgress
            mealsLoggedCount={profile?.meals_logged_count ?? 0}
            milestoneHit={!!profile?.milestone_5_hit_at}
            previewUsed={profile?.preview_week_used}
          />
        )}

        {currentLedger?.status === 'preview' && <LedgerCard ledger={currentLedger} />}

        {profile?.tier === 'free' && <SavingsTeaser amount={teaser} />}

        <section className="dashboard-history">
          <h3>Recent meals</h3>
          {meals.length === 0 ? (
            <p className="dashboard-empty">No meals logged yet — snap your first one above.</p>
          ) : (
            meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
          )}
        </section>
      </main>

      {showManualLog && (
        <ManualLogForm
          userId={userId}
          onLogged={handleLogged}
          onClose={() => setShowManualLog(false)}
        />
      )}
    </div>
  );
}

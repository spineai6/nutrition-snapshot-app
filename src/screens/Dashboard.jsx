import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import PhotoScan from '../components/PhotoScan';
import BarcodeScan from '../components/BarcodeScan';
import ManualLogForm from '../components/ManualLogForm';
import MilestoneProgress from '../components/MilestoneProgress';
import MealCard from '../components/MealCard';
import MacroProgress from '../components/MacroProgress';
import HeroDish from '../components/HeroDish';
import SideMenu from '../components/SideMenu';

export default function Dashboard({ session }) {
  const userId = session.user.id;

  const [profile, setProfile] = useState(null);
  const [meals, setMeals] = useState([]);
  const [teaser, setTeaser] = useState(null);
  const [currentLedger, setCurrentLedger] = useState(null);
  const [macroTotals, setMacroTotals] = useState(null);
  const [showManualLog, setShowManualLog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [profileRes, mealsRes, teaserRes, ledgerRes, macroRes] = await Promise.all([
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
      supabase.rpc('get_todays_macro_totals', { p_user_id: userId }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (mealsRes.data) setMeals(mealsRes.data);
    if (teaserRes.data !== null) setTeaser(teaserRes.data);
    if (ledgerRes.data) setCurrentLedger(ledgerRes.data);
    if (macroRes.data && macroRes.data[0]) {
      const row = macroRes.data[0];
      setMacroTotals({
        calories: row.calories_kcal,
        protein: row.protein_g,
        carbs: row.carbs_g,
        fat: row.fat_g,
      });
    }
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

  const targets = {
    calories: profile?.calorie_target_kcal,
    protein: profile?.protein_target_g,
    carbs: profile?.carb_target_g,
    fat: profile?.fat_target_g,
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand"><span className="auth-dot" />Nutrition Snapshot</div>
        <button className="dashboard-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
      </header>

      <section className="dashboard-hero">
        <HeroDish />
        <div className="dashboard-hero-content">
          <p className="dashboard-hero-greeting">Today's plate</p>
          <MacroProgress totals={macroTotals} targets={targets} />
        </div>
      </section>

      <main className="dashboard-main">
        <section className="dashboard-log-section">
          <PhotoScan userId={userId} onLogged={handleLogged} />
          <BarcodeScan userId={userId} onLogged={handleLogged} />
          <button className="manual-log-trigger" onClick={() => setShowManualLog(true)}>
            + Log a meal manually
          </button>
        </section>

        {!currentLedger || currentLedger.status === 'preview' ? (
          <MilestoneProgress
            mealsLoggedCount={profile?.meals_logged_count ?? 0}
            milestoneHit={!!profile?.milestone_5_hit_at}
            previewUsed={profile?.preview_week_used}
          />
        ) : null}

        <section className="dashboard-history">
          <h3>Recent meals</h3>
          {meals.length === 0 ? (
            <p className="dashboard-empty">No meals logged yet — snap your first one above.</p>
          ) : (
            meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
          )}
        </section>
      </main>

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        profile={profile}
        teaser={teaser}
        currentLedger={currentLedger}
        onLogout={handleLogout}
      />

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

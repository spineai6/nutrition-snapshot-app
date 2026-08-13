import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import PhotoScan from '../components/PhotoScan';
import BarcodeScan from '../components/BarcodeScan';
import ManualLogForm from '../components/ManualLogForm';
import MilestoneProgress from '../components/MilestoneProgress';
import MealCard from '../components/MealCard';
import MacroProgress from '../components/MacroProgress';
import MicroProgress from '../components/MicroProgress';
import { computeMicroTargets } from '../lib/microCalc';
import SignalLayer from '../components/SignalLayer';
import PriceTrend from '../components/PriceTrend';
import MicroTrend from '../components/MicroTrend';
import MacroTrendChart from '../components/MacroTrendChart';
import InsightsScreen from './InsightsScreen';
import HeroDish from '../components/HeroDish';
import SideMenu from '../components/SideMenu';

export default function Dashboard({ session }) {
  const userId = session.user.id;

  const [profile, setProfile] = useState(null);
  const [meals, setMeals] = useState([]);
  const [teaser, setTeaser] = useState(null);
  const [currentLedger, setCurrentLedger] = useState(null);
  const [macroTotals, setMacroTotals] = useState(null);
  const [microTotals, setMicroTotals] = useState(null);
  const [signalLayer, setSignalLayer] = useState(null);
  const [priceTrend, setPriceTrend] = useState(null);
  const [microTrend, setMicroTrend] = useState(null);
  const [macroHistory, setMacroHistory] = useState(null);
  const [showManualLog, setShowManualLog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const results = await Promise.all([
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
      supabase.rpc('get_todays_micro_totals', { p_user_id: userId }),
      supabase.rpc('get_weekly_signal_layer', { p_user_id: userId }),
      supabase.rpc('get_price_trend'),
      supabase.rpc('get_weekly_micro_trend', { p_user_id: userId }),
      supabase.rpc('get_daily_macro_history', { p_user_id: userId, p_days: 7 }),
    ]);

    const [profileRes, mealsRes, teaserRes, ledgerRes, macroRes, microRes, signalRes, trendRes, microTrendRes, historyRes] = results;

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
    if (microRes.data && microRes.data[0]) {
      setMicroTotals(microRes.data[0]);
    }
    if (signalRes.data && signalRes.data[0]) {
      setSignalLayer(signalRes.data[0]);
    }
    if (trendRes.data && trendRes.data.length > 0) {
      const first = trendRes.data[0];
      setPriceTrend({
        months_available: first.months_available,
        latest_month: first.latest_month,
        previous_month: first.previous_month,
        pct_change: first.pct_change,
        categories: trendRes.data
          .filter((r) => r.category)
          .map((r) => ({ category: r.category, category_pct_change: r.category_pct_change })),
      });
    }
    if (microTrendRes.data && microTrendRes.data[0]) {
      setMicroTrend(microTrendRes.data[0]);
    }
    if (historyRes.data) {
      setMacroHistory(historyRes.data);
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

  async function handleEditGoals() {
    await supabase.from('profiles').update({ onboarding_completed: false }).eq('id', userId);
    window.location.reload();
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
  const microTargets = computeMicroTargets({ gender: profile?.gender });

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

        <MacroTrendChart history={macroHistory} targetCalories={targets.calories} />

        <MicroProgress
          isPaid={profile?.tier === 'paid'}
          totals={microTotals}
          targets={microTargets}
          onUpgradeClick={() => setMenuOpen(true)}
        />

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
        onEditGoals={handleEditGoals}
        signalLayer={signalLayer}
        priceTrend={priceTrend}
        microTrend={microTrend}
        isPaid={profile?.tier === 'paid'}
        microTargets={microTargets}
        onOpenInsights={() => { setMenuOpen(false); setInsightsOpen(true); }}
      />

      {insightsOpen && (
        <div className="insights-overlay">
          <InsightsScreen session={session} onClose={() => setInsightsOpen(false)} />
        </div>
      )}

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
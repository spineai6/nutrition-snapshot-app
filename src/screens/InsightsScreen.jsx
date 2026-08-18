import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';
import { computeMicroTargets } from '../lib/microCalc';

const MIN_SAMPLE = 5;

function corrStrength(r) {
  const abs = Math.abs(r);
  if (abs >= 0.5) return 'a fairly strong';
  if (abs >= 0.3) return 'a moderate';
  return 'a weak';
}

export default function InsightsScreen({ session, onClose }) {
  const userId = session.user.id;
  const [insights, setInsights] = useState(null);
  const [series, setSeries] = useState([]);
  const [target, setTarget] = useState(2000);
  const [isPaid, setIsPaid] = useState(false);
  const [valueFood, setValueFood] = useState(null);
  const [shield, setShield] = useState(null);
  const [energyScore, setEnergyScore] = useState(null);
  const [energyDays, setEnergyDays] = useState(0);
  const [weeklySavings, setWeeklySavings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('calorie_target_kcal, tier, gender')
        .eq('id', userId)
        .single();
      const calTarget = profile?.calorie_target_kcal || 2000;
      setTarget(calTarget);
      setIsPaid(profile?.tier === 'paid');

      const microTargets = computeMicroTargets({ gender: profile?.gender });

      const [insightsRes, seriesRes, valueFoodRes, shieldRes, signalRes, savingsRes] = await Promise.all([
        supabase.rpc('get_nutrition_insights', { p_user_id: userId, p_calorie_target: calTarget, p_days: 30 }),
        supabase.rpc('get_daily_nutrition_series', { p_user_id: userId, p_days: 30 }),
        supabase.rpc('get_weekly_value_food', { p_user_id: userId }),
        supabase.rpc('get_deficiency_shield', {
          p_user_id: userId,
          p_iron_target: microTargets.iron_mg,
          p_calcium_target: microTargets.calcium_mg,
          p_vitc_target: microTargets.vitamin_c_mg,
          p_b12_target: microTargets.vitamin_b12_ug,
        }),
        supabase.rpc('get_weekly_signal_layer', { p_user_id: userId }),
        supabase.rpc('get_weekly_savings_teaser', { p_user_id: userId }),
      ]);
      if (insightsRes.data?.[0]) setInsights(insightsRes.data[0]);
      if (seriesRes.data) setSeries(seriesRes.data);
      if (valueFoodRes.data?.[0]) setValueFood(valueFoodRes.data[0]);
      if (shieldRes.data?.[0]) setShield(shieldRes.data[0]);
      if (signalRes.data?.[0]) {
        setEnergyScore(signalRes.data[0].avg_satiety_score);
        setEnergyDays(signalRes.data[0].days_logged);
      }
      if (savingsRes.data != null) setWeeklySavings(Number(savingsRes.data));
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="insights-screen">
        <div className="insights-header">
          <span className="insights-title">Insights</span>
          {onClose && <button className="side-menu-close" onClick={onClose}>✕</button>}
        </div>
        <p className="insights-loading">Crunching your last 30 days...</p>
      </div>
    );
  }

  const hasLateNight = insights?.late_night_n >= 3 && insights?.normal_n >= 3;
  const hasDiversitySatiety = insights?.diversity_satiety_n >= MIN_SAMPLE && insights?.diversity_satiety_corr != null;
  const hasWeekdayWeekend = series.some((s) => s.is_weekend) && series.some((s) => !s.is_weekend);
  const hasSpendProtein = insights?.spend_protein_n >= MIN_SAMPLE && insights?.spend_protein_corr != null;

  const anyInsight = hasLateNight || hasDiversitySatiety || hasWeekdayWeekend || hasSpendProtein
    || !!valueFood || (energyScore != null && energyDays >= 3) || !!shield;

  return (
    <div className="insights-screen">
      <div className="insights-header">
        <span className="insights-title">Insights</span>
        {onClose && <button className="side-menu-close" onClick={onClose}>✕</button>}
      </div>
      <p className="insights-sub">Patterns found in your last 30 days of logged meals.</p>

      {valueFood && (
        <div className="insight-card value-card">
          <p className="insight-card-tag">🏆 Top value food this week</p>
          <p className="insight-headline">
            {valueFood.food_name} gave you {valueFood.total_protein_g}g protein for just ₹{valueFood.total_cost_inr}.
          </p>
          <p className="insight-meta">Efficiency: {valueFood.protein_per_rupee}g protein per rupee</p>
        </div>
      )}

      {energyScore != null && energyDays >= 3 && (
        <div className="insight-card">
          <p className="insight-card-tag">⚡ Satiety Stability Score</p>
          <p className="insight-headline">{Math.round(energyScore)}/100</p>
          <p className="insight-meta">
            {energyScore >= 60
              ? 'Your meals this week were running high on protein & fiber relative to calories — a mix that tends to keep you fuller for longer.'
              : energyScore >= 30
              ? 'A moderate mix this week — some meals lean light on protein & fiber relative to calories.'
              : 'Your meals this week leaned light on protein & fiber relative to calories, which can mean less staying power between meals.'}
          </p>
          <p className="insight-meta">Based on {energyDays} logged days this week · a designed proxy, not a clinical measure</p>
        </div>
      )}

      {shield && shield.fix_food_name && (
        <div className="insight-card shield-card">
          <p className="insight-card-tag">🛡️ {shield.nutrient} gap this week</p>
          <p className="insight-headline">
            You averaged {shield.avg_value} this week (target: {shield.target}) — about {shield.gap_pct}% short.
          </p>
          <p className="insight-fix">
            💡 Budget fix: add ~{shield.fix_grams}g {shield.fix_food_name} (₹{shield.fix_cost_inr}) to close roughly {shield.fix_covers_pct}% of this gap.
          </p>
        </div>
      )}

      {shield && !shield.fix_food_name && shield.nutrient && (
        <div className="insight-card">
          <p className="insight-card-tag">🛡️ Micro-nutrient check</p>
          <p className="insight-headline">You're at or above target on {shield.nutrient.toLowerCase()} and the other tracked micros this week — no gap to flag.</p>
        </div>
      )}

      {isPaid ? (
        <div className="insight-card trajectory-card">
          <p className="insight-card-tag">📈 30-day financial trajectory</p>
          <p className="insight-headline">
            At this week's swap-savings pattern, you're on track to save ₹{Math.round(weeklySavings * (30 / 7))} on grocery spend this month.
          </p>
          <p className="insight-meta">Projected from ₹{weeklySavings.toFixed(0)} saved via swaps in the last 7 days · projection, not a guarantee</p>
        </div>
      ) : (
        <div className="insight-card trajectory-locked">
          <p className="insight-card-tag">📈 30-day financial trajectory</p>
          <p className="insight-meta">See where your grocery savings are headed this month — Premium.</p>
          <button className="micro-locked-btn" onClick={onClose}>Unlock Full Trajectory Ledger</button>
        </div>
      )}

      {!anyInsight && (
        <div className="insights-empty">
          <p>Not enough logged history yet to find real patterns — these need at least 5 comparable days. Keep logging and check back.</p>
        </div>
      )}

      {hasLateNight && (
        <div className="insight-card">
          <p className="insight-headline">
            {insights.avg_next_day_cal_late > insights.avg_next_day_cal_normal
              ? `After a late-night meal, you eat about ${Math.round(insights.avg_next_day_cal_late - insights.avg_next_day_cal_normal)} kcal more the next day.`
              : `Late-night meals don't seem to change your next-day eating much.`}
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={[
                { label: 'After late-night meal', value: insights.avg_next_day_cal_late },
                { label: 'Normal day', value: insights.avg_next_day_cal_normal },
              ]}
              margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={44} />
              <ReferenceLine y={target} stroke="var(--chili)" strokeDasharray="4 4" />
              <Tooltip contentStyle={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, fontSize: 12, fontFamily: 'IBM Plex Mono' }} formatter={(v) => [`${v} kcal`, '']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} stroke="var(--ink)" strokeWidth={1.5}>
                <Cell fill="var(--chili)" />
                <Cell fill="var(--mustard-lime)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="insight-meta">Based on {insights.late_night_n} late nights vs {insights.normal_n} normal days · dashed line = your {target} kcal target</p>
        </div>
      )}

      {hasDiversitySatiety && (
        <div className="insight-card">
          <p className="insight-headline">
            {insights.diversity_satiety_corr > 0.1
              ? `Days with more food variety tend to have a higher satiety score — ${corrStrength(insights.diversity_satiety_corr)} link (r=${insights.diversity_satiety_corr}).`
              : insights.diversity_satiety_corr < -0.1
              ? `More food variety hasn't tracked with higher satiety in your data — if anything, a slight opposite pattern (r=${insights.diversity_satiety_corr}).`
              : `No real link between food variety and satiety shows up in your data yet (r=${insights.diversity_satiety_corr}).`}
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <ScatterChart margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" dataKey="diversity_count" name="Foods that day" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="satiety_score" name="Satiety score" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={38} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                formatter={(v, name) => [v, name === 'diversity_count' ? 'Foods' : 'Satiety']}
              />
              <Scatter data={series.filter((s) => s.calories > 0)} fill="var(--teal-2)" stroke="var(--ink)" strokeWidth={1} />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="insight-meta">Each dot = one day, across {insights.diversity_satiety_n} logged days</p>
        </div>
      )}

      {hasWeekdayWeekend && (
        <div className="insight-card">
          <p className="insight-headline">
            {Math.abs(insights.weekend_avg_calories - insights.weekday_avg_calories) < 50
              ? `Your weekday and weekend eating look pretty similar.`
              : insights.weekend_avg_calories > insights.weekday_avg_calories
              ? `Your weekends run about ${Math.round(insights.weekend_avg_calories - insights.weekday_avg_calories)} kcal higher than weekdays.`
              : `Your weekdays run about ${Math.round(insights.weekday_avg_calories - insights.weekend_avg_calories)} kcal higher than weekends.`}
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={[
                { label: 'Weekday avg', value: insights.weekday_avg_calories },
                { label: 'Weekend avg', value: insights.weekend_avg_calories },
              ]}
              margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={44} />
              <ReferenceLine y={target} stroke="var(--chili)" strokeDasharray="4 4" />
              <Tooltip contentStyle={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, fontSize: 12, fontFamily: 'IBM Plex Mono' }} formatter={(v) => [`${v} kcal`, '']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} stroke="var(--ink)" strokeWidth={1.5} fill="var(--turmeric)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasSpendProtein && (
        <div className="insight-card">
          <p className="insight-headline">
            {insights.spend_protein_corr > 0.1
              ? `Spending more on a day's food tends to get you more protein — ${corrStrength(insights.spend_protein_corr)} link (r=${insights.spend_protein_corr}).`
              : `Your spend doesn't track closely with the protein you're getting (r=${insights.spend_protein_corr}) — worth checking if cheaper days are also lower-protein.`}
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <ScatterChart margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" dataKey="cost" name="Spend" unit="₹" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="protein" name="Protein" unit="g" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
              />
              <Scatter data={series.filter((s) => s.cost > 0)} fill="var(--good)" stroke="var(--ink)" strokeWidth={1} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="insights-disclaimer">
        These are patterns in your own logged data, not medical findings — correlation isn't causation, and small
        sample sizes can be noisy. Not medical advice.
      </p>
    </div>
  );
}

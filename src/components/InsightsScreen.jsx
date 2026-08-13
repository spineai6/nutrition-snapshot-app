import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('calorie_target_kcal')
        .eq('id', userId)
        .single();
      const calTarget = profile?.calorie_target_kcal || 2000;
      setTarget(calTarget);

      const [insightsRes, seriesRes] = await Promise.all([
        supabase.rpc('get_nutrition_insights', { p_user_id: userId, p_calorie_target: calTarget, p_days: 30 }),
        supabase.rpc('get_daily_nutrition_series', { p_user_id: userId, p_days: 30 }),
      ]);
      if (insightsRes.data?.[0]) setInsights(insightsRes.data[0]);
      if (seriesRes.data) setSeries(seriesRes.data);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="insights-screen">
        <div className="insights-header">
          <span className="insights-title">Insights</span>
          <button className="side-menu-close" onClick={onClose}>✕</button>
        </div>
        <p className="insights-loading">Crunching your last 30 days...</p>
      </div>
    );
  }

  const hasLateNight = insights?.late_night_n >= 3 && insights?.normal_n >= 3;
  const hasDiversitySatiety = insights?.diversity_satiety_n >= MIN_SAMPLE && insights?.diversity_satiety_corr != null;
  const hasWeekdayWeekend = series.some((s) => s.is_weekend) && series.some((s) => !s.is_weekend);
  const hasSpendProtein = insights?.spend_protein_n >= MIN_SAMPLE && insights?.spend_protein_corr != null;

  const anyInsight = hasLateNight || hasDiversitySatiety || hasWeekdayWeekend || hasSpendProtein;

  return (
    <div className="insights-screen">
      <div className="insights-header">
        <span className="insights-title">Insights</span>
        <button className="side-menu-close" onClick={onClose}>✕</button>
      </div>
      <p className="insights-sub">Patterns found in your last 30 days of logged meals.</p>

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
              margin={{ top: 6, right: 6, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={40} />
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
            <ScatterChart margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" dataKey="diversity_count" name="Foods that day" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="satiety_score" name="Satiety score" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={30} />
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
              margin={{ top: 6, right: 6, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={40} />
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
            <ScatterChart margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" dataKey="cost" name="Spend" unit="₹" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="protein" name="Protein" unit="g" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={34} />
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

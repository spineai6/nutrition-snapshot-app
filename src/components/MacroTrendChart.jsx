import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';

function fillMissingDays(history, days = 7) {
  const map = new Map((history || []).map((h) => [h.day, h]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    out.push({
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      calories: row ? Number(row.calories_kcal) : 0,
    });
  }
  return out;
}

export default function MacroTrendChart({ history, targetCalories }) {
  const data = fillMissingDays(history);
  const hasAnyData = data.some((d) => d.calories > 0);

  return (
    <div className="trend-chart-card">
      <p className="trend-chart-label">Calories, past 7 days</p>
      {!hasAnyData ? (
        <p className="trend-chart-empty">Log a few meals and your trend will show up here.</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="calFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--turmeric)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--turmeric)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={44} />
            {targetCalories && (
              <ReferenceLine y={targetCalories} stroke="var(--chili)" strokeDasharray="4 4" strokeWidth={1.5} />
            )}
            <Tooltip
              contentStyle={{
                background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, fontSize: 12,
                fontFamily: 'IBM Plex Mono',
              }}
              formatter={(v) => [`${v} kcal`, 'Calories']}
            />
            <Area type="monotone" dataKey="calories" stroke="var(--turmeric-deep)" strokeWidth={2.5} fill="url(#calFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
      {targetCalories && <p className="trend-chart-note">Dashed line = your {targetCalories} kcal target</p>}
    </div>
  );
}

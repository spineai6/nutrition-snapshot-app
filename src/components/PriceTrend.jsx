import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';

function formatMonth(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

const CATEGORY_LABELS = {
  grain: 'Grains', pulse: 'Pulses', veg: 'Veg', dairy: 'Dairy',
  nonveg: 'Meat/fish/egg', fruit: 'Fruit', nuts: 'Nuts', spice: 'Spices',
};

export default function PriceTrend({ data }) {
  if (!data) return null;

  if (data.months_available < 2) {
    return (
      <div className="price-trend price-trend-empty">
        <p className="price-trend-label">Grocery price trend</p>
        <p className="price-trend-waiting">
          We've only got one month of pricing so far ({formatMonth(data.latest_month)}). Once
          prices are refreshed next month, you'll see how your basket cost is moving — nobody
          else in this space shows this.
        </p>
      </div>
    );
  }

  const direction = data.pct_change > 0 ? 'up' : data.pct_change < 0 ? 'down' : 'flat';
  const headline =
    direction === 'up'
      ? `Your staple basket got ${Math.abs(data.pct_change)}% more expensive since ${formatMonth(data.previous_month)}.`
      : direction === 'down'
      ? `Your staple basket got ${Math.abs(data.pct_change)}% cheaper since ${formatMonth(data.previous_month)}.`
      : `Your staple basket cost held steady since ${formatMonth(data.previous_month)}.`;

  return (
    <div className="price-trend">
      <p className="price-trend-label">Grocery price trend</p>
      <p className={`price-trend-headline ${direction}`}>{headline}</p>
      {data.categories?.length > 0 && (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data.categories.map((c) => ({ ...c, label: CATEGORY_LABELS[c.category] || c.category }))} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={36} unit="%" />
            <ReferenceLine y={0} stroke="var(--ink)" strokeWidth={1.5} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
              formatter={(v) => [`${v > 0 ? '+' : ''}${v}%`, 'Price change']}
            />
            <Bar dataKey="category_pct_change" radius={[3, 3, 3, 3]} stroke="var(--ink)" strokeWidth={1}>
              {data.categories.map((c, i) => (
                <Cell key={i} fill={c.category_pct_change > 0 ? 'var(--chili)' : c.category_pct_change < 0 ? 'var(--good)' : 'var(--paper-2)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

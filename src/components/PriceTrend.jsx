function formatMonth(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

const CATEGORY_LABELS = {
  grain: 'Grains', pulse: 'Pulses', veg: 'Vegetables', dairy: 'Dairy',
  nonveg: 'Meat, fish & eggs', fruit: 'Fruit', nuts: 'Nuts', spice: 'Spices',
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
        <div className="price-trend-categories">
          {data.categories.map((c) => (
            <div key={c.category} className="price-trend-cat-row">
              <span>{CATEGORY_LABELS[c.category] || c.category}</span>
              <span className={c.category_pct_change > 0 ? 'up' : c.category_pct_change < 0 ? 'down' : ''}>
                {c.category_pct_change > 0 ? '+' : ''}{c.category_pct_change}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MICROS = [
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg' },
  { key: 'vitamin_b12_ug', label: 'B12', unit: 'µg' },
];

function trajectoryLine(label, avg, prevAvg, target) {
  const pctOfTarget = Math.round((avg / target) * 100);
  if (prevAvg == null) {
    return `${label}: averaging ${avg}${''} this week, about ${pctOfTarget}% of your daily target.`;
  }
  const delta = avg - prevAvg;
  const closingGap = avg < target && delta > 0;
  const wideningGap = avg < target && delta < 0;

  if (closingGap) {
    return `${label}: up from last week, closing the gap toward your ${target}-a-day target.`;
  }
  if (wideningGap) {
    return `${label}: trending down from last week — heading further from your ${target}-a-day target if this continues.`;
  }
  if (avg >= target) {
    return `${label}: on track, averaging ${pctOfTarget}% of target this week.`;
  }
  return `${label}: holding steady at about ${pctOfTarget}% of target.`;
}

export default function MicroTrend({ isPaid, data, targets, onUpgradeClick }) {
  if (!isPaid) {
    return (
      <div className="micro-trend-locked">
        <p className="micro-trend-label">🔒 Weekly micro trend</p>
        <p className="micro-trend-locked-desc">See whether your iron, calcium, vitamin C & B12 are heading toward a gap or closing one — Premium.</p>
        <button className="micro-locked-btn" onClick={onUpgradeClick}>Unlock with Premium</button>
      </div>
    );
  }

  if (!data || data.days_logged_current === 0) {
    return (
      <div className="micro-trend">
        <p className="micro-trend-label">Weekly micro trend</p>
        <p className="micro-trend-empty">Log meals across the week and we'll show your micro-nutrient trend here.</p>
      </div>
    );
  }

  const lines = MICROS.map(({ key, label, unit }) => {
    const avg = data[`avg_${key}`];
    const prevAvg = data[`prev_${key}`];
    const target = targets[key];
    if (avg == null) return null;
    return { key, text: trajectoryLine(`${label}`, avg, prevAvg, `${target}${unit}`) };
  }).filter(Boolean);

  return (
    <div className="micro-trend">
      <p className="micro-trend-label">Weekly micro trend</p>
      <div className="micro-trend-lines">
        {lines.map((l) => (
          <p key={l.key} className="micro-trend-line">{l.text}</p>
        ))}
      </div>
      <p className="micro-disclaimer">Pattern-level trend from your logged food — not a diagnosis, not medical advice.</p>
    </div>
  );
}

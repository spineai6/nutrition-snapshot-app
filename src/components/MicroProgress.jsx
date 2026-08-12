const MICROS = [
  { key: 'iron_mg', label: 'Iron', unit: 'mg', color: 'var(--chili)' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', color: 'var(--paper)' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', color: 'var(--turmeric)' },
  { key: 'vitamin_b12_ug', label: 'B12', unit: 'µg', color: 'var(--mustard-lime)' },
];

export default function MicroProgress({ isPaid, totals, targets, onUpgradeClick }) {
  if (!isPaid) {
    return (
      <div className="micro-locked">
        <p className="micro-locked-label">🔒 Micro-nutrient tracking</p>
        <p className="micro-locked-desc">
          See iron, calcium, vitamin C & B12 against your daily needs — a Premium feature.
        </p>
        <button className="micro-locked-btn" onClick={onUpgradeClick}>Unlock with Premium</button>
      </div>
    );
  }

  return (
    <div className="micro-progress">
      <p className="micro-progress-label">Today's micros</p>
      <div className="micro-rows">
        {MICROS.map(({ key, label, unit, color }) => {
          const value = Number(totals?.[key] ?? 0);
          const target = Number(targets?.[key] ?? 1) || 1;
          const pct = Math.min(100, Math.round((value / target) * 100));
          return (
            <div key={key} className="micro-row">
              <div className="micro-row-head">
                <span className="micro-row-label">{label}</span>
                <span className="micro-row-value">
                  {value.toFixed(1)}<span className="micro-row-target">/{target}{unit}</span>
                </span>
              </div>
              <div className="micro-row-bar">
                <div className="micro-row-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="micro-disclaimer">General adult reference values — not medical advice.</p>
    </div>
  );
}

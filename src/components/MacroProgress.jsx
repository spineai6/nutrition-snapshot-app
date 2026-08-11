const MACROS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: 'var(--turmeric)' },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'var(--chili)' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'var(--teal-2)' },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'var(--mustard-lime-deep)' },
];

export default function MacroProgress({ totals, targets }) {
  return (
    <div className="macro-progress">
      {MACROS.map(({ key, label, unit, color }) => {
        const value = Number(totals?.[key] ?? 0);
        const target = Number(targets?.[key] ?? 1) || 1;
        const pct = Math.min(100, Math.round((value / target) * 100));
        return (
          <div key={key} className="macro-row">
            <div className="macro-row-head">
              <span className="macro-row-label">{label}</span>
              <span className="macro-row-value">
                {Math.round(value)}
                <span className="macro-row-target">/{Math.round(target)}{unit}</span>
              </span>
            </div>
            <div className="macro-row-bar">
              <div
                className="macro-row-fill"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

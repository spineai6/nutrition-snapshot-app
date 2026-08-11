const MACROS = [
  { key: 'calories', label: 'Cal', unit: '', color: 'var(--turmeric)' },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'var(--chili)' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'var(--mustard-lime)' },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'var(--paper)' },
];

const R = 30;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function MacroProgress({ totals, targets }) {
  return (
    <div className="macro-progress">
      {MACROS.map(({ key, label, unit, color }) => {
        const value = Number(totals?.[key] ?? 0);
        const target = Number(targets?.[key] ?? 1) || 1;
        const pct = Math.min(100, Math.round((value / target) * 100));
        const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

        return (
          <div key={key} className="macro-ring-item">
            <div className="macro-ring-wrap">
              <svg viewBox="0 0 72 72" className="macro-ring-svg">
                <circle cx="36" cy="36" r={R} className="macro-ring-track" />
                <circle
                  cx="36"
                  cy="36"
                  r={R}
                  stroke={color}
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  transform="rotate(-90 36 36)"
                  className="macro-ring-fill"
                />
              </svg>
              <div className="macro-ring-center">
                <span className="macro-ring-value">{Math.round(value)}</span>
                <span className="macro-ring-pct">{pct}%</span>
              </div>
            </div>
            <span className="macro-ring-label">{label}</span>
            <span className="macro-ring-target">of {Math.round(target)}{unit}</span>
          </div>
        );
      })}
    </div>
  );
}

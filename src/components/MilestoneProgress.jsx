export default function MilestoneProgress({ mealsLoggedCount, milestoneHit, previewUsed }) {
  const capped = Math.min(mealsLoggedCount, 5);
  const pct = (capped / 5) * 100;

  if (previewUsed) {
    return null; // ledger card takes over messaging once the preview has happened
  }

  return (
    <div className="milestone-card">
      {milestoneHit ? (
        <>
          <p className="milestone-label">🎉 Milestone hit</p>
          <p className="milestone-desc">Your free AI Weekly Plan is ready.</p>
        </>
      ) : (
        <>
          <p className="milestone-label">{capped}/5 meals logged</p>
          <div className="milestone-bar">
            <div className="milestone-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="milestone-desc">Log 5 meals this week to unlock your first free AI Weekly Plan.</p>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';

function diversityLine(count) {
  if (count === 0) return "Log a few meals this week to see your variety.";
  if (count < 8) return `You've eaten ${count} different foods this week — try branching out a bit.`;
  if (count < 15) return `${count} different foods this week — solid variety.`;
  return `${count} different foods this week — genuinely varied plate.`;
}

function lateNightLine(count) {
  if (count === 0) return "No late-night meals logged this week.";
  if (count === 1) return "1 meal logged late at night (after 10pm) this week.";
  return `${count} meals logged late at night (after 10pm) this week.`;
}

function eatingWindowLine(hours) {
  if (hours == null) return null;
  return `Your meals this week spanned about ${hours}h a day, on average.`;
}

function satietyLine(score) {
  if (score == null) return null;
  if (score < 30) return `Satiety score: ${score}/100 — your meals lean light on protein & fiber relative to calories.`;
  if (score < 60) return `Satiety score: ${score}/100 — a moderate mix of filling foods.`;
  return `Satiety score: ${score}/100 — your meals are running high on protein & fiber, which tends to keep you fuller longer.`;
}

export default function SignalLayer({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data || data.days_logged === 0) {
    return (
      <div className="signal-layer">
        <p className="signal-layer-label">This week's patterns</p>
        <p className="signal-layer-empty">Log a few meals this week and we'll surface patterns here.</p>
      </div>
    );
  }

  const headline = diversityLine(data.diversity_count);

  return (
    <div className="signal-layer">
      <p className="signal-layer-label">This week's patterns</p>
      <p className="signal-layer-headline">{headline}</p>

      {!expanded ? (
        <button className="signal-layer-expand" onClick={() => setExpanded(true)}>
          See details ▾
        </button>
      ) : (
        <div className="signal-layer-details">
          <div className="signal-layer-row">
            <span className="signal-layer-row-label">Plant-based variety</span>
            <span className="signal-layer-row-value">{data.plant_diversity_count} foods</span>
          </div>
          {eatingWindowLine(data.avg_eating_window_hours) && (
            <p className="signal-layer-line">{eatingWindowLine(data.avg_eating_window_hours)}</p>
          )}
          <p className="signal-layer-line">{lateNightLine(data.late_night_meal_count)}</p>
          {satietyLine(data.avg_satiety_score) && (
            <p className="signal-layer-line">{satietyLine(data.avg_satiety_score)}</p>
          )}
          <button className="signal-layer-expand" onClick={() => setExpanded(false)}>
            Collapse ▴
          </button>
        </div>
      )}
    </div>
  );
}

import SwapSuggestions from './SwapSuggestions';

export default function MealCard({ meal }) {
  const time = new Date(meal.logged_at).toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="meal-history-card">
      <div className="meal-history-top">
        <div className="meal-history-head">
          <span className="meal-history-source">{meal.source === 'photo' ? '📸' : '✏️'}</span>
          <span className="meal-history-time">{time}</span>
        </div>
        <div className="meal-history-totals">
          <span>{meal.total_calories_kcal ?? '—'} kcal</span>
          <span>{meal.total_protein_g ?? '—'}g P</span>
          <span>{meal.total_carbs_g ?? '—'}g C</span>
          <span>{meal.total_fat_g ?? '—'}g F</span>
        </div>
      </div>
      <SwapSuggestions mealId={meal.id} />
    </div>
  );
}

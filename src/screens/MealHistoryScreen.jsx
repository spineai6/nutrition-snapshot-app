import MealCard from '../components/MealCard';

function toISTDateStr(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatGroupLabel(dateStr) {
  const todayIST = toISTDateStr(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIST = toISTDateStr(yesterday);

  if (dateStr === todayIST) return 'Today';
  if (dateStr === yesterdayIST) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export default function MealHistoryScreen({ meals, onClose, onViewDetail }) {
  const groups = {};
  for (const meal of meals) {
    const day = toISTDateStr(meal.logged_at);
    if (!groups[day]) groups[day] = [];
    groups[day].push(meal);
  }
  const sortedDays = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="insights-screen">
      <div className="insights-header">
        <span className="insights-title">Meal history</span>
        <button className="side-menu-close" onClick={onClose}>✕</button>
      </div>
      <p className="insights-sub">Everything logged before today.</p>

      {sortedDays.length === 0 ? (
        <p className="dashboard-empty">No past meals yet — they'll show up here once today ends.</p>
      ) : (
        sortedDays.map((day) => (
          <div key={day} className="history-day-group">
            <p className="history-day-label">{formatGroupLabel(day)}</p>
            {groups[day].map((meal) => (
              <MealCard key={meal.id} meal={meal} onViewDetail={onViewDetail} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

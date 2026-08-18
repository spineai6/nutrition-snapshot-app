const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'insights', label: 'Insights', icon: '📊' },
  { key: 'tools', label: 'Tools', icon: '🔧' },
  { key: 'more', label: 'More', icon: '⋯' },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`tab-bar-btn ${active === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="tab-bar-icon">{tab.icon}</span>
          <span className="tab-bar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

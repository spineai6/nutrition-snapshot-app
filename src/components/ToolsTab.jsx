import { useState } from 'react';
import SwapSimulatorScreen from '../screens/SwapSimulatorScreen';
import PriceCorrectionScreen from '../screens/PriceCorrectionScreen';
import GroceryListGenerator from './GroceryListGenerator';

const SUB_TABS = [
  { key: 'simulator', label: '🔄 Simulator' },
  { key: 'price', label: '💰 Report Price' },
  { key: 'grocery', label: '🛒 Grocery List' },
];

export default function ToolsTab({ session, defaultBudget }) {
  const [sub, setSub] = useState('simulator');

  return (
    <div className="tab-panel">
      <div className="tools-sub-nav">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={`tools-sub-btn ${sub === t.key ? 'active' : ''}`}
            onClick={() => setSub(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'simulator' && <SwapSimulatorScreen session={session} />}
      {sub === 'price' && <PriceCorrectionScreen session={session} />}
      {sub === 'grocery' && (
        <div className="insights-screen">
          <p className="insights-title" style={{ marginBottom: 14 }}>Grocery List</p>
          <GroceryListGenerator defaultBudget={defaultBudget} />
        </div>
      )}
    </div>
  );
}

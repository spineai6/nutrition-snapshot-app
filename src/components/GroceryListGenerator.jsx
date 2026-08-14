import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CATEGORY_LABELS = {
  grain: 'Grains',
  pulse: 'Pulses & lentils',
  veg: 'Vegetables',
  dairy: 'Dairy',
  nonveg: 'Meat, fish & eggs',
  fruit: 'Fruit',
  nuts: 'Nuts',
  spice: 'Spices',
  packaged: 'Packaged',
  snack: 'Snacks',
};

const CATEGORY_ORDER = ['grain', 'pulse', 'veg', 'dairy', 'nonveg', 'fruit', 'nuts', 'spice', 'packaged', 'snack'];

const MODES = [
  { value: 'home', label: 'Home cooking', defaultBudget: null },
  { value: 'hostel', label: 'Hostel / mess', defaultBudget: 1500 },
];

export default function GroceryListGenerator({ defaultBudget }) {
  const [mode, setMode] = useState('home');
  const [budget, setBudget] = useState(defaultBudget || 1500);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleModeChange(newMode) {
    setMode(newMode);
    setItems(null);
    if (newMode === 'hostel') setBudget(1500);
    else setBudget(defaultBudget || 1500);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('generate_grocery_list', {
      p_budget_inr: budget,
      p_mode: mode,
    });
    setLoading(false);
    if (rpcError) {
      setError('Could not generate a list right now — try again.');
      return;
    }
    setItems(data || []);
  }

  const grouped = items
    ? CATEGORY_ORDER.map((cat) => ({
        cat,
        rows: items.filter((i) => i.category === cat),
      })).filter((g) => g.rows.length > 0)
    : [];

  const totalSpend = items ? items.reduce((sum, i) => sum + Number(i.subtotal_inr), 0) : 0;
  const totalProtein = items ? items.reduce((sum, i) => sum + Number(i.protein_g), 0) : 0;
  const totalCalories = items ? items.reduce((sum, i) => sum + Number(i.calories_kcal), 0) : 0;

  return (
    <div className="grocery-card">
      <p className="grocery-label">Budget grocery list</p>
      <p className="grocery-desc">
        {mode === 'hostel'
          ? "No-cook supplements to your mess meals — eggs to boil, fruit, milk, roasted chana. Nothing that needs a stove."
          : "Set a budget and get a real shopping list, weighted toward the most nutrient-dense staples per rupee — rounded to sizes you can actually buy (250g, 500g, 1kg packs)."}
        {' '}Regenerate anytime — it's free.
      </p>

      <div className="grocery-mode-toggle">
        {MODES.map((m) => (
          <button
            key={m.value}
            className={`grocery-mode-btn ${mode === m.value ? 'active' : ''}`}
            onClick={() => handleModeChange(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grocery-input-row">
        <span className="grocery-currency">₹</span>
        <input
          type="number"
          min="100"
          step="50"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="grocery-budget-input"
        />
        <button className="grocery-generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : items ? 'Regenerate' : 'Generate list'}
        </button>
      </div>

      {error && <p className="grocery-error">{error}</p>}

      {items && items.length > 0 && (
        <div className="grocery-results">
          <div className="grocery-summary">
            <span>₹{totalSpend.toFixed(0)} of ₹{budget} spent</span>
            <span>{totalProtein.toFixed(0)}g protein · {totalCalories.toFixed(0)} kcal</span>
          </div>

          {grouped.map(({ cat, rows }) => (
            <div key={cat} className="grocery-category">
              <p className="grocery-category-label">{CATEGORY_LABELS[cat] || cat}</p>
              {rows.map((item, idx) => (
                <div key={idx} className="grocery-item-row">
                  <span className="grocery-item-name">{item.food_name}</span>
                  <span className="grocery-item-qty">
                    {item.quantity_grams >= 1000
                      ? `${(item.quantity_grams / 1000).toFixed(1)}kg`
                      : `${item.quantity_grams}g`}
                  </span>
                  <span className="grocery-item-price">₹{Number(item.subtotal_inr).toFixed(0)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <p className="grocery-empty">Budget too low to build a list — try raising it a bit.</p>
      )}
    </div>
  );
}

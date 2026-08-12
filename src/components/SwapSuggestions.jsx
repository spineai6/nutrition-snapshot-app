import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SwapSuggestions({ mealId }) {
  const [swaps, setSwaps] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (swaps !== null) return; // already fetched once, don't refetch

    setLoading(true);
    const { data, error } = await supabase.rpc('get_meal_swaps', { p_meal_id: mealId });
    setSwaps(error ? [] : data || []);
    setLoading(false);
  }

  return (
    <div className="swap-suggestions">
      <button className="swap-toggle" onClick={handleToggle}>
        {open ? 'Hide swap ideas ▲' : '💡 See cheaper swaps ▼'}
      </button>

      {open && (
        <div className="swap-list">
          {loading && <p className="swap-loading">Checking for swaps...</p>}

          {!loading && swaps && swaps.length === 0 && (
            <p className="swap-empty">No cheaper swap found for this meal yet.</p>
          )}

          {!loading &&
            swaps &&
            swaps.map((s) => (
              <div key={s.meal_item_id + s.to_food_name} className={`swap-item ${s.gap_closing ? 'gap-closing' : ''}`}>
                <div className="swap-item-row">
                  <span className="swap-from">{s.from_food_name}</span>
                  <span className="swap-arrow">→</span>
                  <span className="swap-to">{s.to_food_name}</span>
                  {s.gap_closing && <span className="swap-gap-badge">🌱 closes a gap</span>}
                </div>
                <div className="swap-item-meta">
                  <span className="swap-nutrient">
                    matched on {formatNutrient(s.primary_nutrient_match)}
                  </span>
                  <span className="swap-savings">
                    ₹{s.from_price_inr} → ₹{s.to_price_inr} (save ₹{s.savings_inr})
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function formatNutrient(key) {
  const map = {
    protein_g: 'protein',
    calcium_mg: 'calcium',
    iron_mg: 'iron',
    fiber_g: 'fiber',
    carbs_g: 'carbs',
    fat_g: 'fat',
  };
  return map[key] || key;
}

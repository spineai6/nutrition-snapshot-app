import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ManualLogForm({ userId, onLogged, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState([]); // [{...nutrition_db row, grams}]
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSearch(e) {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const { data, error } = await supabase
      .from('nutrition_db')
      .select('id, food_name, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, serving_grams')
      .textSearch('food_name', q, { type: 'websearch' })
      .limit(8);

    if (!error && data) {
      setResults(data);
    } else {
      // fallback to ilike if text search finds nothing (short/partial queries)
      const { data: fallback } = await supabase
        .from('nutrition_db')
        .select('id, food_name, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, serving_grams')
        .ilike('food_name', `%${q}%`)
        .limit(8);
      setResults(fallback || []);
    }
  }

  function addItem(food) {
    setPicked((prev) => [...prev, { ...food, grams: food.serving_grams || 100 }]);
    setQuery('');
    setResults([]);
  }

  function updateGrams(idx, grams) {
    setPicked((prev) => prev.map((p, i) => (i === idx ? { ...p, grams: Number(grams) } : p)));
  }

  function removeItem(idx) {
    setPicked((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (picked.length === 0) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const scaled = picked.map((p) => {
        const scale = p.grams / (p.serving_grams || 100);
        return {
          nutrition_db_id: p.id,
          identified_name: p.food_name,
          quantity_grams: p.grams,
          match_confidence: 1,
          calories_kcal: round2(p.calories_kcal * scale),
          protein_g: round2(p.protein_g * scale),
          carbs_g: round2(p.carbs_g * scale),
          fat_g: round2(p.fat_g * scale),
          fiber_g: round2(p.fiber_g * scale),
        };
      });

      const totals = scaled.reduce(
        (acc, i) => ({
          calories_kcal: acc.calories_kcal + i.calories_kcal,
          protein_g: acc.protein_g + i.protein_g,
          carbs_g: acc.carbs_g + i.carbs_g,
          fat_g: acc.fat_g + i.fat_g,
          fiber_g: acc.fiber_g + i.fiber_g,
        }),
        { calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
      );

      const { data: meal, error: mealErr } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          source: 'manual',
          total_calories_kcal: round2(totals.calories_kcal),
          total_protein_g: round2(totals.protein_g),
          total_carbs_g: round2(totals.carbs_g),
          total_fat_g: round2(totals.fat_g),
          total_fiber_g: round2(totals.fiber_g),
        })
        .select()
        .single();
      if (mealErr) throw mealErr;

      const itemsToInsert = scaled.map((i) => ({ ...i, meal_id: meal.id }));
      const { error: itemsErr } = await supabase.from('meal_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      onLogged?.({ meal, items: scaled });
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'Could not save this meal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="manual-log-overlay">
      <div className="manual-log-card">
        <div className="manual-log-head">
          <h3>Log a meal manually</h3>
          <button className="manual-log-close" onClick={onClose}>✕</button>
        </div>

        <input
          type="text"
          placeholder="Search food (e.g. dal, roti, paneer)"
          value={query}
          onChange={handleSearch}
        />

        {results.length > 0 && (
          <ul className="manual-log-results">
            {results.map((food) => (
              <li key={food.id} onClick={() => addItem(food)}>
                {food.food_name} <span>{food.calories_kcal} kcal / {food.serving_grams}g</span>
              </li>
            ))}
          </ul>
        )}

        {picked.length > 0 && (
          <div className="manual-log-picked">
            {picked.map((p, i) => (
              <div key={i} className="manual-log-picked-row">
                <span>{p.food_name}</span>
                <input
                  type="number"
                  value={p.grams}
                  onChange={(e) => updateGrams(i, e.target.value)}
                  min={1}
                />
                <span className="unit">g</span>
                <button onClick={() => removeItem(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {errorMsg && <p className="manual-log-error">{errorMsg}</p>}

        <button
          className="manual-log-save"
          onClick={handleSave}
          disabled={picked.length === 0 || saving}
        >
          {saving ? 'Saving...' : `Log ${picked.length || ''} item${picked.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

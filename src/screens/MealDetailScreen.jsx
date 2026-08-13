import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { computeMicroTargets } from '../lib/microCalc';

function pct(value, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((Number(value) / Number(target)) * 100));
}

export default function MealDetailScreen({ mealId, session, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [targets, setTargets] = useState({});
  const [microTargets, setMicroTargets] = useState({});
  const [todayMacros, setTodayMacros] = useState(null);
  const [todayMicros, setTodayMicros] = useState(null);

  useEffect(() => {
    async function load() {
      const userId = session.user.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, gender, calorie_target_kcal, protein_target_g, carb_target_g, fat_target_g')
        .eq('id', userId)
        .single();

      setIsPaid(profile?.tier === 'paid');
      setTargets({
        calories: profile?.calorie_target_kcal,
        protein: profile?.protein_target_g,
        carbs: profile?.carb_target_g,
        fat: profile?.fat_target_g,
      });
      setMicroTargets(computeMicroTargets({ gender: profile?.gender }));

      const [breakdownRes, macroRes, microRes] = await Promise.all([
        supabase.rpc('get_meal_nutrient_breakdown', { p_meal_id: mealId }),
        supabase.rpc('get_todays_macro_totals', { p_user_id: userId }),
        supabase.rpc('get_todays_micro_totals', { p_user_id: userId }),
      ]);
      if (breakdownRes.data) setItems(breakdownRes.data);
      if (macroRes.data?.[0]) setTodayMacros(macroRes.data[0]);
      if (microRes.data?.[0]) setTodayMicros(microRes.data[0]);
      setLoading(false);
    }
    load();
  }, [mealId, session]);

  if (loading) {
    return (
      <div className="insights-screen">
        <div className="insights-header">
          <span className="insights-title">Meal breakdown</span>
          <button className="side-menu-close" onClick={onClose}>✕</button>
        </div>
        <p className="insights-loading">Breaking this meal down...</p>
      </div>
    );
  }

  const totals = items.reduce(
    (acc, i) => ({
      calories: acc.calories + Number(i.calories_kcal || 0),
      protein: acc.protein + Number(i.protein_g || 0),
      carbs: acc.carbs + Number(i.carbs_g || 0),
      fat: acc.fat + Number(i.fat_g || 0),
      fiber: acc.fiber + Number(i.fiber_g || 0),
      iron: acc.iron + Number(i.iron_mg || 0),
      calcium: acc.calcium + Number(i.calcium_mg || 0),
      vitC: acc.vitC + Number(i.vitamin_c_mg || 0),
      b12: acc.b12 + Number(i.vitamin_b12_ug || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, calcium: 0, vitC: 0, b12: 0 }
  );

  const bestValueItem = items.find((i) => i.is_best_value);

  return (
    <div className="insights-screen">
      <div className="insights-header">
        <span className="insights-title">Meal breakdown</span>
        <button className="side-menu-close" onClick={onClose}>✕</button>
      </div>

      {/* Macro summary — always visible */}
      <div className="meal-detail-macros">
        <div className="meal-detail-macro-row">
          <span>Calories</span><strong>{Math.round(totals.calories)} kcal</strong>
        </div>
        <div className="meal-detail-macro-row">
          <span>Protein</span><strong>{totals.protein.toFixed(1)}g</strong>
        </div>
        <div className="meal-detail-macro-row">
          <span>Carbs</span><strong>{totals.carbs.toFixed(1)}g</strong>
        </div>
        <div className="meal-detail-macro-row">
          <span>Fat</span><strong>{totals.fat.toFixed(1)}g</strong>
        </div>
        <div className="meal-detail-macro-row">
          <span>Fiber</span><strong>{totals.fiber.toFixed(1)}g</strong>
        </div>
      </div>

      {/* Toward today's goal — free, ties directly to their onboarding goal */}
      {todayMacros && targets.calories && (
        <div className="insight-card">
          <p className="insight-card-tag">🎯 Toward today's goal</p>
          <p className="insight-headline">
            This meal covers {pct(totals.calories, targets.calories)}% of your calorie target and{' '}
            {pct(totals.protein, targets.protein)}% of your protein target for the day.
          </p>
          <p className="insight-meta">
            So far today: {Math.round(todayMacros.calories_kcal)}/{targets.calories} kcal · {Math.round(todayMacros.protein_g)}/{targets.protein}g protein
          </p>
        </div>
      )}

      {/* Best value food — the headline conversion moment */}
      {bestValueItem ? (
        <div className="insight-card value-card">
          <p className="insight-card-tag">🏆 Best value in this meal</p>
          <p className="insight-headline">
            {bestValueItem.food_name} did the most nutritional work per rupee in this meal.
          </p>
        </div>
      ) : (
        <div className="insights-empty">
          <p>Not enough price data on these items yet to rank value — log more to build this up.</p>
        </div>
      )}

      {/* Per-item table — macros free, micros paid */}
      <div className="meal-detail-table-card">
        <p className="insight-card-tag">Full ingredient breakdown</p>
        <div className="meal-detail-table">
          <div className="meal-detail-table-head">
            <span>Food</span><span>Cal</span><span>P</span><span>C</span><span>F</span>
          </div>
          {items.map((i) => (
            <div key={i.meal_item_id} className={`meal-detail-table-row ${i.is_best_value ? 'best' : ''}`}>
              <span className="meal-detail-food-name">
                {i.is_best_value && '🏆 '}{i.food_name} <em>({i.quantity_grams}g)</em>
              </span>
              <span>{Math.round(i.calories_kcal || 0)}</span>
              <span>{Number(i.protein_g || 0).toFixed(0)}g</span>
              <span>{Number(i.carbs_g || 0).toFixed(0)}g</span>
              <span>{Number(i.fat_g || 0).toFixed(0)}g</span>
            </div>
          ))}
        </div>
      </div>

      {/* Micro breakdown — paid feature, real upsell moment */}
      {isPaid ? (
        <div className="meal-detail-table-card">
          <p className="insight-card-tag">Micro-nutrients in this meal</p>
          <div className="meal-detail-table micro">
            <div className="meal-detail-table-head">
              <span>Food</span><span>Iron</span><span>Calcium</span><span>Vit C</span><span>B12</span>
            </div>
            {items.map((i) => (
              <div key={i.meal_item_id} className="meal-detail-table-row">
                <span className="meal-detail-food-name">{i.food_name}</span>
                <span>{i.iron_mg}mg</span>
                <span>{i.calcium_mg}mg</span>
                <span>{i.vitamin_c_mg}mg</span>
                <span>{i.vitamin_b12_ug}µg</span>
              </div>
            ))}
          </div>
          {todayMicros && (
            <p className="insight-meta">
              This meal's iron ({totals.iron.toFixed(1)}mg) is {pct(totals.iron, microTargets.iron_mg)}% of your daily iron target.
            </p>
          )}
        </div>
      ) : (
        <div className="meal-detail-locked">
          <p className="insight-card-tag">🔒 Micro-nutrients in this meal</p>
          <p className="micro-trend-locked-desc">
            See exactly how much iron, calcium, vitamin C & B12 each food in this meal gave you —
            and how much closer it got you to today's target. Premium.
          </p>
          <button className="micro-locked-btn" onClick={onClose}>Unlock with Premium</button>
        </div>
      )}

      <p className="insights-disclaimer">
        Nutrient values from your logged food — general reference figures, not medical advice.
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SwapSimulatorScreen({ session, onClose }) {
  const [catalog, setCatalog] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState('');
  const [frequency, setFrequency] = useState(3);
  const [grams, setGrams] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('diet_preference')
        .eq('id', session.user.id)
        .single();
      const { data } = await supabase.rpc('get_swap_catalog', {
        p_diet_preference: profile?.diet_preference || 'none',
      });
      setCatalog(data || []);
      setLoading(false);
    }
    load();
  }, [session]);

  const swap = selectedIdx !== '' ? catalog[selectedIdx] : null;

  const monthlyOccurrences = frequency * (30 / 7);
  const monthlySavings = swap
    ? ((swap.from_price_per_100g - swap.to_price_per_100g) / 100) * grams * monthlyOccurrences
    : 0;
  const proteinDelta = swap
    ? ((swap.to_protein_per_100g - swap.from_protein_per_100g) / 100) * grams * monthlyOccurrences
    : 0;
  const ironDelta = swap
    ? ((swap.to_iron_per_100g - swap.from_iron_per_100g) / 100) * grams * monthlyOccurrences
    : 0;
  const calciumDelta = swap
    ? ((swap.to_calcium_per_100g - swap.from_calcium_per_100g) / 100) * grams * monthlyOccurrences
    : 0;
  const omega3Delta = swap
    ? ((swap.to_omega3_per_100g - swap.from_omega3_per_100g) / 100) * grams * monthlyOccurrences
    : 0;

  return (
    <div className="insights-screen">
      <div className="insights-header">
        <span className="insights-title">Swap Simulator</span>
        <button className="side-menu-close" onClick={onClose}>✕</button>
      </div>
      <p className="insights-sub">Pick a swap, tell us how often you'd actually eat it — see the real monthly impact before you commit.</p>

      {loading ? (
        <p className="insights-loading">Loading swap catalog...</p>
      ) : (
        <>
          <div className="simulator-controls">
            <label className="simulator-label">
              What would you swap?
              <select
                className="simulator-select"
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(e.target.value)}
              >
                <option value="">Choose a swap...</option>
                {catalog.map((s, i) => (
                  <option key={i} value={i}>{s.from_name} → {s.to_name}</option>
                ))}
              </select>
            </label>

            <div className="simulator-row">
              <label className="simulator-label">
                Times per week
                <input
                  type="number" min="1" max="21" value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="simulator-input"
                />
              </label>
              <label className="simulator-label">
                Grams per serving
                <input
                  type="number" min="10" step="10" value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                  className="simulator-input"
                />
              </label>
            </div>
          </div>

          {swap && (
            <div className="insight-card simulator-result">
              <p className="insight-card-tag">If you make this swap {frequency}x/week</p>
              <p className="insight-headline">
                Swapping {grams}g of {swap.from_name} for {swap.to_name}, {frequency} times a week, would save you
                about ₹{Math.round(monthlySavings)} a month.
              </p>
              <div className="simulator-nutrient-grid">
                <div className={`simulator-nutrient ${proteinDelta >= 0 ? 'up' : 'down'}`}>
                  <span>Protein</span><strong>{proteinDelta >= 0 ? '+' : ''}{proteinDelta.toFixed(0)}g/mo</strong>
                </div>
                <div className={`simulator-nutrient ${ironDelta >= 0 ? 'up' : 'down'}`}>
                  <span>Iron</span><strong>{ironDelta >= 0 ? '+' : ''}{ironDelta.toFixed(0)}mg/mo</strong>
                </div>
                <div className={`simulator-nutrient ${calciumDelta >= 0 ? 'up' : 'down'}`}>
                  <span>Calcium</span><strong>{calciumDelta >= 0 ? '+' : ''}{calciumDelta.toFixed(0)}mg/mo</strong>
                </div>
                <div className={`simulator-nutrient ${omega3Delta >= 0 ? 'up' : 'down'}`}>
                  <span>Omega-3</span><strong>{omega3Delta >= 0 ? '+' : ''}{(omega3Delta / 1000).toFixed(1)}g/mo</strong>
                </div>
              </div>
              <p className="insight-meta">
                Based on current prices and typical nutrient values — real results depend on your actual local prices.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

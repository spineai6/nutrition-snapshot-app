import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PriceCorrectionScreen({ session, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);

  const [priceMode, setPriceMode] = useState('per100g'); // 'per100g' | 'perPack'
  const [priceInput, setPriceInput] = useState('');
  const [packGrams, setPackGrams] = useState('');
  const [area, setArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const { data, error: searchError } = await supabase
      .from('nutrition_db')
      .select('id, food_name')
      .textSearch('food_name', q, { type: 'websearch' })
      .limit(8);

    if (!searchError && data?.length) {
      setResults(data);
    } else {
      const { data: fallback } = await supabase
        .from('nutrition_db')
        .select('id, food_name')
        .ilike('food_name', `%${q}%`)
        .limit(8);
      setResults(fallback || []);
    }
  }

  async function selectFood(food) {
    setSelected(food);
    setQuery('');
    setResults([]);
    setSubmitted(false);
    setError('');
    const { data } = await supabase.rpc('get_community_price_summary', { p_nutrition_db_id: food.id });
    setSummary(data?.[0] || null);
  }

  function computePricePer100g() {
    const price = Number(priceInput);
    if (!price) return null;
    if (priceMode === 'per100g') return price;
    const grams = Number(packGrams);
    if (!grams) return null;
    return (price / grams) * 100;
  }

  async function handleSubmit() {
    const pricePer100g = computePricePer100g();
    if (!pricePer100g || pricePer100g <= 0) {
      setError('Enter a valid price.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: insertError } = await supabase.from('price_corrections').insert({
      nutrition_db_id: selected.id,
      user_id: session.user.id,
      reported_price_inr_per_100g: Math.round(pricePer100g * 100) / 100,
      area: area.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError('Could not submit — try again.');
      return;
    }
    setSubmitted(true);
    setPriceInput('');
    setPackGrams('');
    const { data } = await supabase.rpc('get_community_price_summary', { p_nutrition_db_id: selected.id });
    setSummary(data?.[0] || null);
  }

  return (
    <div className="insights-screen">
      <div className="insights-header">
        <span className="insights-title">Report a price</span>
        <button className="side-menu-close" onClick={onClose}>✕</button>
      </div>
      <p className="insights-sub">
        Our prices are regional estimates. Tell us what you actually paid — it helps everyone get more accurate numbers.
      </p>

      {!selected && (
        <div className="simulator-controls">
          <label className="simulator-label">
            Search for a food
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="e.g. toor dal, milk, onion"
              className="price-correction-search-input"
            />
          </label>
          {results.length > 0 && (
            <ul className="manual-log-results">
              {results.map((f) => (
                <li key={f.id} onClick={() => selectFood(f)}>{f.food_name}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="insight-card price-correction-card">
          <p className="insight-card-tag">{selected.food_name}</p>

          {summary && (
            <div className="price-correction-summary">
              <div className="price-correction-summary-row">
                <span>Our estimate</span>
                <strong>₹{summary.official_price_inr_per_100g}/100g</strong>
              </div>
              {summary.submission_count > 0 ? (
                <div className="price-correction-summary-row community">
                  <span>Community reported ({summary.submission_count})</span>
                  <strong>₹{summary.community_avg_price_inr_per_100g}/100g</strong>
                </div>
              ) : (
                <p className="insight-meta">No community reports yet — be the first for this food.</p>
              )}
            </div>
          )}

          {submitted ? (
            <p className="price-correction-thanks">Thanks — that's been added to the community average.</p>
          ) : (
            <>
              <div className="grocery-mode-toggle">
                <button
                  className={`grocery-mode-btn ${priceMode === 'per100g' ? 'active' : ''}`}
                  onClick={() => setPriceMode('per100g')}
                >
                  Price per 100g
                </button>
                <button
                  className={`grocery-mode-btn ${priceMode === 'perPack' ? 'active' : ''}`}
                  onClick={() => setPriceMode('perPack')}
                >
                  Price for a pack
                </button>
              </div>

              <div className="simulator-row">
                <label className="simulator-label">
                  {priceMode === 'per100g' ? '₹ per 100g' : '₹ you paid'}
                  <input
                    type="number" min="0.5" step="0.5" value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="simulator-input"
                  />
                </label>
                {priceMode === 'perPack' && (
                  <label className="simulator-label">
                    Pack size (g)
                    <input
                      type="number" min="10" step="10" value={packGrams}
                      onChange={(e) => setPackGrams(e.target.value)}
                      className="simulator-input"
                    />
                  </label>
                )}
              </div>

              <label className="simulator-label" style={{ marginTop: 10 }}>
                Area / city (optional)
                <input
                  type="text" value={area} onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Nashik" className="simulator-input"
                />
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button className="manual-log-save" style={{ marginTop: 12 }} disabled={saving} onClick={handleSubmit}>
                {saving ? 'Submitting...' : 'Submit price'}
              </button>
            </>
          )}

          <button className="onboard-back" style={{ marginTop: 10 }} onClick={() => { setSelected(null); setSummary(null); }}>
            Search another food
          </button>
        </div>
      )}
    </div>
  );
}

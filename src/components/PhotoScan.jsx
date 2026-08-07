import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PhotoScan({ userId, onLogged }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | analyzing | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setErrorMsg('');
    setResult(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('meal-photos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;

      setStatus('analyzing');
      const { data, error: fnErr } = await supabase.functions.invoke('analyze-meal', {
        body: { storage_path: path },
      });

      if (fnErr) {
        let message = fnErr.message || 'Something went wrong analyzing your meal.';
        try {
          const ctx = fnErr.context;
          if (ctx) {
            const parsedBody = await ctx.json();
            if (parsedBody?.message) message = parsedBody.message;
          }
        } catch {
          /* fall back to default message */
        }
        throw new Error(message);
      }

      setResult(data);
      setStatus('done');
      onLogged?.(data);
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="photo-scan">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="meal-photo-input"
      />

      <label
        htmlFor="meal-photo-input"
        className="photo-scan-trigger"
        style={{ cursor: status === 'uploading' || status === 'analyzing' ? 'wait' : 'pointer' }}
      >
        {status === 'idle' && '📸 Snap your meal'}
        {status === 'uploading' && 'Uploading photo...'}
        {status === 'analyzing' && 'Reading your plate...'}
        {status === 'done' && '📸 Scan another meal'}
        {status === 'error' && 'Try again'}
      </label>

      {status === 'error' && (
        <p className="photo-scan-error" role="alert">
          {errorMsg}
        </p>
      )}

      {status === 'done' && result && (
        <div className="photo-scan-result">
          <h4>Meal logged</h4>
          <div className="photo-scan-totals">
            <span>{result.meal.total_calories_kcal} kcal</span>
            <span>{result.meal.total_protein_g}g protein</span>
            <span>{result.meal.total_carbs_g}g carbs</span>
            <span>{result.meal.total_fat_g}g fat</span>
            <span>₹{result.meal.total_cost_inr}</span>
          </div>
          <ul className="photo-scan-items">
            {result.items.map((item, i) => (
              <li key={i}>
                {item.identified_name}
                {item.nutrition_db_id ? (
                  <span className="matched"> — matched ({item.quantity_grams}g)</span>
                ) : (
                  <span className="unmatched"> — not in database, log manually to correct</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';

export default function BarcodeScan({ userId, onLogged }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | looking-up | found | not-found | error
  const [product, setProduct] = useState(null);
  const [grams, setGrams] = useState(100);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const scannerRef = useRef(null);
  const containerId = 'barcode-scanner-region';

  useEffect(() => {
    return () => {
      // Clean up camera on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScan() {
    setStatus('scanning');
    setErrorMsg('');
    setProduct(null);

    try {
      const html5Qrcode = new Html5Qrcode(containerId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          // Got a barcode — stop the camera immediately, then look it up
          await html5Qrcode.stop().catch(() => {});
          scannerRef.current = null;
          lookupBarcode(decodedText);
        },
        () => {
          /* per-frame scan failure, ignore — this fires constantly while aiming the camera */
        }
      );
    } catch (err) {
      setErrorMsg('Could not access the camera. Check camera permissions and try again.');
      setStatus('error');
    }
  }

  function stopScan() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setStatus('idle');
  }

  async function lookupBarcode(barcode) {
    setStatus('looking-up');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('lookup-barcode', {
        body: { barcode },
      });

      if (fnErr) {
        let message = fnErr.message || 'Lookup failed.';
        try {
          const ctx = fnErr.context;
          if (ctx) {
            const parsedBody = await ctx.json();
            if (parsedBody?.message) message = parsedBody.message;
          }
        } catch {
          /* fall back to default */
        }
        if (message.toLowerCase().includes("isn't in the database")) {
          setStatus('not-found');
          setErrorMsg(message);
          return;
        }
        throw new Error(message);
      }

      setProduct(data.product);
      setGrams(data.product.serving_grams || 100);
      setStatus('found');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong looking up this product.');
      setStatus('error');
    }
  }

  async function handleLogProduct() {
    if (!product) return;
    setSaving(true);
    try {
      const scale = grams / (product.serving_grams || 100);
      const round2 = (n) => (n === null || n === undefined ? null : Math.round((n + Number.EPSILON) * 100) / 100);

      const item = {
        nutrition_db_id: product.nutrition_db_id,
        identified_name: product.food_name,
        quantity_grams: grams,
        match_confidence: 1,
        calories_kcal: round2(product.calories_kcal * scale),
        protein_g: round2(product.protein_g * scale),
        carbs_g: round2(product.carbs_g * scale),
        fat_g: round2(product.fat_g * scale),
        fiber_g: round2(product.fiber_g * scale),
        cost_inr: product.price_inr_per_100g ? round2((product.price_inr_per_100g * grams) / 100) : null,
      };

      const { data: meal, error: mealErr } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          source: 'manual',
          total_calories_kcal: item.calories_kcal,
          total_protein_g: item.protein_g,
          total_carbs_g: item.carbs_g,
          total_fat_g: item.fat_g,
          total_fiber_g: item.fiber_g,
          total_cost_inr: item.cost_inr,
        })
        .select()
        .single();
      if (mealErr) throw mealErr;

      const { error: itemErr } = await supabase.from('meal_items').insert({ ...item, meal_id: meal.id });
      if (itemErr) throw itemErr;

      onLogged?.({ meal, items: [item] });
      setStatus('idle');
      setProduct(null);
    } catch (err) {
      setErrorMsg(err.message || 'Could not log this product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="barcode-scan">
      {status === 'idle' && (
        <button className="barcode-scan-trigger" onClick={startScan}>
          🔖 Scan a barcode
        </button>
      )}

      {status === 'scanning' && (
        <div className="barcode-scan-camera">
          <div id={containerId} />
          <button className="barcode-scan-cancel" onClick={stopScan}>Cancel</button>
        </div>
      )}

      {status === 'looking-up' && <p className="barcode-scan-status">Looking up product...</p>}

      {status === 'not-found' && (
        <div className="barcode-scan-result">
          <p className="barcode-not-found">{errorMsg}</p>
          <button className="barcode-scan-trigger" onClick={() => setStatus('idle')}>Try another / log manually</button>
        </div>
      )}

      {status === 'error' && (
        <div className="barcode-scan-result">
          <p className="barcode-scan-error">{errorMsg}</p>
          <button className="barcode-scan-trigger" onClick={() => setStatus('idle')}>Try again</button>
        </div>
      )}

      {status === 'found' && product && (
        <div className="barcode-scan-result">
          <h4>{product.food_name}</h4>
          <div className="barcode-grams-input">
            <label>Quantity (g)</label>
            <input type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value))} min={1} />
          </div>
          <div className="photo-scan-totals">
            <span>{Math.round((product.calories_kcal || 0) * (grams / (product.serving_grams || 100)))} kcal</span>
            <span>{Math.round((product.protein_g || 0) * (grams / (product.serving_grams || 100)))}g protein</span>
            <span>{Math.round((product.carbs_g || 0) * (grams / (product.serving_grams || 100)))}g carbs</span>
            <span>{Math.round((product.fat_g || 0) * (grams / (product.serving_grams || 100)))}g fat</span>
          </div>
          {product.price_inr_per_100g == null && (
            <p className="barcode-no-price">No price data for this product yet — won't count toward swap suggestions.</p>
          )}
          <button className="barcode-log-btn" onClick={handleLogProduct} disabled={saving}>
            {saving ? 'Logging...' : 'Log this meal'}
          </button>
        </div>
      )}
    </div>
  );
}

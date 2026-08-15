import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabaseClient';

const APP_URL = 'nutrition-snapshot-app.vercel.app';

export default function ShareCardScreen({ session, onClose }) {
  const cardRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    async function load() {
      const userId = session.user.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      const [savingsRes, signalRes, valueFoodRes] = await Promise.all([
        supabase.rpc('get_weekly_savings_teaser', { p_user_id: userId }),
        supabase.rpc('get_weekly_signal_layer', { p_user_id: userId }),
        supabase.rpc('get_weekly_value_food', { p_user_id: userId }),
      ]);

      setData({
        isPaid: profile?.tier === 'paid',
        savings: Number(savingsRes.data || 0),
        diversity: signalRes.data?.[0]?.diversity_count || 0,
        daysLogged: signalRes.data?.[0]?.days_logged || 0,
        valueFood: valueFoodRes.data?.[0] || null,
      });
      setLoading(false);
    }
    load();
  }, [session]);

  async function handleShare() {
    if (!cardRef.current) return;
    setExporting(true);
    setExportError('');
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#0B3D3B' });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setExportError('Could not generate image — try again.');
          setExporting(false);
          return;
        }
        const file = new File([blob], 'my-nutrition-week.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My week with Nutrition Snapshot',
              text: 'Check out my week — tracking nutrition and grocery spend together.',
            });
          } catch (err) {
            // user cancelled share sheet — not an error
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'my-nutrition-week.png';
          a.click();
          URL.revokeObjectURL(url);
        }
        setExporting(false);
      }, 'image/png');
    } catch (err) {
      setExportError('Could not generate image — try again.');
      setExporting(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="insights-screen">
        <div className="insights-header">
          <span className="insights-title">Share your week</span>
          <button className="side-menu-close" onClick={onClose}>✕</button>
        </div>
        <p className="insights-loading">Putting your week together...</p>
      </div>
    );
  }

  const headline = `₹${Math.round(data.savings)}`;
  const headlineLabel = 'potential savings this week';

  return (
    <div className="insights-screen">
      <div className="insights-header">
        <span className="insights-title">Share your week</span>
        <button className="side-menu-close" onClick={onClose}>✕</button>
      </div>
      <p className="insights-sub">A real snapshot of your week — ready to send to family or friends.</p>

      <div className="share-card-preview-wrap">
        <div ref={cardRef} className="share-card">
          <div className="share-card-brand">
            <span className="share-card-dot" />
            <span>Nutrition Snapshot</span>
          </div>

          <p className="share-card-headline-label">{headlineLabel}</p>
          <p className="share-card-headline">{headline}</p>

          <div className="share-card-stats">
            <div className="share-card-stat">
              <span className="share-card-stat-value">{data.daysLogged}</span>
              <span className="share-card-stat-label">days logged</span>
            </div>
            <div className="share-card-stat">
              <span className="share-card-stat-value">{data.diversity}</span>
              <span className="share-card-stat-label">foods eaten</span>
            </div>
          </div>

          {data.valueFood && (
            <div className="share-card-value-food">
              🏆 {data.valueFood.food_name} — {data.valueFood.protein_per_rupee}g protein per ₹
            </div>
          )}

          <div className="share-card-footer">
            <span>Track your grocery spend & nutrition — free</span>
            <span className="share-card-url">{APP_URL}</span>
          </div>
        </div>
      </div>

      {exportError && <p className="auth-error">{exportError}</p>}

      <button className="manual-log-save" style={{ marginTop: 16 }} disabled={exporting} onClick={handleShare}>
        {exporting ? 'Preparing image...' : '📤 Share this card'}
      </button>
    </div>
  );
}

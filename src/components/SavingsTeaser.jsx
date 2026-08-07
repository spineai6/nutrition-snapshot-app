export default function SavingsTeaser({ amount }) {
  return (
    <div className="teaser-card">
      <p className="teaser-label">Estimated weekly savings potential</p>
      <p className="teaser-amount">₹{amount ?? '—'}</p>
      <p className="teaser-cta">Unlock your full plan to act on this</p>
    </div>
  );
}

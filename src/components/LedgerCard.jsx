export default function LedgerCard({ ledger }) {
  if (!ledger) return null;

  if (ledger.status === 'preview') {
    return (
      <div className="ledger-card preview">
        <p className="ledger-label">Your free AI Weekly Plan</p>
        <p className="ledger-amount">₹{ledger.savings_inr} saved this week</p>
        <p className="ledger-sub">Real swaps, generated just for you.</p>
      </div>
    );
  }

  if (ledger.status === 'frozen') {
    return (
      <div className="ledger-card frozen">
        <p className="ledger-label">You saved ₹{ledger.savings_inr} last week.</p>
        <p className="ledger-sub">Upgrade to keep this going.</p>
        <button className="ledger-upgrade-btn">Upgrade to Premium</button>
      </div>
    );
  }

  return (
    <div className="ledger-card active">
      <p className="ledger-label">This week's savings</p>
      <p className="ledger-amount">₹{ledger.savings_inr}</p>
    </div>
  );
}

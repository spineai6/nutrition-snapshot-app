import LedgerCard from './LedgerCard';
import SavingsTeaser from './SavingsTeaser';
import SignalLayer from './SignalLayer';
import PriceTrend from './PriceTrend';
import MicroTrend from './MicroTrend';

export default function MoreTab({
  profile, teaser, currentLedger, signalLayer, priceTrend, microTrend, isPaid, microTargets,
  onOpenAssistant, onOpenShareCard, onOpenHistory,
}) {
  return (
    <div className="tab-panel">
      <div className="more-launchers">
        <button className="side-menu-assistant-btn" onClick={onOpenAssistant}>🎙️ Ask Snapshot</button>
        <button className="side-menu-share-btn" onClick={onOpenShareCard}>📤 Share my week</button>
        <button className="side-menu-history-btn" onClick={onOpenHistory}>📖 Meal history</button>
      </div>

      {currentLedger && currentLedger.status !== 'preview' && <LedgerCard ledger={currentLedger} />}
      {currentLedger?.status === 'preview' && <LedgerCard ledger={currentLedger} />}
      {profile?.tier === 'free' && <SavingsTeaser amount={teaser} />}

      <SignalLayer data={signalLayer} />
      <PriceTrend data={priceTrend} />
      <MicroTrend isPaid={isPaid} data={microTrend} targets={microTargets} onUpgradeClick={() => {}} />
    </div>
  );
}

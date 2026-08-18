export default function SideMenu({ open, onClose, profile, onEditGoals, onLogout }) {
  if (!open) return null;

  return (
    <div className="side-menu-overlay" onClick={onClose}>
      <div className="side-menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="side-menu-head">
          <span className="side-menu-title">Account</span>
          <button className="side-menu-close" onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <div className="side-menu-body">
          <div className="side-menu-account">
            <p className="side-menu-account-email">{profile?.email}</p>
            <span className="dashboard-tier">{profile?.tier === 'paid' ? 'Premium' : 'Free'}</span>
          </div>
          <button className="side-menu-edit-goals" onClick={onEditGoals}>Edit weight, age & goal</button>
          <button className="side-menu-logout" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
}

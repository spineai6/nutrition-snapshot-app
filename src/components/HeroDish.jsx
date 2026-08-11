export default function HeroDish() {
  return (
    <svg
      className="hero-dish"
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* thali plate */}
      <circle cx="230" cy="200" r="170" fill="var(--paper)" opacity="0.15" />
      <circle cx="230" cy="200" r="170" fill="none" stroke="var(--paper)" strokeWidth="3" opacity="0.35" />

      {/* rice bowl */}
      <circle cx="180" cy="150" r="46" fill="var(--paper)" opacity="0.9" />
      <circle cx="180" cy="150" r="46" fill="var(--mustard-lime)" opacity="0.55" />

      {/* dal bowl */}
      <circle cx="300" cy="140" r="38" fill="var(--paper)" opacity="0.9" />
      <circle cx="300" cy="140" r="38" fill="var(--turmeric)" opacity="0.6" />

      {/* sabzi bowl */}
      <circle cx="310" cy="240" r="34" fill="var(--paper)" opacity="0.9" />
      <circle cx="310" cy="240" r="34" fill="var(--teal-2)" opacity="0.5" />

      {/* chutney dot */}
      <circle cx="190" cy="255" r="20" fill="var(--paper)" opacity="0.9" />
      <circle cx="190" cy="255" r="20" fill="var(--chili)" opacity="0.55" />

      {/* roti */}
      <circle cx="245" cy="200" r="24" fill="var(--paper)" opacity="0.5" />
    </svg>
  );
}

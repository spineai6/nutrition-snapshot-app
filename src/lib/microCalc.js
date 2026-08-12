// General adult RDA reference values (ICMR-style, India-adjusted for iron
// bioavailability). Not personalized beyond gender — not medical advice.
export function computeMicroTargets({ gender }) {
  const ironMg = gender === 'female' ? 29 : gender === 'male' ? 19 : 24;
  return {
    iron_mg: ironMg,
    calcium_mg: 1000,
    vitamin_c_mg: 65,
    vitamin_b12_ug: 2.4,
  };
}

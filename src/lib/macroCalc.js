const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Goal-aware macro split: protein set per kg bodyweight (protects muscle during
// a cut, supports growth during a bulk), fat as a % of calories, carbs fill the rest.
const GOAL_PROFILES = {
  lose_weight: { calorieAdjust: -500, proteinPerKg: 1.8, fatPct: 0.25 },
  maintain: { calorieAdjust: 0, proteinPerKg: 1.6, fatPct: 0.3 },
  gain_muscle: { calorieAdjust: 300, proteinPerKg: 2.0, fatPct: 0.25 },
};

const MIN_SAFE_CALORIES = 1200;

export function computeMacroTargets({ age, gender, weightKg, heightCm, activityLevel, goal }) {
  // Mifflin-St Jeor BMR
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') bmr += 5;
  else if (gender === 'female') bmr -= 161;
  else bmr -= 78; // midpoint offset for 'other'

  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.375);
  const goalProfile = GOAL_PROFILES[goal] || GOAL_PROFILES.maintain;

  let calories = Math.round(tdee + goalProfile.calorieAdjust);
  calories = Math.max(calories, MIN_SAFE_CALORIES);

  const proteinG = Math.round(goalProfile.proteinPerKg * weightKg);
  const fatG = Math.round((calories * goalProfile.fatPct) / 9);
  const carbG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return {
    calorie_target_kcal: calories,
    protein_target_g: proteinG,
    carb_target_g: carbG,
    fat_target_g: fatG,
  };
}

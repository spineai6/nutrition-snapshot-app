import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { computeMacroTargets } from '../lib/macroCalc';
import HeroDish from '../components/HeroDish';

const STEPS = ['gender', 'stats', 'activity', 'goal', 'review'];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'light', label: 'Lightly active', desc: 'Exercise 1–3 days/week' },
  { value: 'moderate', label: 'Moderately active', desc: 'Exercise 3–5 days/week' },
  { value: 'active', label: 'Active', desc: 'Exercise 6–7 days/week' },
  { value: 'very_active', label: 'Very active', desc: 'Hard exercise + physical job' },
];

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose weight', desc: 'Calorie deficit, higher protein' },
  { value: 'maintain', label: 'Maintain weight', desc: 'Stay steady, balanced macros' },
  { value: 'gain_muscle', label: 'Gain muscle', desc: 'Calorie surplus, high protein' },
];

export default function OnboardingScreen({ session, existingProfile, onComplete }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState({
    gender: existingProfile?.gender || '',
    age: existingProfile?.age || '',
    weightKg: existingProfile?.weight_kg || '',
    heightCm: existingProfile?.height_cm || '',
    activityLevel: existingProfile?.activity_level || '',
    goal: existingProfile?.goal || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const step = STEPS[stepIdx];

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function next() {
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  const canProceedStats = form.age && form.weightKg && form.heightCm;

  const targets = computeMacroTargets({
    age: Number(form.age) || 25,
    gender: form.gender,
    weightKg: Number(form.weightKg) || 60,
    heightCm: Number(form.heightCm) || 165,
    activityLevel: form.activityLevel,
    goal: form.goal,
  });

  async function handleFinish() {
    setSaving(true);
    setError('');
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        age: Number(form.age),
        gender: form.gender,
        weight_kg: Number(form.weightKg),
        height_cm: Number(form.heightCm),
        activity_level: form.activityLevel,
        goal: form.goal,
        ...targets,
        onboarding_completed: true,
      })
      .eq('id', session.user.id);

    setSaving(false);
    if (dbError) {
      setError('Could not save your details — try again.');
      return;
    }
    onComplete();
  }

  return (
    <div className="onboard-screen">
      <HeroDish />
      <div className="onboard-card">
        <div className="onboard-dots">
          {STEPS.map((s, i) => (
            <span key={s} className={`onboard-dot ${i <= stepIdx ? 'filled' : ''}`} />
          ))}
        </div>

        {step === 'gender' && (
          <>
            <h2>Let's set your targets</h2>
            <p className="onboard-sub">First, how do you identify?</p>
            <div className="onboard-options">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`onboard-option ${form.gender === opt.value ? 'selected' : ''}`}
                  onClick={() => { update('gender', opt.value); next(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'stats' && (
          <>
            <h2>Your body stats</h2>
            <p className="onboard-sub">Used to calculate your daily calorie and macro needs.</p>
            <div className="onboard-inputs">
              <label>
                Age
                <input type="number" min="10" max="100" value={form.age} onChange={(e) => update('age', e.target.value)} placeholder="e.g. 28" />
              </label>
              <label>
                Weight (kg)
                <input type="number" min="30" max="250" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} placeholder="e.g. 65" />
              </label>
              <label>
                Height (cm)
                <input type="number" min="100" max="250" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} placeholder="e.g. 170" />
              </label>
            </div>
            <div className="onboard-nav">
              <button className="onboard-back" onClick={back}>Back</button>
              <button className="onboard-next" disabled={!canProceedStats} onClick={next}>Continue</button>
            </div>
          </>
        )}

        {step === 'activity' && (
          <>
            <h2>Activity level</h2>
            <p className="onboard-sub">How active are you in a typical week?</p>
            <div className="onboard-options">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`onboard-option ${form.activityLevel === opt.value ? 'selected' : ''}`}
                  onClick={() => { update('activityLevel', opt.value); next(); }}
                >
                  <span className="onboard-option-label">{opt.label}</span>
                  <span className="onboard-option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button className="onboard-back" onClick={back}>Back</button>
          </>
        )}

        {step === 'goal' && (
          <>
            <h2>Your goal</h2>
            <p className="onboard-sub">This shapes your calorie and protein targets.</p>
            <div className="onboard-options">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`onboard-option ${form.goal === opt.value ? 'selected' : ''}`}
                  onClick={() => { update('goal', opt.value); next(); }}
                >
                  <span className="onboard-option-label">{opt.label}</span>
                  <span className="onboard-option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button className="onboard-back" onClick={back}>Back</button>
          </>
        )}

        {step === 'review' && (
          <>
            <h2>Your daily targets</h2>
            <p className="onboard-sub">Based on your stats and goal — you can always adjust these later.</p>
            <div className="onboard-targets">
              <div className="onboard-target-row"><span>Calories</span><strong>{targets.calorie_target_kcal} kcal</strong></div>
              <div className="onboard-target-row"><span>Protein</span><strong>{targets.protein_target_g} g</strong></div>
              <div className="onboard-target-row"><span>Carbs</span><strong>{targets.carb_target_g} g</strong></div>
              <div className="onboard-target-row"><span>Fat</span><strong>{targets.fat_target_g} g</strong></div>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="onboard-finish" disabled={saving} onClick={handleFinish}>
              {saving ? 'Saving...' : "Let's go"}
            </button>
            <button className="onboard-back" onClick={back}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}

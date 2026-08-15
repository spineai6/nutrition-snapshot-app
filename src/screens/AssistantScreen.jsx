import { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { computeMicroTargets } from '../lib/microCalc';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesisUtteranceAPI = window.SpeechSynthesisUtterance;

const HELP_TEXT =
  "I can tell you about today's calories or protein, this week's savings, your iron or calcium, your best-value food this week, your food variety, or generate a grocery list — try 'grocery list for 1500'. Open-ended chat needs the AI upgrade, which is coming once the app's Claude API access is live.";

function extractNumber(text) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

export default function AssistantScreen({ session, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'assistant', text: "Hi, I'm your Snapshot Assistant. Ask me about your calories, savings, iron, or best-value food this week." },
  ]);
  const recognitionRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('calorie_target_kcal, protein_target_g, gender, goal, monthly_budget_inr')
        .eq('id', session.user.id)
        .single();
      profileRef.current = data;
    }
    loadProfile();
  }, [session]);

  useEffect(() => {
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setInput(text);
        handleSend(text);
      };
    }
  }, []);

  function toggleListening() {
    if (!SpeechRecognitionAPI) {
      alert('Voice input is not supported in this browser — try typing instead.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  }

  function speak(text) {
    if (!SpeechSynthesisUtteranceAPI) return;
    const utterance = new SpeechSynthesisUtteranceAPI(text);
    utterance.rate = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function answerQuery(text) {
    const q = text.toLowerCase();
    const userId = session.user.id;
    const profile = profileRef.current;

    try {
      if (q.includes('grocery') || q.includes('shopping list')) {
        const budget = extractNumber(q) || profile?.monthly_budget_inr || 1500;
        const { data } = await supabase.rpc('generate_grocery_list', { p_budget_inr: budget, p_mode: 'home' });
        if (!data || data.length === 0) return `I couldn't build a list for ₹${budget} — try a higher budget.`;
        const top3 = data.slice(0, 3).map((i) => i.food_name).join(', ');
        return `For ₹${budget}, I'd get you ${data.length} items including ${top3}. Check the Grocery List section for the full breakdown.`;
      }

      if (q.includes('save') || q.includes('saving') || q.includes('money')) {
        const { data } = await supabase.rpc('get_weekly_savings_teaser', { p_user_id: userId });
        const amount = Math.round(Number(data || 0));
        return amount > 0
          ? `You've got about ₹${amount} in potential savings this week from smart swaps you could make.`
          : `No swap-based savings found yet this week — log a few more meals and I'll have something to work with.`;
      }

      if (q.includes('best value') || q.includes('value food')) {
        const { data } = await supabase.rpc('get_weekly_value_food', { p_user_id: userId });
        const row = data?.[0];
        return row
          ? `${row.food_name} was your best value pick this week — ${row.total_protein_g}g protein for ₹${row.total_cost_inr}, that's ${row.protein_per_rupee}g of protein per rupee.`
          : `Not enough priced meals logged this week to find a best-value food yet.`;
      }

      if (q.includes('iron') || q.includes('calcium') || q.includes('micro') || q.includes('vitamin') || q.includes('b12')) {
        const { data } = await supabase.rpc('get_todays_micro_totals', { p_user_id: userId });
        const row = data?.[0];
        const targets = computeMicroTargets({ gender: profile?.gender });
        if (!row) return `No micro-nutrient data yet today.`;
        return `Today you've had ${Number(row.iron_mg).toFixed(1)}mg iron out of a ${targets.iron_mg}mg target, and ${Number(row.calcium_mg).toFixed(0)}mg calcium out of ${targets.calcium_mg}mg.`;
      }

      if (q.includes('variety') || q.includes('diversity')) {
        const { data } = await supabase.rpc('get_weekly_signal_layer', { p_user_id: userId });
        const row = data?.[0];
        return row && row.days_logged > 0
          ? `You've eaten ${row.diversity_count} different foods this week, ${row.plant_diversity_count} of them plant-based.`
          : `Log a few meals this week and I'll be able to tell you about your food variety.`;
      }

      if (q.includes('protein')) {
        const { data } = await supabase.rpc('get_todays_macro_totals', { p_user_id: userId });
        const row = data?.[0];
        const target = profile?.protein_target_g || 60;
        return row
          ? `You've had ${Math.round(row.protein_g)}g protein today, out of your ${target}g target.`
          : `No meals logged yet today.`;
      }

      if (q.includes('calorie') || q.includes('calories') || q.includes('kcal')) {
        const { data } = await supabase.rpc('get_todays_macro_totals', { p_user_id: userId });
        const row = data?.[0];
        const target = profile?.calorie_target_kcal || 2000;
        return row
          ? `You've had ${Math.round(row.calories_kcal)} calories today, out of your ${target} kcal target.`
          : `No meals logged yet today — snap a photo and I'll have numbers for you.`;
      }

      if (q.includes('goal')) {
        const goalLabels = { lose_weight: 'losing weight', maintain: 'maintaining your weight', gain_muscle: 'gaining muscle' };
        return profile?.goal
          ? `Your current goal is ${goalLabels[profile.goal] || profile.goal}.`
          : `You haven't set a goal yet — you can do that from the side menu.`;
      }

      if (q.includes('help') || q.includes('what can you')) {
        return HELP_TEXT;
      }

      return `I'm not sure how to answer that yet. ${HELP_TEXT}`;
    } catch (err) {
      return "Something went wrong pulling that up — try again in a moment.";
    }
  }

  async function handleSend(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    setMessages((prev) => [...prev, { type: 'user', text }]);
    setInput('');
    setThinking(true);

    const answer = await answerQuery(text);

    setThinking(false);
    setMessages((prev) => [...prev, { type: 'assistant', text: answer }]);
    speak(answer);
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="insights-screen assistant-screen">
      <div className="insights-header">
        <span className="insights-title">Snapshot Assistant</span>
        <button className="side-menu-close" onClick={onClose}>✕</button>
      </div>

      <div className="assistant-orb-wrap">
        <div className="assistant-orb">
          <div className={`assistant-orb-glow ${isListening ? 'active' : ''}`} />
          <div className={`assistant-orb-core ${isListening ? 'listening' : ''}`} />
        </div>
        <button
          className={`assistant-mic-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
        >
          <Mic size={22} />
        </button>
        <p className="assistant-status">
          {isListening ? 'Listening...' : isSpeaking ? <><Volume2 size={13} /> Speaking...</> : thinking ? 'Thinking...' : 'Ready'}
        </p>
      </div>

      <div className="assistant-chat">
        {messages.map((m, i) => (
          <div key={i} className={`assistant-msg ${m.type}`}>
            <p>{m.text}</p>
          </div>
        ))}
        {thinking && <div className="assistant-msg assistant"><p>...</p></div>}
      </div>

      <div className="assistant-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your calories, savings, iron..."
          className="assistant-input"
        />
        <button className="assistant-send-btn" onClick={() => handleSend()}>
          <Send size={18} />
        </button>
      </div>
      <p className="insights-disclaimer">
        Answers come from your real logged data. Free-form conversation isn't available yet — that needs the AI upgrade.
      </p>
    </div>
  );
}

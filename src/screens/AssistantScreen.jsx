import { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesisUtteranceAPI = window.SpeechSynthesisUtterance;

export default function AssistantScreen({ session, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'assistant', text: "Hi, I'm your Snapshot Assistant. Ask me about your calories, savings, iron, goal, or best-value food this week." },
  ]);
  const [quota, setQuota] = useState(null); // { used, isPaid } | null
  const recognitionRef = useRef(null);

  useEffect(() => {
    async function loadQuota() {
      const userId = session.user.id;
      const [{ data: profile }, { data: used }] = await Promise.all([
        supabase.from('profiles').select('tier').eq('id', userId).single(),
        supabase.rpc('get_chat_messages_used_today', { p_user_id: userId }),
      ]);
      setQuota({ used: used ?? 0, isPaid: profile?.tier === 'paid' });
    }
    loadQuota();
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

  async function answerQuery(text, currentMessages) {
    const history = currentMessages
      .slice(-6)
      .map((m) => ({ role: m.type === 'user' ? 'user' : 'model', text: m.text }));

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant-chat`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text, history }),
        }
      );
      if (res.status === 429) {
        const json = await res.json();
        return json.message || "You've hit today's free message limit — upgrade for unlimited chat, or come back tomorrow.";
      }
      if (!res.ok) throw new Error('assistant-chat error');
      const json = await res.json();
      return json.reply || "Sorry, I couldn't come up with an answer for that.";
    } catch (err) {
      return "Something went wrong reaching the assistant — try again in a moment.";
    }
  }

  async function handleSend(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    const updatedMessages = [...messages, { type: 'user', text }];
    setMessages(updatedMessages);
    setInput('');
    setThinking(true);

    const answer = await answerQuery(text, updatedMessages);

    setThinking(false);
    setMessages((prev) => [...prev, { type: 'assistant', text: answer }]);
    speak(answer);
    setQuota((q) => (q && !q.isPaid ? { ...q, used: q.used + 1 } : q));
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
      {quota && !quota.isPaid && (
        <p className="assistant-quota">{Math.max(0, 15 - quota.used)} of 15 free messages left today</p>
      )}

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
        Answers are grounded in your real logged data. Not a doctor or dietitian — general guidance only, not medical advice.
      </p>
    </div>
  );
}

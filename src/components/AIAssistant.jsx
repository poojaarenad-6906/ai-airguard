import { useState, useRef, useEffect } from 'react';
import '../styles/assistant.css';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';

const USE_GROQ = Boolean(GROQ_API_KEY);

// ------------------------------------------------------------------
// Rule-based fallback responses (used when no Groq key is configured)
// ------------------------------------------------------------------
const RULES = [
  {
    patterns: [/aqi/i, /air quality index/i],
    response: 'The **Air Quality Index (AQI)** is a scale used to measure how clean or polluted the air is. On the OpenWeatherMap scale, values range from 1 (Good) to 5 (Very Poor). Higher values indicate worse air quality with greater health risks.',
  },
  {
    patterns: [/pm\s*2\.?5/i],
    response: '**PM2.5** refers to fine particulate matter with a diameter of 2.5 micrometres or less. These tiny particles can penetrate deep into lung tissue and even enter the bloodstream. Long-term exposure is linked to cardiovascular and respiratory diseases. WHO safe guideline: 15 μg/m³ annual mean.',
  },
  {
    patterns: [/pm\s*10/i],
    response: '**PM10** refers to inhalable particles with a diameter of 10 micrometres or less. They include dust, pollen, and mould spores. While larger than PM2.5, they can still irritate the respiratory tract and worsen asthma. WHO safe guideline: 45 μg/m³ annual mean.',
  },
  {
    patterns: [/no2|nitrogen/i],
    response: '**NO₂ (Nitrogen Dioxide)** is a gas primarily emitted by vehicle engines and power plants. High concentrations can irritate the respiratory system and contribute to asthma. It also reacts in the atmosphere to form ozone and PM2.5.',
  },
  {
    patterns: [/o3|ozone/i],
    response: '**Ground-level Ozone (O₃)** is formed when sunlight reacts with pollutants like NO₂ and VOCs. It can trigger respiratory problems, particularly for people with asthma, even at relatively low concentrations.',
  },
  {
    patterns: [/co\b|carbon monoxide/i],
    response: '**Carbon Monoxide (CO)** is a colourless, odourless gas produced by incomplete combustion. High concentrations reduce the blood\'s ability to carry oxygen. Indoor cooking fires and vehicle exhaust are major sources.',
  },
  {
    patterns: [/so2|sulfur|sulphur/i],
    response: '**SO₂ (Sulphur Dioxide)** is released by burning fossil fuels containing sulphur. It can cause breathing difficulties, especially for people with asthma, and contributes to acid rain.',
  },
  {
    patterns: [/mask|n95/i],
    response: 'When air quality is Poor (AQI 4) or Very Poor (AQI 5), wearing an **N95 or KN95 respirator mask** is recommended. These filter at least 95% of airborne particles including PM2.5. Standard surgical masks offer limited protection against fine particles.',
  },
  {
    patterns: [/outdoor|exercise|run|walk|sport/i],
    response: 'For outdoor exercise:\n- **AQI 1–2 (Good/Fair):** Exercise freely.\n- **AQI 3 (Moderate):** Sensitive groups should limit vigorous outdoor exercise.\n- **AQI 4 (Poor):** Reduce outdoor activity duration and intensity.\n- **AQI 5 (Very Poor):** Avoid all outdoor exercise.',
  },
  {
    patterns: [/child|children|kid/i],
    response: 'Children are more vulnerable to air pollution because their lungs are still developing. During Poor or Very Poor AQI days, keep children indoors, avoid playground activities near roads, and keep school/home windows closed.',
  },
  {
    patterns: [/asthma|respiratory|lung|breathing/i],
    response: 'People with respiratory sensitivities should closely monitor AQI levels daily. Carry prescribed inhalers at all times, use air purifiers at home, avoid peak traffic pollution hours (7–9 AM and 5–7 PM), and keep rescue medication accessible.',
  },
  {
    patterns: [/air purifier|purifier|indoor air/i],
    response: 'Air purifiers with **HEPA filters** are effective at removing PM2.5 and PM10 from indoor air. Place them in sleeping areas and high-occupancy rooms. Run them continuously during high pollution days.',
  },
  {
    patterns: [/reduce|prevent|protect|tips/i],
    response: 'Practical ways to reduce pollution exposure:\n1. Check AQI daily before outdoor plans.\n2. Use air purifiers indoors.\n3. Wear N95 masks on poor air days.\n4. Plant trees and indoor plants.\n5. Use public transport.\n6. Avoid burning wood or waste outdoors.',
  },
  {
    patterns: [/source|cause|reason|why/i],
    response: 'Major sources of urban air pollution include:\n- **Vehicle exhaust** (PM2.5, NO₂, CO)\n- **Industrial emissions** (SO₂, PM10)\n- **Construction dust** (PM10, PM2.5)\n- **Agricultural burning** (PM2.5, NH₃)\n- **Biomass cooking fires** (CO, PM2.5)\n- **Natural sources** (dust storms, pollen, wildfires)',
  },
  {
    patterns: [/hello|hi|hey|greet/i],
    response: 'Hello! I\'m the **AI AirGuard Assistant** 🌬️. I can help you understand AQI levels, PM2.5, PM10, health precautions, and outdoor safety. What would you like to know?',
  },
  {
    patterns: [/thank|thanks/i],
    response: 'You\'re welcome! Stay safe and breathe clean air. 🌿 Ask me anything else about air quality or pollution.',
  },
];

const SUGGESTIONS = [
  'What is AQI?',
  'Explain PM2.5',
  'When should I wear a mask?',
  'Is it safe to exercise outdoors?',
  'How can I improve indoor air quality?',
  'What causes air pollution?',
];

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function getRuleResponse(input) {
  const lower = input.toLowerCase();
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(lower))) return rule.response;
  }
  return 'I\'m not sure about that specific question. Try asking about **AQI**, **PM2.5**, **masks**, **outdoor exercise**, or **air purifiers**. For detailed information, check the Pollution Insights section.';
}

// Call Groq API
async function getGroqResponse(messages, cityContext) {
  const systemPrompt = `You are AI AirGuard, an expert air quality assistant. You help people understand air pollution, AQI levels, health precautions, and make informed daily decisions.${
    cityContext
      ? ` The user is currently viewing air quality data for ${cityContext.city} with AQI ${cityContext.aqi} (${cityContext.aqiLabel}).`
      : ''
  }

Keep answers concise (2–4 sentences or a short list). Focus on practical, actionable advice. Always clarify that health recommendations are general guidance, not medical advice. Use simple language suitable for all ages.`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.text })),
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function AIAssistant({ data }) {
  const isGroq = USE_GROQ;

  const welcomeText = isGroq
    ? `Hi! I'm the **AI AirGuard Assistant** 🤖 — powered by Groq AI.\n\nAsk me anything about air quality, pollution, health precautions, or outdoor safety.${data ? `\n\nI can see you're checking air quality for **${data.city}** (AQI ${data.aqi} — ${data.aqiLabel}).` : ''}\n\nWhat would you like to know?`
    : `Hi! I'm the **AI AirGuard Assistant** 🌬️ — demo rule-based assistant.\n\nI can answer questions about AQI, PM2.5, PM10, health precautions, and outdoor safety.${data ? `\n\nI can see you're checking air quality for **${data.city}** (AQI ${data.aqi} — ${data.aqiLabel}).` : ''}\n\nWhat would you like to know?`;

  const [messages, setMessages] = useState([{ role: 'assistant', text: welcomeText }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const bottomRef = useRef(null);
  // keep a history ref for Groq (excludes system prompt)
  const historyRef = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, userMsg];
    setInput('');
    setLoading(true);
    setAiError('');

    try {
      let responseText;
      if (isGroq) {
        responseText = await getGroqResponse(historyRef.current, data);
      } else {
        // Simulate a small delay for the rule-based assistant
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
        responseText = getRuleResponse(trimmed);
      }
      const assistantMsg = { role: 'assistant', text: responseText };
      setMessages((prev) => [...prev, assistantMsg]);
      historyRef.current = [...historyRef.current, assistantMsg];
    } catch (err) {
      setAiError(`AI error: ${err.message}. Falling back to demo mode.`);
      const fallback = getRuleResponse(trimmed);
      const assistantMsg = { role: 'assistant', text: fallback };
      setMessages((prev) => [...prev, assistantMsg]);
      historyRef.current = [...historyRef.current, assistantMsg];
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section fade-in">
      <div className="container">
        <div className="section-title">
          <h2>🤖 AI Pollution Assistant</h2>
          <p>Ask questions about air quality, pollution, health precautions, and more.</p>
        </div>

        <div className="glass-card chat-wrapper">
          {/* Status notice */}
          <div className="chat-demo-notice">
            {isGroq ? (
              <span className="demo-notice" style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.35)', color: '#4CAF50' }}>
                ✅ Groq AI Active — Powered by {GROQ_MODEL}
              </span>
            ) : (
              <span className="demo-notice">
                🔧 Demo Assistant — Add <code style={{ background: 'rgba(141,216,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>VITE_GROQ_API_KEY</code> to .env for real AI
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="msg-avatar">{msg.role === 'assistant' ? (isGroq ? '🤖' : '🌬️') : '👤'}</div>
                <div
                  className="msg-bubble"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                />
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="msg-avatar">{isGroq ? '🤖' : '🌬️'}</div>
                <div className="msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            {aiError && (
              <div style={{ padding: '6px 20px', color: '#FF7043', fontSize: '0.8rem' }}>
                ⚠️ {aiError}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => sendMessage(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            className="chat-input-row"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <input
              className="input-field chat-input"
              placeholder={isGroq ? 'Ask anything about air quality…' : 'Ask about AQI, PM2.5, masks, outdoor safety…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary send-btn"
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

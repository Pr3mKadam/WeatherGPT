import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  MapPin,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
  WifiOff,
} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import DataBadge from '../components/DataBadge.jsx';
import SourceNote from '../components/SourceNote.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const STORAGE_KEY = 'weathergpt.chat.v1';
const MAX_STORED = 40;

const SUGGESTIONS = [
  'Is today a good day for a run?',
  "What's driving today's air quality?",
  'How does wind affect PM2.5?',
  'Should I worry about the heat this week?',
  'Explain the AQI in simple terms.',
  'Give me one practical way to cut my footprint.',
];

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

/** Minimal, safe Markdown-ish renderer: paragraphs, bullets, numbered lines, bold. */
function MessageBody({ content }) {
  const lines = String(content || '').split('\n');
  const blocks = [];
  let bullets = [];

  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul className="chat-bullets" key={`ul-${blocks.length}`}>
        {bullets.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      return;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }
    flush();
    blocks.push(
      <p key={`p-${index}`} className="chat-paragraph">
        {renderInline(trimmed)}
      </p>
    );
  });
  flush();

  return <div className="chat-markdown">{blocks}</div>;
}

function readStoredMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (message) =>
          message &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string'
      )
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

export default function Assistant() {
  const { location } = useLocation();
  const { notify } = useToast();
  const status = useApi('/ai/status');

  const [messages, setMessages] = useState(readStoredMessages);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [lastNotice, setLastNotice] = useState(null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage may be unavailable */
    }
  }, [messages]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, pending]);

  async function send(question) {
    const text = question.trim();
    if (!text || pending) return;

    const nextMessages = [...messages, { role: 'user', content: text }].slice(-MAX_STORED);
    setMessages(nextMessages);
    setDraft('');
    setPending(true);
    setError(null);
    setLastNotice(null);

    try {
      const response = await api.post('/ai/chat', {
        messages: nextMessages.slice(-10),
        location,
      });
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.answer || 'I could not produce an answer.' },
      ]);
      setLastNotice(response.notice || null);
    } catch (requestError) {
      setError(requestError);
      notify(requestError.message || 'The assistant could not answer.', 'error');
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    send(draft);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    setLastNotice(null);
    notify('Conversation cleared.', 'info');
  }

  const mode = status.data?.mode || (status.loading ? 'checking' : 'offline');
  const modeLabel = useMemo(() => {
    if (mode === 'groq') return 'Groq AI connected';
    if (mode === 'checking') return 'Checking AI status…';
    return 'Offline insight mode';
  }, [mode]);

  return (
    <div className="page assistant-page">
      <PageHeader
        eyebrow="Conversational AI"
        title="Ask about the air, water and climate"
        description="Answers are grounded in the live conditions for your selected location. When no AI key is configured, WeatherGPT uses a transparent rule-based insight mode instead."
        meta={
          <>
            <span className="meta-item">
              <MapPin size={14} aria-hidden="true" />
              Context: {location.name}
            </span>
            <DataBadge
              status={mode === 'groq' ? 'live' : 'estimated'}
              label={modeLabel}
              title={
                mode === 'groq'
                  ? 'Answers are generated by Groq using the live WeatherGPT data as context.'
                  : 'No GROQ_API_KEY is configured, so answers are generated from live data with built-in rules.'
              }
            />
          </>
        }
        actions={
          messages.length ? (
            <button type="button" className="btn btn-outline" onClick={clearChat}>
              <Trash2 size={15} />
              Clear chat
            </button>
          ) : null
        }
      />

      <div className="assistant-layout">
        <section className="card chat-card">
          <div className="chat-scroll" ref={scrollRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <span className="chat-welcome-icon" aria-hidden="true">
                  <Sparkles size={24} />
                </span>
                <h2>Hi — I'm WeatherGPT.</h2>
                <p>
                  I can explain the weather, air pollution, water issues, climate change and
                  sustainability using live data for {location.name}. Pick a question to start.
                </p>
                <div className="suggestion-grid">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      className="suggestion-chip"
                      onClick={() => send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <article
                className={`chat-message ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
                key={`${index}-${message.role}-${message.content.slice(0, 24)}`}
              >
                <span className="chat-avatar" aria-hidden="true">
                  {message.role === 'user' ? <User size={15} /> : <Bot size={16} />}
                </span>
                <div className="chat-bubble">
                  <span className="chat-author">
                    {message.role === 'user' ? 'You' : 'WeatherGPT'}
                  </span>
                  <MessageBody content={message.content} />
                </div>
              </article>
            ))}

            {pending && (
              <article className="chat-message is-assistant">
                <span className="chat-avatar" aria-hidden="true">
                  <Bot size={16} />
                </span>
                <div className="chat-bubble">
                  <span className="chat-author">WeatherGPT</span>
                  <div className="typing" aria-label="Thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )}
          </div>

          {error && (
            <div className="chat-error">
              <WifiOff size={15} aria-hidden="true" />
              <span>{error.message}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => send(messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '')}>
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          )}

          {lastNotice && !error && <p className="chat-notice">{lastNotice}</p>}

          <form className="chat-composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${location.name}'s weather, air or climate…`}
              rows={1}
              maxLength={4000}
              aria-label="Your question"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!draft.trim() || pending}
              aria-label="Send question"
            >
              {pending ? <RefreshCw size={17} className="spin" /> : <ArrowUp size={18} />}
            </button>
          </form>
          <p className="chat-hint">
            Enter to send · Shift + Enter for a new line · Answers are general awareness, not medical
            or official advice.
          </p>
        </section>

        <aside className="assistant-aside">
          <section className="card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Suggested questions</h2>
                <p className="card-subtitle">Grounded in live data</p>
              </div>
            </div>
            <div className="suggestion-list">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className="suggestion-row"
                  onClick={() => send(suggestion)}
                  disabled={pending}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>

          <section className="card assistant-context-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Current context</h2>
                <p className="card-subtitle">Attached to every answer</p>
              </div>
            </div>
            <dl className="context-list">
              <div>
                <dt>Location</dt>
                <dd>{[location.name, location.admin1].filter(Boolean).join(', ')}</dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>
                  {location.lat.toFixed(3)}, {location.lon.toFixed(3)}
                </dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>Open-Meteo weather, CAMS air quality, CPCB-style AQI estimate</dd>
              </div>
              <div>
                <dt>AI mode</dt>
                <dd>{modeLabel}</dd>
              </div>
            </dl>
          </section>

          <SourceNote sources={[{ name: 'Groq', url: 'https://groq.com/' }, { name: 'Open-Meteo', url: 'https://open-meteo.com/' }]}>
            The assistant is told to use the numbers supplied by WeatherGPT and to state clearly when
            something is an estimate. It must not present computed advisories as official IMD or CPCB
            warnings.
          </SourceNote>
        </aside>
      </div>
    </div>
  );
}

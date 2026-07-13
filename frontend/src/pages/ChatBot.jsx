import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .getChat()
      .then((data) => setMessages(data.messages || []))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || loading) return;
    setText('');
    setLoading(true);
    setError('');
    try {
      const data = await api.sendChat(message);
      setMessages((prev) => [...prev, data.user, data.assistant]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    await api.clearChat();
    setMessages([]);
  };

  return (
    <section className="card chat">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2>MindBot</h2>
          <p className="lead">Chatbot IA d’écoute et de conseils bienveillants</p>
        </div>
        <button type="button" className="btn ghost" onClick={clear}>
          Effacer
        </button>
      </div>

      <div className="chat-log">
        {!messages.length && !loading ? (
          <div className="bubble assistant">
            Bonjour. Je suis MindBot. Parlez-moi de votre stress, sommeil ou
            humeur — je suis là pour vous écouter.
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.role}${m.crisis ? ' crisis' : ''}`}
          >
            {m.text}
            {m.tips?.length ? (
              <ul className="tips">
                {m.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
        {loading ? <div className="bubble assistant">MindBot réfléchit…</div> : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="error">{error}</p> : null}

      <form className="chat-form" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex. Je me sens anxieux ce soir…"
          aria-label="Message"
        />
        <button className="btn" type="submit" disabled={loading}>
          Envoyer
        </button>
      </form>
    </section>
  );
}

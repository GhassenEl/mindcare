import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import Dashboard from './pages/Dashboard.jsx';
import CheckIn from './pages/CheckIn.jsx';
import ChatBot from './pages/ChatBot.jsx';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'chat', label: 'Chatbot IA' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [checkins, setCheckins] = useState([]);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError('');
      const [mood, insight] = await Promise.all([
        api.getCheckins(),
        api.getInsights(),
      ]);
      setCheckins(mood.checkins || []);
      setInsights(insight);
      setReady(true);
    } catch (err) {
      setError(err.message || 'API indisponible');
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="brand">MindCare</h1>
          <p className="tagline">
            Monitoring mental health · check-ins · chatbot bienveillant
          </p>
        </div>
        <nav className="nav" aria-label="Navigation">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {!ready ? (
        <div className="card">Chargement…</div>
      ) : (
        <>
          {tab === 'dashboard' && (
            <Dashboard checkins={checkins} insights={insights} />
          )}
          {tab === 'checkin' && (
            <CheckIn
              onSaved={async () => {
                await refresh();
                setTab('dashboard');
              }}
            />
          )}
          {tab === 'chat' && <ChatBot />}
        </>
      )}

      <p className="disclaimer">
        MindCare est un outil de bien-être, pas un diagnostic médical. En urgence
        en Tunisie : 190. Si vous êtes en détresse, contactez un professionnel ou
        un proche.
      </p>
    </div>
  );
}

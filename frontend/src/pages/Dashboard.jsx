export default function Dashboard({ checkins, insights }) {
  const averages = insights?.averages;

  return (
    <div className="grid grid-2">
      <section className="card">
        <h2>Vue d’ensemble</h2>
        <p className="lead">
          {insights?.summary || 'Enregistrez votre premier check-in.'}
        </p>

        {averages ? (
          <>
            <div className="metrics">
              <div className="metric">
                <span>Humeur</span>
                <strong>{averages.mood}/5</strong>
              </div>
              <div className="metric">
                <span>Anxiété</span>
                <strong>{averages.anxiety}/5</strong>
              </div>
              <div className="metric">
                <span>Énergie</span>
                <strong>{averages.energy}/5</strong>
              </div>
              <div className="metric">
                <span>Sommeil</span>
                <strong>{averages.sleepHours}h</strong>
              </div>
            </div>

            <div className="bars">
              {[
                ['Humeur', averages.mood, 5],
                ['Anxiété', averages.anxiety, 5],
                ['Énergie', averages.energy, 5],
                ['Sommeil', Math.min(averages.sleepHours, 10), 10],
              ].map(([label, value, max]) => (
                <div className="bar-row" key={label}>
                  <span>{label}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="lead">Pas encore de données sur 7 jours.</p>
        )}

        {insights?.alerts?.length ? (
          <div className="alerts">
            {insights.alerts.map((a) => (
              <div className="alert" key={a}>
                {a}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Historique</h2>
        <p className="lead">Derniers check-ins enregistrés</p>
        {!checkins.length ? (
          <p className="lead">Aucun check-in pour le moment.</p>
        ) : (
          <ul className="history">
            {checkins.slice(0, 12).map((c) => (
              <li key={c.id}>
                <strong>
                  Humeur {c.mood}/5 · Anxiété {c.anxiety}/5 · Énergie {c.energy}/5
                </strong>
                <span className="meta">
                  Sommeil {c.sleepHours}h ·{' '}
                  {new Date(c.createdAt).toLocaleString('fr-TN')}
                </span>
                {c.note ? <span>{c.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

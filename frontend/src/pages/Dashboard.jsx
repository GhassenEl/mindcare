function Delta({ value, invert }) {
  if (value == null) return <span className="delta muted">—</span>;
  const good = invert ? value < 0 : value > 0;
  const bad = invert ? value > 0 : value < 0;
  const cls = good ? 'up' : bad ? 'down' : 'flat';
  const sign = value > 0 ? '+' : '';
  return (
    <span className={`delta ${cls}`}>
      {sign}
      {value}
    </span>
  );
}

function Sparkline({ series, keyName = 'mood' }) {
  const points = series
    .map((d, i) => {
      const v = d[keyName];
      if (v == null) return null;
      const x = (i / Math.max(1, series.length - 1)) * 100;
      const y = 100 - ((v - 1) / 4) * 100;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points || '0,50 100,50'}
      />
    </svg>
  );
}

export default function Dashboard({ checkins, insights }) {
  const averages = insights?.averages;
  const kpis = insights?.kpis;
  const series = insights?.series || [];

  return (
    <div className="grid dash-layout">
      <section className="card span-2">
        <div className="dash-head">
          <div>
            <h2>Vue d’ensemble</h2>
            <p className="lead">
              {insights?.summary || 'Enregistrez votre premier check-in.'}
            </p>
          </div>
          {kpis ? (
            <div className={`score-badge risk-${kpis.riskLevel}`}>
              <span>Score bien-être</span>
              <strong>{kpis.wellnessScore}</strong>
              <em>Risque {kpis.riskLevel}</em>
            </div>
          ) : null}
        </div>

        {averages ? (
          <>
            <div className="metrics metrics-8">
              <div className="metric">
                <span>Humeur</span>
                <strong>{averages.mood}/5</strong>
                <Delta value={kpis?.deltas?.mood} />
              </div>
              <div className="metric">
                <span>Anxiété</span>
                <strong>{averages.anxiety}/5</strong>
                <Delta value={kpis?.deltas?.anxiety} invert />
              </div>
              <div className="metric">
                <span>Énergie</span>
                <strong>{averages.energy}/5</strong>
                <Delta value={kpis?.deltas?.energy} />
              </div>
              <div className="metric">
                <span>Stress</span>
                <strong>{averages.stress}/5</strong>
              </div>
              <div className="metric">
                <span>Focus</span>
                <strong>{averages.focus}/5</strong>
              </div>
              <div className="metric">
                <span>Social</span>
                <strong>{averages.social}/5</strong>
              </div>
              <div className="metric">
                <span>Motivation</span>
                <strong>{averages.motivation}/5</strong>
              </div>
              <div className="metric">
                <span>Sommeil</span>
                <strong>{averages.sleepHours}h</strong>
              </div>
            </div>

            <div className="kpi-row">
              <div className="kpi-pill">
                <span>Streak</span>
                <strong>{kpis?.streak || 0} j</strong>
              </div>
              <div className="kpi-pill">
                <span>Régularité</span>
                <strong>{kpis?.consistency || 0}%</strong>
              </div>
              <div className="kpi-pill">
                <span>Volatilité humeur</span>
                <strong>{kpis?.volatility ?? 0}</strong>
              </div>
              <div className="kpi-pill">
                <span>Dette sommeil</span>
                <strong>{kpis?.sleepDebt ?? 0}h</strong>
              </div>
              <div className="kpi-pill">
                <span>Jours actifs</span>
                <strong>
                  {kpis?.activeDays || 0}/7
                </strong>
              </div>
              <div className="kpi-pill">
                <span>Messages chat 7j</span>
                <strong>{kpis?.chatEngagement || 0}</strong>
              </div>
            </div>

            <div className="spark-card">
              <div className="spark-head">
                <h3>Tendance humeur (7 jours)</h3>
                <span className="meta">{insights?.count || 0} check-ins</span>
              </div>
              <Sparkline series={series} keyName="mood" />
              <div className="spark-days">
                {series.map((d) => (
                  <span key={d.date}>
                    {new Date(d.date).toLocaleDateString('fr-TN', {
                      weekday: 'short',
                    })}
                  </span>
                ))}
              </div>
            </div>

            <div className="bars">
              {[
                ['Humeur', averages.mood, 5],
                ['Anxiété', averages.anxiety, 5],
                ['Énergie', averages.energy, 5],
                ['Stress', averages.stress, 5],
                ['Focus', averages.focus, 5],
                ['Social', averages.social, 5],
                ['Motivation', averages.motivation, 5],
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
        <h2>Améliorations suggérées</h2>
        <p className="lead">Actions concrètes basées sur vos KPI</p>
        <ul className="reco-list">
          {(insights?.recommendations || []).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        {kpis?.bestDay ? (
          <div className="mini-stat ok">
            <strong>Meilleur jour</strong>
            <span>
              Humeur {kpis.bestDay.mood}/5 ·{' '}
              {new Date(kpis.bestDay.date).toLocaleDateString('fr-TN')}
            </span>
          </div>
        ) : null}
        {kpis?.worstDay ? (
          <div className="mini-stat warn">
            <strong>Jour difficile</strong>
            <span>
              Humeur {kpis.worstDay.mood}/5 ·{' '}
              {new Date(kpis.worstDay.date).toLocaleDateString('fr-TN')}
            </span>
          </div>
        ) : null}

        {kpis?.topTags?.length ? (
          <div className="tag-cloud">
            {kpis.topTags.map((t) => (
              <span key={t.tag} className="tag-chip on">
                {t.tag} · {t.count}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Historique</h2>
        <p className="lead">Derniers check-ins enrichis</p>
        {!checkins.length ? (
          <p className="lead">Aucun check-in pour le moment.</p>
        ) : (
          <ul className="history">
            {checkins.slice(0, 12).map((c) => (
              <li key={c.id}>
                <strong>
                  Score {c.wellnessScore ?? '—'} · Humeur {c.mood}/5 · Stress{' '}
                  {c.stress ?? '—'}/5
                </strong>
                <span className="meta">
                  Anxiété {c.anxiety} · Énergie {c.energy} · Focus{' '}
                  {c.focus ?? '—'} · Social {c.social ?? '—'} · Mot.{" "}
                  {c.motivation ?? '—'} · Sommeil {c.sleepHours}h
                </span>
                <span className="meta">
                  {new Date(c.createdAt).toLocaleString('fr-TN')}
                </span>
                {c.tags?.length ? (
                  <div className="tag-row compact">
                    {c.tags.map((t) => (
                      <span key={t} className="tag-chip on">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                {c.note ? <span>{c.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

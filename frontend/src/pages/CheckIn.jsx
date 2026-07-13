import { useState } from 'react';
import { api } from '../api';

const TAGS = [
  'travail',
  'famille',
  'sport',
  'études',
  'social',
  'repos',
  'santé',
  'argent',
];

function Scale({ label, value, onChange, hint }) {
  return (
    <div className="form-row">
      <label>
        {label} ({value}/5)
        {hint ? <span className="hint"> — {hint}</span> : null}
      </label>
      <div className="scale">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={value === n ? 'on' : ''}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CheckIn({ onSaved }) {
  const [mood, setMood] = useState(3);
  const [anxiety, setAnxiety] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [focus, setFocus] = useState(3);
  const [social, setSocial] = useState(3);
  const [motivation, setMotivation] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createCheckin({
        mood,
        anxiety,
        energy,
        stress,
        focus,
        social,
        motivation,
        sleepHours: Number(sleepHours),
        note,
        tags,
      });
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: 640 }}>
      <h2>Check-in du jour</h2>
      <p className="lead">
        7 indicateurs + sommeil pour des KPI plus précis sur votre bien-être.
      </p>

      <form onSubmit={submit}>
        <div className="checkin-grid">
          <Scale label="Humeur" value={mood} onChange={setMood} hint="global" />
          <Scale label="Anxiété" value={anxiety} onChange={setAnxiety} hint="bas = mieux" />
          <Scale label="Énergie" value={energy} onChange={setEnergy} />
          <Scale label="Stress" value={stress} onChange={setStress} hint="bas = mieux" />
          <Scale label="Focus" value={focus} onChange={setFocus} />
          <Scale label="Social" value={social} onChange={setSocial} hint="lien aux autres" />
          <Scale label="Motivation" value={motivation} onChange={setMotivation} />
        </div>

        <div className="form-row">
          <label htmlFor="sleep">Heures de sommeil</label>
          <input
            id="sleep"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label>Tags du jour</label>
          <div className="tag-row">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip ${tags.includes(tag) ? 'on' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="note">Note (optionnel)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ce qui a marqué votre journée…"
          />
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le check-in'}
        </button>
      </form>
    </section>
  );
}

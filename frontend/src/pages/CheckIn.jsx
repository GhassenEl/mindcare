import { useState } from 'react';
import { api } from '../api';

function Scale({ label, value, onChange }) {
  return (
    <div className="form-row">
      <label>
        {label} ({value}/5)
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
  const [sleepHours, setSleepHours] = useState(7);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createCheckin({
        mood,
        anxiety,
        energy,
        sleepHours: Number(sleepHours),
        note,
        tags: [],
      });
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: 560 }}>
      <h2>Check-in du jour</h2>
      <p className="lead">
        Notez rapidement comment vous vous sentez — cela alimente le monitoring.
      </p>

      <form onSubmit={submit}>
        <Scale label="Humeur" value={mood} onChange={setMood} />
        <Scale label="Anxiété" value={anxiety} onChange={setAnxiety} />
        <Scale label="Énergie" value={energy} onChange={setEnergy} />

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

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { readStore, writeStore } from '../store.js';

export const moodRouter = Router();

function clampScale(n, fallback = 3) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(5, Math.max(1, Math.round(v)));
}

moodRouter.get('/', (_req, res) => {
  const store = readStore();
  const checkins = [...store.checkins].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ checkins });
});

moodRouter.post('/', (req, res) => {
  const body = req.body || {};
  const sleepN = Number(body.sleepHours);

  if (!Number.isFinite(sleepN) || sleepN < 0 || sleepN > 24) {
    return res.status(400).json({
      error: 'sleepHours (0-24) est requis',
    });
  }

  for (const key of ['mood', 'anxiety', 'energy']) {
    const v = Number(body[key]);
    if (!Number.isFinite(v) || v < 1 || v > 5) {
      return res.status(400).json({
        error: 'mood, anxiety, energy (1-5) sont requis',
      });
    }
  }

  const entry = {
    id: uuid(),
    mood: clampScale(body.mood),
    anxiety: clampScale(body.anxiety),
    energy: clampScale(body.energy),
    stress: clampScale(body.stress, 3),
    focus: clampScale(body.focus, 3),
    social: clampScale(body.social, 3),
    motivation: clampScale(body.motivation, 3),
    sleepHours: sleepN,
    note: String(body.note || '').slice(0, 500),
    tags: Array.isArray(body.tags)
      ? body.tags.slice(0, 8).map(String)
      : [],
    createdAt: new Date().toISOString(),
  };

  // Score instantané du check-in
  entry.wellnessScore = Math.round(
    ((entry.mood +
      entry.energy +
      (6 - entry.anxiety) +
      (6 - entry.stress) +
      entry.focus +
      entry.social +
      entry.motivation +
      Math.min(5, (entry.sleepHours / 8) * 5)) /
      40) *
      100
  );

  const store = readStore();
  store.checkins.unshift(entry);
  store.checkins = store.checkins.slice(0, 200);
  writeStore(store);

  res.status(201).json({ checkin: entry });
});

moodRouter.delete('/:id', (req, res) => {
  const store = readStore();
  const before = store.checkins.length;
  store.checkins = store.checkins.filter((c) => c.id !== req.params.id);
  if (store.checkins.length === before) {
    return res.status(404).json({ error: 'Check-in introuvable' });
  }
  writeStore(store);
  res.json({ ok: true });
});

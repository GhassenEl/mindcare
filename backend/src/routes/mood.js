import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { readStore, writeStore } from '../store.js';

export const moodRouter = Router();

moodRouter.get('/', (_req, res) => {
  const store = readStore();
  const checkins = [...store.checkins].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ checkins });
});

moodRouter.post('/', (req, res) => {
  const {
    mood,
    anxiety,
    energy,
    sleepHours,
    note = '',
    tags = [],
  } = req.body || {};

  const moodN = Number(mood);
  const anxietyN = Number(anxiety);
  const energyN = Number(energy);
  const sleepN = Number(sleepHours);

  if (
    ![moodN, anxietyN, energyN].every((n) => Number.isFinite(n) && n >= 1 && n <= 5) ||
    !Number.isFinite(sleepN) ||
    sleepN < 0 ||
    sleepN > 24
  ) {
    return res.status(400).json({
      error: 'mood, anxiety, energy (1-5) et sleepHours (0-24) sont requis',
    });
  }

  const entry = {
    id: uuid(),
    mood: moodN,
    anxiety: anxietyN,
    energy: energyN,
    sleepHours: sleepN,
    note: String(note).slice(0, 500),
    tags: Array.isArray(tags) ? tags.slice(0, 8).map(String) : [],
    createdAt: new Date().toISOString(),
  };

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

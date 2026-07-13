import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { readStore, writeStore } from '../store.js';
import { generateReply } from '../services/chatbot.js';

export const chatRouter = Router();

chatRouter.get('/history', (_req, res) => {
  const store = readStore();
  res.json({ messages: store.chats.slice(-40) });
});

chatRouter.post('/message', async (req, res, next) => {
  try {
    const text = String(req.body?.message || '').trim();
    if (!text) {
      return res.status(400).json({ error: 'message requis' });
    }
    if (text.length > 1000) {
      return res.status(400).json({ error: 'message trop long (max 1000)' });
    }

    const store = readStore();
    const userMsg = {
      id: uuid(),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };

    const recentMood = store.checkins[0] || null;
    const reply = await generateReply(text, {
      history: store.chats.slice(-8),
      recentMood,
    });

    const botMsg = {
      id: uuid(),
      role: 'assistant',
      text: reply.text,
      intent: reply.intent,
      tips: reply.tips || [],
      crisis: Boolean(reply.crisis),
      createdAt: new Date().toISOString(),
    };

    store.chats.push(userMsg, botMsg);
    store.chats = store.chats.slice(-100);
    writeStore(store);

    res.json({ user: userMsg, assistant: botMsg });
  } catch (err) {
    next(err);
  }
});

chatRouter.delete('/history', (_req, res) => {
  const store = readStore();
  store.chats = [];
  writeStore(store);
  res.json({ ok: true });
});

import express from 'express';
import cors from 'cors';
import { moodRouter } from './routes/mood.js';
import { chatRouter } from './routes/chat.js';
import { insightsRouter } from './routes/insights.js';

const app = express();
const PORT = process.env.PORT || 5040;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'mindcare-api',
    message: 'MindCare API is running',
  });
});

app.use('/api/v1/mood', moodRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/insights', insightsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur',
  });
});

app.listen(PORT, () => {
  console.log(`MindCare API → http://localhost:${PORT}`);
});

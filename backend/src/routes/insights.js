import { Router } from 'express';
import { readStore } from '../store.js';

export const insightsRouter = Router();

insightsRouter.get('/', (_req, res) => {
  const { checkins } = readStore();
  const last7 = checkins
    .filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 864e5)
    .slice(0, 50);

  if (!last7.length) {
    return res.json({
      hasData: false,
      summary: 'Aucun check-in récent. Commencez par enregistrer votre humeur.',
      averages: null,
      trend: 'neutral',
      alerts: [],
    });
  }

  const avg = (key) =>
    Math.round(
      (last7.reduce((s, c) => s + c[key], 0) / last7.length) * 10
    ) / 10;

  const averages = {
    mood: avg('mood'),
    anxiety: avg('anxiety'),
    energy: avg('energy'),
    sleepHours: avg('sleepHours'),
  };

  let trend = 'stable';
  if (averages.mood >= 4 && averages.anxiety <= 2.5) trend = 'positive';
  else if (averages.mood <= 2.5 || averages.anxiety >= 4) trend = 'concern';

  const alerts = [];
  if (averages.anxiety >= 4) {
    alerts.push('Anxiété élevée sur 7 jours — essayez une respiration 4-7-8.');
  }
  if (averages.sleepHours < 6) {
    alerts.push('Sommeil insuffisant détecté — visez 7 à 8 h.');
  }
  if (averages.mood <= 2.5) {
    alerts.push('Humeur basse récente — parlez-en au chatbot ou à un proche.');
  }
  if (averages.energy <= 2) {
    alerts.push('Énergie faible — une courte marche ou étirement peut aider.');
  }

  res.json({
    hasData: true,
    count: last7.length,
    averages,
    trend,
    alerts,
    summary:
      trend === 'positive'
        ? 'Tendance positive cette semaine. Continuez vos routines utiles.'
        : trend === 'concern'
          ? 'Quelques signaux d’alerte. Soyez bienveillant avec vous-même.'
          : 'État plutôt stable. Les petits check-ins quotidiens aident.',
  });
});

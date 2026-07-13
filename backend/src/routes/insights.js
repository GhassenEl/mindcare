import { Router } from 'express';
import { readStore } from '../store.js';

export const insightsRouter = Router();

function round1(n) {
  return Math.round(n * 10) / 10;
}

function avg(list, key) {
  if (!list.length) return null;
  return round1(list.reduce((s, c) => s + (Number(c[key]) || 0), 0) / list.length);
}

function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function filterDays(checkins, days) {
  const cutoff = Date.now() - days * 864e5;
  return checkins.filter((c) => new Date(c.createdAt).getTime() >= cutoff);
}

function wellnessScore(averages) {
  if (!averages) return null;
  // Humeur + énergie + (6 - anxiété) + (6 - stress) + focus + social + motivation, normalisé /100
  // + sommeil (cible 8h)
  const sleepScore = Math.min(5, (averages.sleepHours / 8) * 5);
  const raw =
    averages.mood +
    averages.energy +
    (6 - averages.anxiety) +
    (6 - averages.stress) +
    averages.focus +
    averages.social +
    averages.motivation +
    sleepScore;
  return Math.round((raw / 40) * 100);
}

function stdDev(list, key) {
  if (list.length < 2) return 0;
  const mean = list.reduce((s, c) => s + c[key], 0) / list.length;
  const variance =
    list.reduce((s, c) => s + (c[key] - mean) ** 2, 0) / list.length;
  return round1(Math.sqrt(variance));
}

function computeStreak(checkins) {
  const days = new Set(checkins.map((c) => dayKey(c.createdAt)));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function seriesByDay(checkins, days = 7) {
  const map = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), []);
  }
  for (const c of checkins) {
    const k = dayKey(c.createdAt);
    if (map.has(k)) map.get(k).push(c);
  }
  return [...map.entries()].map(([date, items]) => ({
    date,
    mood: avg(items, 'mood'),
    anxiety: avg(items, 'anxiety'),
    energy: avg(items, 'energy'),
    stress: avg(items, 'stress'),
    count: items.length,
  }));
}

insightsRouter.get('/', (_req, res) => {
  const { checkins, chats } = readStore();
  const last7 = filterDays(checkins, 7);
  const prev7 = checkins.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t < Date.now() - 7 * 864e5 && t >= Date.now() - 14 * 864e5;
  });

  if (!last7.length) {
    return res.json({
      hasData: false,
      summary: 'Aucun check-in récent. Commencez par enregistrer votre humeur.',
      averages: null,
      kpis: null,
      trend: 'neutral',
      alerts: [],
      recommendations: [
        'Faites votre premier check-in aujourd’hui',
        'Essayez MindBot si vous avez besoin d’écoute',
      ],
      series: seriesByDay([], 7),
    });
  }

  const averages = {
    mood: avg(last7, 'mood'),
    anxiety: avg(last7, 'anxiety'),
    energy: avg(last7, 'energy'),
    sleepHours: avg(last7, 'sleepHours'),
    stress: avg(last7, 'stress') ?? 3,
    focus: avg(last7, 'focus') ?? 3,
    social: avg(last7, 'social') ?? 3,
    motivation: avg(last7, 'motivation') ?? 3,
  };

  const prevAvg = prev7.length
    ? {
        mood: avg(prev7, 'mood'),
        anxiety: avg(prev7, 'anxiety'),
        energy: avg(prev7, 'energy'),
      }
    : null;

  const score = wellnessScore(averages);
  const streak = computeStreak(checkins);
  const volatility = stdDev(last7, 'mood');
  const activeDays = new Set(last7.map((c) => dayKey(c.createdAt))).size;
  const sleepDebtSimple = round1(
    Math.max(0, (8 - averages.sleepHours) * activeDays)
  );

  const best = [...last7].sort(
    (a, b) => b.mood - a.mood || a.anxiety - b.anxiety
  )[0];
  const worst = [...last7].sort(
    (a, b) => a.mood - b.mood || b.anxiety - a.anxiety
  )[0];

  const tagCounts = {};
  for (const c of last7) {
    for (const t of c.tags || []) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const consistency = Math.round((activeDays / 7) * 100);
  const chatCount = (chats || []).filter(
    (m) =>
      m.role === 'user' &&
      Date.now() - new Date(m.createdAt).getTime() < 7 * 864e5
  ).length;

  const deltas = prevAvg
    ? {
        mood: round1(averages.mood - prevAvg.mood),
        anxiety: round1(averages.anxiety - prevAvg.anxiety),
        energy: round1(averages.energy - prevAvg.energy),
      }
    : null;

  let trend = 'stable';
  if (score >= 70 && averages.anxiety <= 2.5) trend = 'positive';
  else if (score <= 45 || averages.anxiety >= 4 || averages.mood <= 2.5)
    trend = 'concern';

  let riskLevel = 'faible';
  if (score < 40 || averages.anxiety >= 4.5) riskLevel = 'élevé';
  else if (score < 55 || averages.anxiety >= 3.5) riskLevel = 'modéré';

  const alerts = [];
  if (averages.anxiety >= 4) {
    alerts.push('Anxiété élevée sur 7 jours — essayez une respiration 4-7-8.');
  }
  if (averages.stress >= 4) {
    alerts.push('Stress élevé — planifiez une pause sans écran de 15 min.');
  }
  if (averages.sleepHours < 6) {
    alerts.push('Sommeil insuffisant — visez 7 à 8 h.');
  }
  if (averages.mood <= 2.5) {
    alerts.push('Humeur basse — parlez-en à MindBot ou à un proche.');
  }
  if (averages.energy <= 2) {
    alerts.push('Énergie faible — une courte marche peut aider.');
  }
  if (averages.focus <= 2) {
    alerts.push('Focus bas — découpez vos tâches en blocs de 25 min.');
  }
  if (averages.social <= 2) {
    alerts.push('Lien social faible — un message à un ami peut faire du bien.');
  }
  if (volatility >= 1.4) {
    alerts.push('Humeur très variable — un rituel du matin stabilise souvent.');
  }
  if (streak === 0) {
    alerts.push('Pas de check-in aujourd’hui — 1 minute suffit.');
  }

  const recommendations = [];
  if (averages.sleepHours < 7) {
    recommendations.push('Couchez-vous 30 min plus tôt ce soir');
  }
  if (averages.anxiety >= 3 || averages.stress >= 3) {
    recommendations.push('Faites 5 respirations profondes avec MindBot');
  }
  if (averages.motivation <= 3) {
    recommendations.push('Choisissez une micro-action de 5 minutes');
  }
  if (averages.social <= 3) {
    recommendations.push('Envoyez un message bienveillant à quelqu’un');
  }
  if (consistency < 50) {
    recommendations.push('Visez 4 check-ins cette semaine pour de meilleurs KPI');
  }
  if (!recommendations.length) {
    recommendations.push('Continuez vos routines qui fonctionnent');
    recommendations.push('Notez 1 chose positive dans le prochain check-in');
  }

  res.json({
    hasData: true,
    count: last7.length,
    averages,
    kpis: {
      wellnessScore: score,
      streak,
      consistency,
      volatility,
      sleepDebt: sleepDebtSimple,
      activeDays,
      riskLevel,
      chatEngagement: chatCount,
      bestDay: {
        mood: best.mood,
        date: best.createdAt,
        note: best.note || '',
      },
      worstDay: {
        mood: worst.mood,
        date: worst.createdAt,
        note: worst.note || '',
      },
      deltas,
      topTags,
    },
    trend,
    alerts,
    recommendations,
    series: seriesByDay(checkins, 7),
    summary:
      trend === 'positive'
        ? `Score bien-être ${score}/100 — tendance positive. Streak : ${streak} j.`
        : trend === 'concern'
          ? `Score ${score}/100 — quelques signaux d’alerte. Soyez doux avec vous-même.`
          : `Score ${score}/100 — état plutôt stable. Streak : ${streak} j.`,
  });
});

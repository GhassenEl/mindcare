/**
 * Chatbot santé mentale — règles locales + option OpenAI si OPENAI_API_KEY.
 * Ne remplace jamais un professionnel de santé.
 */

const CRISIS_PATTERNS =
  /\b(suicid|me tuer|en finir|ne plus vivre|kill myself|self[-\s]?harm|automutil)/i;

const INTENTS = [
  {
    id: 'greeting',
    test: /^(bonjour|salut|hello|hi|hey|bonsoir)\b/i,
    reply:
      'Bonjour. Je suis MindBot, votre compagnon d’écoute MindCare. Comment vous sentez-vous aujourd’hui ?',
    tips: ['Faites un check-in d’humeur', 'Respirez lentement 1 minute'],
  },
  {
    id: 'anxiety',
    test: /\b(anxi|angoiss|stress|panique|inquiet|peur)\b/i,
    reply:
      'L’anxiété peut être très envahissante. Essayons une ancre simple : posez les pieds au sol, inspirez 4 secondes, retenez 4, expirez 6. Vous n’êtes pas seul·e.',
    tips: [
      'Technique 5-4-3-2-1 (5 choses que vous voyez…)',
      'Réduire caféine temporairement',
      'Écrire 3 inquiétudes puis 1 action possible',
    ],
  },
  {
    id: 'sadness',
    test: /\b(triste|déprim|deprim|vide|seul|malheureux|crying|pleur)/i,
    reply:
      'Merci de partager ça. La tristesse mérite de l’espace. Une petite action douce (boire de l’eau, ouvrir la fenêtre, écrire 2 phrases) peut réouvrir un peu d’air.',
    tips: [
      'Contacter un ami de confiance',
      'Sortir 10 minutes à la lumière',
      'Noter une chose supportable aujourd’hui',
    ],
  },
  {
    id: 'sleep',
    test: /\b(sommeil|insomn|dormir|réveil|fatigue|épuis)/i,
    reply:
      'Le sommeil influence fortement l’humeur. Essayez un rituel : écran off 30 min avant, chambre fraîche, même heure de coucher.',
    tips: [
      'Pas de café après 15h',
      'Respiration 4-7-8 au lit',
      'Noter les ruminations sur papier',
    ],
  },
  {
    id: 'anger',
    test: /\b(colère|énerv|rage|frustr|agacé)/i,
    reply:
      'La colère signale souvent une limite franchie. Pouvez-vous nommer le besoin derrière (respect, repos, contrôle) ? Une marche rapide aide parfois à redescendre.',
    tips: ['Pause de 10 minutes', 'Écrire sans filtre puis déchirer', 'Serrer un objet froid'],
  },
  {
    id: 'gratitude',
    test: /\b(merci|mieux|bien|heureux|content|reconnaissan)/i,
    reply:
      'Content d’entendre une note plus douce. Ancrer ces moments (même courts) renforce la résilience. Qu’est-ce qui a aidé concrètement ?',
    tips: ['Garder une note “ce qui aide”', 'Réutiliser la même routine demain'],
  },
  {
    id: 'help',
    test: /\b(aide|help|conseil|que faire|comment)\b/i,
    reply:
      'Je peux vous accompagner sur l’anxiété, le sommeil, l’humeur ou juste écouter. Décrivez en une phrase ce qui pèse le plus maintenant.',
    tips: ['Check-in quotidien', 'Parler 5 min au chatbot', 'Ressources d’urgence si crise'],
  },
];

const CRISIS_REPLY = {
  intent: 'crisis',
  crisis: true,
  text:
    'Je suis vraiment préoccupé par ce que vous ressentez. Vous méritez un soutien immédiat d’un humain. En Tunisie, contactez le 190 (SAMU) ou parlez à un proche / professionnel maintenant. MindBot ne remplace pas une aide d’urgence.',
  tips: [
    'Appelez le 190 (urgence)',
    'Parlez à quelqu’un de confiance maintenant',
    'Rendez-vous aux urgences si besoin',
  ],
};

function localReply(message, ctx = {}) {
  if (CRISIS_PATTERNS.test(message)) return CRISIS_REPLY;

  for (const intent of INTENTS) {
    if (intent.test.test(message)) {
      return {
        intent: intent.id,
        crisis: false,
        text: intent.reply,
        tips: intent.tips,
      };
    }
  }

  const moodHint = ctx.recentMood
    ? ` D’après votre dernier check-in (humeur ${ctx.recentMood.mood}/5, anxiété ${ctx.recentMood.anxiety}/5), soyez doux avec vous-même.`
    : '';

  return {
    intent: 'listen',
    crisis: false,
    text:
      `Je vous écoute. ${message.length < 40 ? 'Pouvez-vous préciser un peu plus ce que vous ressentez ?' : 'Ce que vous décrivez compte.'}${moodHint} Je peux aussi vous guider sur le stress, le sommeil ou la tristesse.`,
    tips: [
      'Faire un check-in humeur',
      'Respiration 4-7-8',
      'Écrire 3 phrases libres',
    ],
  };
}

async function openAiReply(message, ctx) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const system = `Tu es MindBot, assistant bienveillant de santé mentale pour l'app MindCare (Tunisie).
Réponds en français, court (max 120 mots), empathique, pratique.
Tu n'es PAS un médecin. En cas de crise suicidaire, oriente vers le 190 et un proche.
Contexte check-in récent: ${ctx.recentMood ? JSON.stringify(ctx.recentMood) : 'aucun'}.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 220,
      messages: [
        { role: 'system', content: system },
        ...(ctx.history || [])
          .slice(-6)
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.text,
          })),
        { role: 'user', content: message },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return null;

  return {
    intent: 'openai',
    crisis: CRISIS_PATTERNS.test(message),
    text,
    tips: ['Continuer le dialogue', 'Noter ce qui aide'],
  };
}

export async function generateReply(message, ctx = {}) {
  if (CRISIS_PATTERNS.test(message)) return CRISIS_REPLY;

  try {
    const ai = await openAiReply(message, ctx);
    if (ai) return ai;
  } catch (err) {
    console.warn('OpenAI fallback:', err.message);
  }

  return localReply(message, ctx);
}

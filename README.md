# MindCare — Monitoring santé mentale + chatbot IA

Application web **React + Node.js** pour suivre l’humeur, l’anxiété, l’énergie et le sommeil, avec un **chatbot IA** bienveillant.

> Outil de bien-être, **pas un diagnostic médical**. Urgences Tunisie : **190**.

## Stack

| Couche | Techno | Port |
|--------|--------|------|
| Frontend | React 18 + Vite | **3040** |
| Backend | Express (ESM) | **5040** |
| Données | JSON local (`backend/data/store.json`) | — |
| IA | Règles locales MindBot (+ OpenAI optionnel) | — |

## Fonctionnalités

- Check-in enrichi : humeur, anxiété, énergie, **stress**, **focus**, **social**, **motivation**, sommeil + tags
- **KPI** : score bien-être /100, streak, régularité, volatilité, dette de sommeil, risque, deltas vs semaine N-1
- Sparkline tendance 7 jours, meilleur/pire jour, recommandations
- Chatbot MindBot (règles locales + OpenAI optionnel)

## Lancer

```bash
cd mini-projects/fullstack/mindcare
npm run install:all
npm run dev:api
npm run dev:web
```

- Web : http://localhost:3040  
- API : http://localhost:5040/api/v1/health  

OpenAI (optionnel) :

```bash
set OPENAI_API_KEY=sk-...
npm run dev:api
```

## API

- `GET/POST /api/v1/mood`
- `GET /api/v1/insights`
- `POST /api/v1/chat/message`
- `GET/DELETE /api/v1/chat/history`

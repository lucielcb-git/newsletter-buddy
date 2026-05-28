# SignalPost

AI-powered newsletter generator built as part of NYU Stern's **Foundations of AI Agents** course. The goal was to explore the potential of AI agents to support SMBs in their marketing efforts.

This is a first iteration/prototype, but it includes the foundations for a production-grade agent:
- **Frontend UI** for conversational interaction
- **Agent memory** to maintain context across exchanges
- **Agent guardrails** and **evaluation scoring** to enforce output quality
- **Human-in-the-loop controls** (test email, approve-before-send) to validate content and layout before broadcasting
- **Inbox integration** so users can preview the final email rendering

Building this taught me what AI agents can realistically do today, where the limitations are, and where human oversight remains essential given the probabilistic nature of LLMs.

## How It Works

```
User prompt --> React chat UI --> N8N webhook --> AI agent --> Draft + evaluation
```

1. **Chat with the agent** - Describe your newsletter topic, audience, and tone
2. **Live preview** - The draft renders in real time with markdown support
3. **AI evaluation** - Each draft is scored on tone, keyword coverage, structure, length, and intent compliance
4. **Iterate** - Ask the agent to edit specific sections until the draft passes
5. **Send** - Fire a test email or approve and send to all subscribers

## Features

- **Conversational drafting** - Generate and iteratively edit newsletters through natural language
- **Quality scoring** - AI evaluates each draft across 5 dimensions with a pass/fail gate
- **Brand-aware** - Upload your logo and style guide; the agent adapts output accordingly
- **Multi-company support** - Switch between company profiles with saved preferences (keywords, tone)
- **Test emails** - Send drafts to yourself before broadcasting
- **Mobile-responsive** - Chat and preview panels adapt to mobile with tab navigation

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| AI orchestration | N8N (cloud-hosted workflow engine) |
| LLM | OpenAI (via N8N AI nodes) |
| Email delivery | N8N workflow integration |
| Prototyping | Vibe-coded with [Lovable](https://lovable.dev) |

## Project Structure

```
src/
  pages/
    Index.tsx          # Main view: chat + newsletter preview
    Settings.tsx       # Company preferences, brand assets, test email
  components/
    ChatPanel.tsx      # Conversational interface with the AI agent
    NewsletterPreview.tsx  # Live draft renderer with evaluation badges
  lib/
    newsletter-api.ts  # Webhook client for the N8N agent
    settings-api.ts    # Local storage for company settings and assets
    newsletter-session.ts  # Session state (messages, draft, evaluation)
    current-company.ts # Active company context
```

## Getting Started

```bash
# Install dependencies
bun install  # or npm install

# Start dev server
bun dev  # or npm run dev

# Run tests
bun test  # or npm test
```

The app connects to an N8N webhook for AI orchestration. To use your own backend, update the `WEBHOOK_URL` in `src/lib/newsletter-api.ts`.

## Built By

Lucie Le Cren-Boussuard - [LinkedIn](https://linkedin.com/in/lucielcb)

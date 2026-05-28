# SignalPost

AI-powered newsletter generator built as part of NYU Stern's **Foundations of AI Agents** course.

### The Problem

SMBs know consistent content marketing drives growth, but most lack the time, writing resources, or tooling to produce quality newsletters at a regular cadence. Existing solutions are either too manual (Mailchimp template editors) or too generic (pure LLM output with no brand awareness or quality control).

### The Hypothesis

An AI agent that combines conversational drafting with structured guardrails can get SMBs from idea to send-ready newsletter in minutes, not hours, while keeping a human in control of what actually goes out.

### What This Prototype Explores

This is a first iteration, but it was designed with the building blocks a production-grade agent would need:

- **Conversational UI** - Users describe what they want in natural language; the agent generates and iteratively refines the draft through a chat interface, maintaining context across exchanges
- **Brand-aware generation** - Users upload their logo and style guide, and configure tone and keyword preferences per company. The agent adapts its output accordingly, not just generic content
- **Evaluation scoring** - Every draft is scored across 5 dimensions (tone, keyword coverage, structure, length, intent compliance) with a pass/fail gate. This makes quality visible and actionable, not a black box
- **Human-in-the-loop controls** - Approve-before-send confirmation, test email delivery to validate layout in your actual inbox, and iterative editing before broadcast. The agent proposes; the human decides
- **Multi-company support** - Settings, brand assets, and preferences persist per company profile, designed for agencies or operators managing multiple brands

### What I Learned

Building this clarified where AI agents add real value and where they break down:
- **Works well**: First-draft generation, maintaining tone consistency, structured content formatting
- **Requires guardrails**: Output quality varies across runs; evaluation scoring and human review are non-negotiable for anything customer-facing
- **Key insight**: The probabilistic nature of LLMs means the product design matters as much as the model. Trust is built through transparency (visible scores), control (edit before send), and verification (test emails), not by hiding the AI behind a "magic" button

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

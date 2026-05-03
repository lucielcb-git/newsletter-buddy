import { useEffect, useState } from "react";
import type { ChatMessage } from "@/components/ChatPanel";
import type { Draft } from "@/components/NewsletterPreview";
import type { Evaluation } from "@/lib/newsletter-api";

export interface NewsletterSession {
  messages: ChatMessage[];
  draft: Draft | null;
  evaluation: Evaluation | null;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "agent",
  content: "What are we sending today? 💌",
};

let state: NewsletterSession = {
  messages: [WELCOME],
  draft: null,
  evaluation: null,
};

type Listener = (s: NewsletterSession) => void;
const listeners = new Set<Listener>();

export function getNewsletterSession(): NewsletterSession {
  return state;
}

export function setNewsletterSession(
  updater: NewsletterSession | ((prev: NewsletterSession) => NewsletterSession)
) {
  const next = typeof updater === "function" ? (updater as (p: NewsletterSession) => NewsletterSession)(state) : updater;
  state = next;
  listeners.forEach((l) => l(state));
}

export function useNewsletterSession(): [
  NewsletterSession,
  (updater: NewsletterSession | ((prev: NewsletterSession) => NewsletterSession)) => void
] {
  const [s, setS] = useState<NewsletterSession>(state);
  useEffect(() => {
    const l: Listener = (n) => setS(n);
    listeners.add(l);
    // sync in case state changed between render and subscribe
    setS(state);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return [s, setNewsletterSession];
}

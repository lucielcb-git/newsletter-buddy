import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
}

export const ChatPanel = ({ messages, isLoading, onSend }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const submit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl bg-card/80 backdrop-blur shadow-card border border-border/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60 bg-gradient-primary/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground leading-tight">Newsletter Assistant</h2>
          <p className="text-xs text-muted-foreground">Chat with your friendly AI helper</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex animate-fade-in-up",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-soft whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-mint-soft text-foreground rounded-bl-md"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-mint-soft rounded-3xl rounded-bl-md px-5 py-3 shadow-soft">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-4 bg-background/40">
        <div className="flex items-end gap-2 rounded-3xl border border-border bg-card px-4 py-2 shadow-soft focus-within:ring-2 focus-within:ring-primary/40 transition">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Tell me about your newsletter…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground max-h-32"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { toast } from "sonner";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { NewsletterPreview, type Draft } from "@/components/NewsletterPreview";
import { callNewsletterAgent } from "@/lib/newsletter-api";
import { Sparkles, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "agent",
  content: "Hi! Tell me what your newsletter should be about and I'll draft it for you. 💌",
};

const USER_ID = 1;

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState<"test" | "approve" | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  const applyResponse = (data: { title?: string; content?: string; status?: "draft" | "sent" }) => {
    if (data.content || data.title) {
      setDraft({
        title: data.title ?? draft?.title ?? "Untitled",
        content: data.content ?? draft?.content ?? "",
        status: data.status ?? "draft",
      });
    } else if (data.status) {
      setDraft((d) => (d ? { ...d, status: data.status! } : d));
    }
  };

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setIsLoading(true);

    const action = draft ? "edit" : "generate";
    try {
      const data = await callNewsletterAgent({ action, userId: USER_ID, message: text });
      applyResponse(data);
      const reply = data.content
        ? `Done! I've ${action === "generate" ? "drafted" : "updated"} your newsletter — check the preview ✨`
        : "All set!";
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "agent", content: reply }]);
      if (window.innerWidth < 768) setMobileTab("preview");
    } catch (err) {
      console.error(err);
      toast.error("Oops! Couldn't reach the newsletter agent. Please try again.");
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "agent", content: "Sorry, something went wrong. Please try again 🙈" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsSending("test");
    try {
      await callNewsletterAgent({ action: "test", userId: USER_ID });
      toast.success("Test email sent! 📨");
    } catch {
      toast.error("Failed to send test email.");
    } finally {
      setIsSending(null);
    }
  };

  const handleApprove = async () => {
    setIsSending("approve");
    try {
      const data = await callNewsletterAgent({ action: "approve", userId: USER_ID });
      applyResponse({ ...data, status: data.status ?? "sent" });
      toast.success("Newsletter sent to all subscribers! 🎉");
    } catch {
      toast.error("Failed to send newsletter.");
    } finally {
      setIsSending(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Newsletter <span className="text-primary">Studio</span>
        </h1>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden px-4 mb-3">
        <div className="flex gap-1 rounded-full bg-card/80 p-1 shadow-soft border border-border/60">
          <TabBtn active={mobileTab === "chat"} onClick={() => setMobileTab("chat")} icon={<MessageCircle className="h-4 w-4" />} label="Chat" />
          <TabBtn active={mobileTab === "preview"} onClick={() => setMobileTab("preview")} icon={<Mail className="h-4 w-4" />} label="Preview" />
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
        <div className="grid h-full gap-4 md:gap-6 md:grid-cols-2 max-w-7xl mx-auto" style={{ height: "calc(100vh - 110px)" }}>
          <div className={cn("min-h-0", mobileTab === "chat" ? "block" : "hidden", "md:block")}>
            <ChatPanel messages={messages} isLoading={isLoading} onSend={handleSend} />
          </div>
          <div className={cn("min-h-0", mobileTab === "preview" ? "block" : "hidden", "md:block")}>
            <NewsletterPreview draft={draft} onTest={handleTest} onApprove={handleApprove} isSending={isSending} />
          </div>
        </div>
      </div>
    </main>
  );
};

const TabBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition",
      active ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
    {label}
  </button>
);

export default Index;

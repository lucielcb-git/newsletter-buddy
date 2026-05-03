import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { NewsletterPreview } from "@/components/NewsletterPreview";
import { callNewsletterAgent, type NewsletterAsset } from "@/lib/newsletter-api";
import { Sparkles, Mail, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentCompany } from "@/lib/current-company";
import { useNewsletterSession } from "@/lib/newsletter-session";
import { loadCachedTestEmail, loadLocalAssets, type LocalAsset } from "@/lib/settings-api";
import { useState } from "react";

const USER_ID = 1;

function toNewsletterAsset(a: LocalAsset | null | undefined): NewsletterAsset | undefined {
  if (!a) return undefined;
  return { name: a.name, type: a.type, dataUrl: a.dataUrl };
}

const Index = () => {
  const [session, setSession] = useNewsletterSession();
  const { messages, draft, evaluation } = session;
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState<"test" | "approve" | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [companyName] = useCurrentCompany();

  const appendMessage = (msg: ChatMessage) =>
    setSession((s) => ({ ...s, messages: [...s.messages, msg] }));

  const applyResponse = (data: { title?: string; content?: string; status?: "draft" | "sent"; evaluation?: typeof evaluation }) => {
    setSession((s) => {
      let nextDraft = s.draft;
      if (data.content || data.title) {
        nextDraft = {
          title: data.title ?? s.draft?.title ?? "Untitled",
          content: data.content ?? s.draft?.content ?? "",
          status: data.status ?? "draft",
        };
      } else if (data.status && s.draft) {
        nextDraft = { ...s.draft, status: data.status };
      }
      return {
        ...s,
        draft: nextDraft,
        evaluation: data.evaluation ?? s.evaluation,
      };
    });
  };

  const getAssetsPayload = () => {
    const assets = loadLocalAssets(companyName);
    return {
      logo: toNewsletterAsset(assets.logo),
      styleGuide: toNewsletterAsset(assets.styleGuide),
    };
  };

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    appendMessage(userMsg);
    setIsLoading(true);

    const isEditIntent = /\bedit\b/i.test(text);
    const action = isEditIntent || draft ? "edit" : "generate";
    const currentContent = draft ? `Title: ${draft.title}\n\n${draft.content}` : undefined;
    try {
      const data = await callNewsletterAgent({
        action,
        userId: USER_ID,
        message: text,
        content: currentContent,
        companyName,
        ...getAssetsPayload(),
      });
      applyResponse(data);
      const reply = data.content
        ? `Done! I've ${action === "generate" ? "drafted" : "updated"} your newsletter — check the preview ✨`
        : "All set!";
      appendMessage({ id: crypto.randomUUID(), role: "agent", content: reply });
      if (window.innerWidth < 768) setMobileTab("preview");
    } catch (err) {
      console.error(err);
      toast.error("Oops! Couldn't reach the newsletter agent. Please try again.");
      appendMessage({ id: crypto.randomUUID(), role: "agent", content: "Sorry, something went wrong. Please try again 🙈" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!draft) return;
    setIsSending("test");
    try {
      const content = `Title: ${draft.title}\n\n${draft.content}`;
      const testEmail = loadCachedTestEmail(companyName);
      if (!testEmail) {
        toast.error("Set a test email in Settings first.");
        setIsSending(null);
        return;
      }
      await callNewsletterAgent({
        action: "test",
        userId: USER_ID,
        message: "Send test email",
        content,
        companyName,
        testEmail,
        ...getAssetsPayload(),
      });
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
      const data = await callNewsletterAgent({
        action: "approve",
        userId: USER_ID,
        companyName,
        ...getAssetsPayload(),
      });
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
      <header className="px-6 py-5 flex items-center justify-center gap-2 relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Newsletter <span className="text-primary">Studio</span>
        </h1>
        <Link
          to="/settings"
          aria-label="Settings"
          className="absolute right-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-full border border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <SettingsIcon className="h-4 w-4" />
        </Link>
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
            <NewsletterPreview draft={draft} evaluation={evaluation} onTest={handleTest} onApprove={handleApprove} isSending={isSending} />
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

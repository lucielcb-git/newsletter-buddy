import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Mail, Send, CheckCircle2, Loader2, Award, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Evaluation } from "@/lib/newsletter-api";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Draft {
  title: string;
  content: string;
  status: "draft" | "sent";
}

interface NewsletterPreviewProps {
  draft: Draft | null;
  evaluation?: Evaluation | null;
  onTest: () => void;
  onApprove: () => void;
  isSending: "test" | "approve" | null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[*_`~]/g, "")
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTitleFromContent(content: string, title: string): string {
  if (!title) return content;
  const lines = content.split("\n");
  const normTitle = normalize(title);
  if (!normTitle) return content;

  // Skip leading blank lines
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return content;

  const firstLine = lines[i].trim();
  // Match markdown heading (#..######), bold-only line, or plain text line
  const headingMatch = firstLine.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
  const boldMatch = firstLine.match(/^\*\*(.+?)\*\*$/) || firstLine.match(/^__(.+?)__$/);
  const candidate = headingMatch?.[1] ?? boldMatch?.[1] ?? firstLine;
  const normCandidate = normalize(candidate);

  if (
    normCandidate &&
    (normCandidate === normTitle ||
      normCandidate.includes(normTitle) ||
      normTitle.includes(normCandidate))
  ) {
    return lines.slice(i + 1).join("\n").trimStart();
  }

  return content;
}

// Convert bare URLs (and "Read: <url>" patterns) into clean markdown links
function linkifyUrls(content: string): string {
  // Replace "Read: https://..." patterns first
  let result = content.replace(
    /(?:Read|Source|Link|URL):\s*(https?:\/\/\S+)/gi,
    '[__READMORE__]($1)'
  );
  // Replace any remaining bare URLs (not already inside markdown link parens/brackets)
  result = result.replace(
    /(^|[\s(])(https?:\/\/[^\s)]+)/g,
    (_match, prefix, url) => `${prefix}[__READMORE__](${url})`
  );
  return result;
}

export const NewsletterPreview = ({ draft, evaluation, onTest, onApprove, isSending }: NewsletterPreviewProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-3xl bg-card/80 backdrop-blur shadow-card border border-border/60 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border/60 bg-gradient-mint/10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-mint text-secondary-foreground shadow-soft">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground leading-tight">Newsletter Preview</h2>
            <p className="text-xs text-muted-foreground">Live draft from your AI agent</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onTest}
            disabled={!draft || !!isSending}
            className="flex items-center gap-1.5 rounded-full bg-peach-soft px-4 py-2 text-sm font-medium text-accent-foreground shadow-soft transition hover:bg-peach hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isSending === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Test
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!draft || !!isSending || draft?.status === "sent"}
            className="flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isSending === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve & Send
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!draft ? (
          <EmptyState />
        ) : (
          <div key={draft.title + draft.content.length} className="animate-preview-pop">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-2xl animate-float">✨</span>
              <h1 className="text-2xl font-bold text-foreground flex-1 min-w-0">{draft.title || "Untitled newsletter"}</h1>
              {evaluation && <EvaluationBadge evaluation={evaluation} />}
              <StatusBadge status={draft.status} />
            </div>
            <div className="rounded-2xl bg-background/60 border border-border/60 p-6 shadow-soft">
              <article className="newsletter-prose">
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => {
                      const childArray = Array.isArray(children) ? children : [children];
                      const textContent = childArray
                        .map((c) => (typeof c === 'string' ? c : ''))
                        .join('');
                      const isPlaceholder = textContent.includes('__READMORE__');
                      const isUrlOnly = textContent === href;
                      if (isPlaceholder || isUrlOnly) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                          >
                            Read more
                          </a>
                        );
                      }
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      );
                    }
                  }}
                >
                  {linkifyUrls(stripTitleFromContent(draft.content, draft.title))}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Send to all subscribers?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send this newsletter to all subscribers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                onApprove();
              }}
              className="rounded-full bg-gradient-primary"
            >
              Yes, send it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EvaluationBadge = ({ evaluation }: { evaluation: Evaluation }) => {
  const score = evaluation.overall_score;
  const pass = evaluation.pass;
  const hasScore = typeof score === "number";
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-soft transition hover:scale-105",
            pass
              ? "bg-success text-success-foreground"
              : "bg-destructive text-destructive-foreground"
          )}
        >
          {pass ? <Award className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {hasScore ? `${score!.toFixed(1)}/10` : pass ? "Pass" : "Fail"}
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">AI Evaluation</h4>
            <span className={cn("text-xs font-bold", pass ? "text-success" : "text-destructive")}>
              {pass ? "PASS" : "FAIL"}
            </span>
          </div>
          {hasScore && (
            <div className="text-xs text-muted-foreground">
              Overall score: <span className="font-semibold text-foreground">{score!.toFixed(1)}/10</span>
            </div>
          )}
          <ul className="space-y-1 text-xs">
            <ScoreRow label="Tone" value={evaluation.tone} />
            <ScoreRow label="Keyword coverage" value={evaluation.keyword_coverage} />
            <ScoreRow label="Structure" value={evaluation.structure} />
            <ScoreRow label="Length" value={evaluation.length} />
            <ScoreRow label="Intent compliance" value={evaluation.intent_compliance} />
          </ul>
          {evaluation.feedback && (
            <p className="text-xs text-muted-foreground border-t border-border/60 pt-2 mt-2 italic">
              {evaluation.feedback}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const ScoreRow = ({ label, value }: { label: string; value?: number }) => {
  if (typeof value !== "number") return null;
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}/10</span>
    </li>
  );
};

const StatusBadge = ({ status }: { status: "draft" | "sent" }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-soft",
      status === "sent"
        ? "bg-success text-success-foreground"
        : "bg-warning text-warning-foreground"
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status === "sent" ? "Sent" : "Draft"}
  </span>
);

const EmptyState = () => (
  <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center px-6">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-30 rounded-full" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-peach shadow-glow animate-float">
        <Mail className="h-12 w-12 text-accent-foreground" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">No draft yet</h3>
    <p className="text-sm text-muted-foreground max-w-xs">
      Your newsletter will appear here once generated ✨
    </p>
  </div>
);

export const WEBHOOK_URL = "https://agentllcb.app.n8n.cloud/webhook/newsletter-agent-v1";

export type NewsletterAction = "generate" | "edit" | "approve" | "test";

export interface NewsletterAsset {
  name: string;
  type: string;
  dataUrl: string;
}

export interface NewsletterRequest {
  action: NewsletterAction;
  userId: number;
  message?: string;
  content?: string;
  companyName?: string;
  testEmail?: string;
  logo?: NewsletterAsset | null;
  styleGuide?: NewsletterAsset | null;
}

export interface Evaluation {
  overall_score?: number;
  pass?: boolean;
  tone?: number;
  keyword_coverage?: number;
  structure?: number;
  length?: number;
  intent_compliance?: number;
  feedback?: string;
}

export interface NewsletterResponse {
  title?: string;
  content?: string;
  status?: "draft" | "sent";
  evaluation?: Evaluation;
  intent?: string;
  [key: string]: unknown;
}

function tryParseJson<T = any>(s: string): T | null {
  try {
    const parsed = JSON.parse(s);
    return parsed as T;
  } catch {
    return null;
  }
}

function extractTitleFromContent(content: string): { title?: string; content: string } {
  if (!content) return { content };
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return { content };
  const first = lines[i].trim();
  const heading = first.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
  const bold = first.match(/^\*\*(.+?)\*\*$/) || first.match(/^__(.+?)__$/);
  if (heading) {
    return { title: heading[1], content: lines.slice(i + 1).join("\n").trimStart() };
  }
  if (bold) {
    return { title: bold[1], content: lines.slice(i + 1).join("\n").trimStart() };
  }
  return { content };
}

export async function callNewsletterAgent(
  payload: NewsletterRequest
): Promise<NewsletterResponse> {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Webhook error: ${res.status}`);
  }

  const text = await res.text();
  if (!text) return {};

  let data: any = tryParseJson(text);
  if (data === null) return { content: text };

  // n8n sometimes wraps response in array
  if (Array.isArray(data)) data = data[0] ?? {};

  if (!data || typeof data !== "object") return { content: String(data) };

  // Parse evaluation if it's a JSON string
  let evaluation: Evaluation | undefined;
  if (data.evaluation !== undefined) {
    if (typeof data.evaluation === "string") {
      const parsed = tryParseJson<Evaluation>(data.evaluation);
      evaluation = parsed ?? undefined;
    } else if (typeof data.evaluation === "object") {
      evaluation = data.evaluation as Evaluation;
    }
  }

  const intent = typeof data.intent === "string" ? data.intent : undefined;

  // Prefer original_output (new shape). Fall back to legacy fields.
  let payloadData: any = data;
  if (data.original_output !== undefined) {
    payloadData = data.original_output;
  } else {
    // Legacy unwrapping
    for (const key of ["json", "data", "output", "response", "result"]) {
      if (data[key] && typeof data[key] === "object" && (data[key].content || data[key].title || data[key].status)) {
        payloadData = data[key];
        break;
      }
    }
    if (typeof data.output === "string") {
      const parsed = tryParseJson(data.output);
      if (parsed) payloadData = parsed;
      else payloadData = { content: data.output };
    }
  }

  // If original_output is a string, try parsing JSON; otherwise treat as content
  let result: NewsletterResponse = {};
  if (typeof payloadData === "string") {
    const parsed = tryParseJson(payloadData);
    if (parsed && typeof parsed === "object" && (parsed.content || parsed.title)) {
      result = parsed as NewsletterResponse;
    } else {
      const { title, content } = extractTitleFromContent(payloadData);
      result = { content, ...(title ? { title } : {}) };
    }
  } else if (payloadData && typeof payloadData === "object") {
    result = { ...payloadData };
  }

  if (evaluation) result.evaluation = evaluation;
  if (intent) result.intent = intent;

  return result;
}

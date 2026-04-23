export const WEBHOOK_URL = "https://agentllcb.app.n8n.cloud/webhook/newsletter-agent-v1";

export type NewsletterAction = "generate" | "edit" | "approve" | "test";

export interface NewsletterRequest {
  action: NewsletterAction;
  userId: number;
  message?: string;
  content?: string;
}

export interface NewsletterResponse {
  title?: string;
  content?: string;
  status?: "draft" | "sent";
  [key: string]: unknown;
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
  try {
    let data: any = JSON.parse(text);
    // n8n sometimes wraps response in array
    if (Array.isArray(data)) data = data[0] ?? {};
    // Unwrap common n8n nesting: { json: {...} }, { data: {...} }, { output: {...} }, { response: {...} }
    if (data && typeof data === "object") {
      for (const key of ["json", "data", "output", "response", "result"]) {
        if (data[key] && typeof data[key] === "object" && (data[key].content || data[key].title || data[key].status)) {
          data = data[key];
          break;
        }
      }
      // If output is a JSON string, try parsing it
      if (typeof data.output === "string") {
        try {
          const parsed = JSON.parse(data.output);
          if (parsed && (parsed.content || parsed.title)) data = parsed;
        } catch { /* ignore */ }
      }
    }
    return data;
  } catch {
    return { content: text };
  }
}

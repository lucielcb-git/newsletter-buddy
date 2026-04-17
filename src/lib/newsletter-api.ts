export const WEBHOOK_URL = "https://jenmc.app.n8n.cloud/webhook/newsletter-agent";

export type NewsletterAction = "generate" | "edit" | "approve" | "test";

export interface NewsletterRequest {
  action: NewsletterAction;
  userId: number;
  message?: string;
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
    const data = JSON.parse(text);
    // n8n sometimes wraps response in array
    if (Array.isArray(data)) return data[0] ?? {};
    return data;
  } catch {
    return { content: text };
  }
}

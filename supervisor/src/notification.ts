import type { NotificationEvent } from "./types";

export interface NotificationSink {
  notify(event: NotificationEvent): Promise<void>;
}

export class WebhookNotificationSink implements NotificationSink {
  constructor(private readonly url: string) {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error("Supervisor notification URL must use HTTPS");
  }

  async notify(event: NotificationEvent): Promise<void> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error(`Supervisor notification failed (${response.status})`);
  }
}

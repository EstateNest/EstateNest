type ChatbotEvent =
  | "chatbot_opened"
  | "chatbot_consent_accepted"
  | "chatbot_contact_completed"
  | "chatbot_product_selected"
  | "chatbot_quote_clicked"
  | "chatbot_quote_completed"
  | "chatbot_abandoned";

type AnalyticsWindow = Window & {
  gtag?: (command: "event", eventName: string, parameters: Record<string, string>) => void;
  clarity?: (command: "event", eventName: string) => void;
};

export function trackChatbotEvent(
  eventName: ChatbotEvent,
  metadata: { step?: string; action?: string; productCodes?: string[] } = {},
): void {
  if (typeof window === "undefined") return;
  const parameters: Record<string, string> = {
    event_category: "chatbot",
    ...(metadata.step ? { step: metadata.step.slice(0, 40) } : {}),
    ...(metadata.action ? { action: metadata.action.slice(0, 40) } : {}),
    ...(metadata.productCodes?.length
      ? { product_codes: metadata.productCodes.map((value) => value.slice(0, 40)).join(",") }
      : {}),
  };
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.gtag?.("event", eventName, parameters);
  analyticsWindow.clarity?.("event", eventName);
}

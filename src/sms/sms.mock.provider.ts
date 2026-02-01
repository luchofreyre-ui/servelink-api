import { SmsProvider } from "./sms.types";

export class MockSmsProvider implements SmsProvider {
  async sendSms(to: string, body: string) {
    // This is intentionally simple for local dev.
    if (process.env.NODE_ENV !== "test") {
      console.log(`[MOCK SMS] to=${to} body="${body}"`);
    }
    return { provider: "mock", message_id: `mock_${Date.now()}` };
  }
}

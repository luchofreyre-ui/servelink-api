export type SmsKind = "addon";

export type SmsDecision = "approve" | "decline";

export interface SmsProvider {
  sendSms(to: string, body: string): Promise<{ provider: string; message_id?: string }>;
}

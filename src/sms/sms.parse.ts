import { SmsDecision } from "./sms.types";

export function parseDecision(input: string): { decision: SmsDecision; code: string } | null {
  const raw = (input ?? "").trim();

  // Accept: "yes A9F3", "Y A9F3", "approve A9F3", "no A9F3", etc.
  const m = raw.match(/^\s*(yes|y|approve|ok|no|n|decline)\s+([A-Za-z0-9]{3,10})\s*$/i);
  if (!m) return null;

  const word = m[1].toLowerCase();
  const code = m[2].toUpperCase();

  const decision: SmsDecision = ["no", "n", "decline"].includes(word) ? "decline" : "approve";
  return { decision, code };
}

export const FREE_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "yandex.com",
  "zoho.com"
]);

export const EMAIL_RE = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateOrgEmail(email: string): ValidationResult {
  const m = email.trim().toLowerCase().match(EMAIL_RE);
  if (!m) {
    return { ok: false, reason: "Enter a valid email address." };
  }
  if (FREE_DOMAINS.has(m[1])) {
    return { ok: false, reason: "Please use your organization email, not a personal one." };
  }
  return { ok: true };
}

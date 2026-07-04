// Israeli phone normalization for WhatsApp Cloud API recipients and OTP keys.
// The form accepts "050-123 4567", "+972501234567", "0501234567" etc.; we key
// OTPs and address WhatsApp messages by one canonical E.164-without-plus form
// ("972501234567") so the same number always matches itself.
export function normalizeIlPhone(raw: string): string {
  let p = raw.replace(/[\s-]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("0")) p = `972${p.slice(1)}`;
  return p;
}

// Two inputs refer to the same phone number (tolerant of formatting).
export function samePhone(a: string, b: string): boolean {
  return normalizeIlPhone(a) === normalizeIlPhone(b);
}

// Pembersihan input teks bebas dari tamu. Output React sudah di-escape,
// ini lapisan tambahan agar data yang tersimpan juga bersih.

export function cleanText(input: string, max: number) {
  return input
    .normalize("NFC")
    .replace(/<[^>]*>/g, "") // buang tag HTML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

const BLOCKED = [
  /\b(casino|slot\s?gacor|judi|togel|bokep|porn|viagra|crypto\s?giveaway|pinjol)\b/i,
  /\b(bit\.ly|tinyurl\.com|t\.me\/)\b/i,
];

/** Heuristik spam sederhana. Mengembalikan alasan bila mencurigakan. */
export function spamReason(text: string, startedAt?: number) {
  if (startedAt && Date.now() - startedAt < 2500) return "terlalu cepat";
  const links = (text.match(/https?:\/\/|www\./gi) ?? []).length;
  if (links > 1) return "terlalu banyak tautan";
  if (BLOCKED.some((r) => r.test(text))) return "kata terlarang";
  if (/(.)\1{9,}/.test(text)) return "karakter berulang";
  return null;
}

/** Sanitasi SVG sebelum upload: buang script, event handler, dan tautan javascript. */
export function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "")
    .replace(/<!ENTITY[\s\S]*?>/gi, "");
}

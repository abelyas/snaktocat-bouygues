export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ':' + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const OBF_SECRET = 'Sn4kt0cat-B0uygu3s-2026!';

function deriveKey(playerId: string, pin: string, ts: number): string {
  const raw = `${OBF_SECRET}:${playerId}:${pin}:${ts}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).padStart(12, 'x');
}

function xorCipher(text: string, key: string): string {
  return text.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

export function encodePayload(data: {
  playerId: string;
  score: number;
  pin: string;
  sessionStart: number;
}): { payload: string; ts: number } {
  const ts = Date.now();
  const key = deriveKey('', '', ts);
  const json = JSON.stringify({
    p: data.playerId,
    s: data.score,
    k: data.pin,
    ss: data.sessionStart,
    n: Math.random().toString(36).slice(2, 10),
  });
  const xored = xorCipher(json, key);
  const payload = btoa(unescape(encodeURIComponent(xored)));
  return { payload, ts };
}

export function decodePayload(payload: string, ts: number): {
  playerId: string;
  score: number;
  pin: string;
  sessionStart: number;
} | null {
  try {
    const xored = decodeURIComponent(escape(atob(payload)));
    const key = deriveKey('', '', ts);
    const json = xorCipher(xored, key);
    const parsed = JSON.parse(json);
    if (!parsed.p || parsed.s === undefined || !parsed.k) return null;
    return {
      playerId: parsed.p,
      score: parsed.s,
      pin: parsed.k,
      sessionStart: parsed.ss,
    };
  } catch {
    return null;
  }
}

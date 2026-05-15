// Personal/free email domains that are not allowed
const BLOCKED_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'yahoo.de', 'yahoo.es', 'yahoo.it',
  'hotmail.com', 'hotmail.fr', 'hotmail.co.uk', 'hotmail.de', 'hotmail.es', 'hotmail.it',
  'outlook.com', 'outlook.fr',
  'live.com', 'live.fr',
  'msn.com',
  'aol.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'zoho.com',
  'yandex.com', 'yandex.ru',
  'mail.com', 'email.com',
  'gmx.com', 'gmx.fr', 'gmx.de',
  'free.fr', 'laposte.net', 'orange.fr', 'sfr.fr', 'wanadoo.fr', 'bbox.fr',
  'web.de', 't-online.de',
  'libero.it', 'virgilio.it',
  'seznam.cz',
  'wp.pl', 'onet.pl',
  'mail.ru',
  'rambler.ru',
  'tutanota.com', 'tuta.io',
  'fastmail.com',
  'hey.com',
  'pm.me',
];

export function isValidEmailFormat(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

export function isPersonalEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return true;
  return BLOCKED_DOMAINS.includes(domain);
}

export function getEmailError(email: string): string | null {
  if (!email) return null;
  if (!isValidEmailFormat(email)) {
    return 'Please enter a valid email address.';
  }
  if (isPersonalEmail(email)) {
    return 'Please use your professional email address. Personal emails (Gmail, Hotmail, Yahoo, etc.) are not accepted.';
  }
  return null;
}

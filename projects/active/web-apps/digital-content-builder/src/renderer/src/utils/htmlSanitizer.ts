import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOW_UNKNOWN_PROTOCOLS: false,
      RETURN_TRUSTED_TYPE: false
    }) as string;
  } catch {
    return '';
  }
}

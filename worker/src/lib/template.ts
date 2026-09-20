/**
 * Shared HTML email shell.
 *
 * Every Base44 HTML email repeated the same ~60 lines of inline CSS, header and
 * footer. Rather than copy that into six handlers, the common chrome lives here
 * and each email supplies only its own body (and any extra rules it needs).
 *
 * The rendered output is the same markup clients already receive — same colours,
 * same structure. Unused rules in the shared block are harmless; mail clients
 * ignore selectors that never match.
 */

const BASE_CSS = `
    body { margin: 0; padding: 0; background-color: #F5F2EE; font-family: 'Inter', Arial, sans-serif; color: #121212; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background-color: #121212; padding: 28px 36px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; color: #F5F2EE; font-family: Georgia, 'Times New Roman', serif; letter-spacing: -0.5px; }
    .header h1 span { color: #FF4F00; }
    .body { padding: 36px; }
    .body h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #121212; }
    .body h3 { font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 700; margin: 22px 0 10px; color: #121212; }
    .body p { font-size: 15px; line-height: 1.7; color: #3a3a3a; margin: 0 0 14px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #F5F2EE; }
    .details-table td:first-child { font-weight: 600; color: #888; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.6px; }
    .details-table td:last-child { color: #121212; }
    .message-box { background: #F5F2EE; border-left: 4px solid #FF4F00; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 12px 0; font-size: 15px; color: #3a3a3a; line-height: 1.7; white-space: pre-wrap; }
    .highlight-box { background: #F5F2EE; border-left: 4px solid #FF4F00; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .services { margin: 12px 0; padding: 0; list-style: none; }
    .services li { font-size: 15px; color: #3a3a3a; padding: 8px 0; border-bottom: 1px solid #F5F2EE; display: flex; align-items: center; gap: 10px; }
    .services li:last-child { border-bottom: none; }
    .dot { width: 8px; height: 8px; background: #FF4F00; border-radius: 50%; flex-shrink: 0; }
    .steps { margin: 20px 0; padding: 0; list-style: none; }
    .steps li { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; font-size: 14px; color: #3a3a3a; border-bottom: 1px solid #F5F2EE; }
    .steps li:last-child { border-bottom: none; }
    .step-num { width: 22px; height: 22px; background: #FF4F00; color: #fff; border-radius: 50%; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .btn { display: inline-block; background-color: #FF4F00; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 50px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; margin: 0 6px 10px; }
    .btn-outline { background-color: transparent; color: #121212; border: 2px solid #121212; }
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .bonus-box { background: #121212; color: #F5F2EE; padding: 20px 24px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .amount { font-size: 36px; font-weight: 900; color: #FF4F00; font-family: Georgia, serif; }
    .label { font-size: 13px; color: #aaa; margin-top: 4px; }
    .footer { background-color: #F5F2EE; padding: 20px 36px; text-align: center; border-top: 1px solid #e8e3dc; }
    .footer p { font-size: 12px; color: #888; margin: 4px 0; }
    .footer a { color: #888; text-decoration: none; }`;

export interface ShellOptions {
  /** <title> of the document. */
  title: string;
  /** Pre-escaped HTML for the message body. */
  body: string;
  /** Extra CSS rules appended after the shared block. */
  extraCss?: string;
}

export function emailShell({ title, body, extraCss = '' }: ShellOptions): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${BASE_CSS}${extraCss}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>DD<span>alton</span> Designs</h1>
      </div>
      <div class="body">
        ${body}
      </div>
      <div class="footer">
        <p>&copy; ${year} DDalton Designs. All rights reserved.</p>
        <p><a href="https://ddaltondesigns.com/privacy">Privacy Policy</a> &nbsp;|&nbsp; <a href="https://ddaltondesigns.com/terms">Terms of Service</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Validates a URL destined for an href.
 *
 * Carried over from sendContactConfirmation: rejects anything that could break
 * out of the attribute, and allows only http/https so a submitted
 * `javascript:` URL can't be turned into a live link in the notification email.
 */
export function safeUrl(input: unknown): string {
  const s = String(input ?? '');
  if (/[<>"'`]/.test(s)) return '';
  try {
    const parsed = new URL(s);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch {
    return '';
  }
}

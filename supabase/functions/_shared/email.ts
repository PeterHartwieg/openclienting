// Shared email helpers for Supabase edge functions.
//
// - Brevo (sendinblue) transport
// - Branded HTML template matching /supabase/templates/*.html (logo + card layout,
//   light/dark mode, mobile breakpoints)
// - Plain-text fallback
// - Locale-aware link building (uses profiles.locale; falls back to 'en')
//
// Import from edge functions as:
//   import { sendBrandedEmail, getRecipientLocale, siteUrl } from "../_shared/email.ts";

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- Environment --------------------------------------------------

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://openclienting.org";
const DEFAULT_LOCALE = "en";

export function siteUrl(): string {
  return SITE_URL;
}

export function brevoConfigured(): boolean {
  return Boolean(BREVO_API_KEY);
}

// ---- Recipient locale --------------------------------------------

/**
 * Look up a user's preferred locale from the profiles table. Used to build
 * links that land on the right [locale] route. Returns DEFAULT_LOCALE if the
 * user has not set a locale or the profile row is missing.
 */
export async function getRecipientLocale(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", userId)
    .maybeSingle();
  const locale = (data?.locale ?? "").trim();
  return locale.length > 0 ? locale : DEFAULT_LOCALE;
}

/**
 * Build an absolute URL into the site, prefixed with the user's locale.
 * `path` must start with `/` and must NOT already contain a locale prefix.
 * Example: localizedUrl('/problems/abc', 'de')  ->  'https://openclienting.org/de/problems/abc'
 */
export function localizedUrl(path: string, locale: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}/${locale}${cleanPath}`;
}

// ---- HTML template ------------------------------------------------

/**
 * Render a branded transactional email. Structure matches the auth templates
 * in /supabase/templates — same palette, same logo, same dark-mode rules.
 *
 * All user-supplied text is inserted via a small escape helper so callers
 * can pass raw strings (titles, snippets) without worrying about HTML entities.
 */
export interface BrandedEmailOptions {
  /** Headline shown at the top of the card and used as email subject. */
  title: string;
  /** Short preview text shown by inbox clients (e.g. Gmail preheader). */
  preheader: string;
  /** Paragraph under the headline. Plain text; will be escaped. */
  intro: string;
  /** Optional quoted/detailed snippet (e.g. comment body). Plain text; escaped. */
  detail?: string;
  /** Text on the primary CTA button. */
  ctaText: string;
  /** Absolute URL the CTA button and fallback link point to. */
  ctaUrl: string;
  /** Optional italic closer below the divider. Plain text; escaped. */
  footer?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderBrandedEmailHtml(opts: BrandedEmailOptions): string {
  const title = escapeHtml(opts.title);
  const preheader = escapeHtml(opts.preheader);
  const intro = escapeHtml(opts.intro);
  const ctaText = escapeHtml(opts.ctaText);
  const ctaUrl = escapeHtml(opts.ctaUrl);
  const detailBlock = opts.detail
    ? `
          <tr>
            <td class="px" style="padding: 0 40px 24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-left:3px solid #2773a5; padding: 8px 14px;">
                    <p class="text-fg" style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:14px; line-height:1.55; color:#3a3b4d; white-space: pre-wrap;">${escapeHtml(opts.detail)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";
  const footerBlock = opts.footer
    ? `
          <tr>
            <td class="px" style="padding: 20px 40px 36px 40px;">
              <p class="text-muted" style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:13px; line-height:1.6; color:#7c7d8d;">
                ${escapeHtml(opts.footer)}
              </p>
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }

    @media (prefers-color-scheme: dark) {
      .body-bg      { background-color: #1c1d2b !important; }
      .card-bg      { background-color: #252637 !important; border-color: rgba(255,255,255,0.12) !important; }
      .text-fg      { color: #ebe9e4 !important; }
      .text-muted   { color: #9e9fad !important; }
      .btn-primary  { background-color: #2e78a8 !important; }
      .divider      { border-color: rgba(255,255,255,0.12) !important; }
      .link-fallback{ color: #80c8e8 !important; }
    }

    @media screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .px        { padding-left: 24px !important; padding-right: 24px !important; }
      .py        { padding-top: 32px !important; padding-bottom: 32px !important; }
      .h1        { font-size: 24px !important; line-height: 1.25 !important; }
    }
  </style>
</head>
<body class="body-bg" style="margin:0; padding:0; background-color:#fbfaf7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#fbfaf7; opacity:0;">
    ${preheader}
  </div>

  <table role="presentation" class="body-bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fbfaf7;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table role="presentation" class="container card-bg" width="560" cellpadding="0" cellspacing="0" border="0"
               style="width:560px; max-width:560px; background-color:#fdfcfa; border:1px solid #e5e3dd; border-radius:14px; overflow:hidden;">

          <tr>
            <td class="px py" align="left" style="padding: 36px 40px 8px 40px;">
              <a href="${escapeHtml(SITE_URL)}" style="text-decoration:none; display:inline-block;">
                <img src="${escapeHtml(SITE_URL)}/brand/email-logo.png"
                     width="216" height="35"
                     alt="OpenClienting.org"
                     style="display:block; border:0; outline:none; text-decoration:none; max-width:270px; height:auto;" />
              </a>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding: 16px 40px 8px 40px;">
              <h1 class="h1 text-fg" style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:28px; line-height:1.2; font-weight:600; letter-spacing:-0.02em; color:#212233;">
                ${title}
              </h1>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding: 12px 40px 24px 40px;">
              <p class="text-muted" style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:16px; line-height:1.6; color:#7c7d8d;">
                ${intro}
              </p>
            </td>
          </tr>
${detailBlock}
          <tr>
            <td class="px" style="padding: 0 40px 32px 40px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="21%" strokecolor="#2773a5" fillcolor="#2773a5">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;">${ctaText}</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${ctaUrl}" class="btn-primary"
                 style="display:inline-block; background-color:#2773a5; color:#fbfaf7; text-decoration:none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:16px; font-weight:600; line-height:1; padding:16px 28px; border-radius:10px; letter-spacing:-0.01em;">
                ${ctaText}
              </a>
              <!--<![endif]-->
            </td>
          </tr>

          <tr>
            <td class="px" style="padding: 0 40px 28px 40px;">
              <p class="text-muted" style="margin:0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:13px; line-height:1.6; color:#7c7d8d;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; font-size:12px; line-height:1.5; word-break:break-all;">
                <a href="${ctaUrl}" class="link-fallback" style="color:#2773a5; text-decoration:underline;">${ctaUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding: 0 40px;">
              <div class="divider" style="border-top:1px solid #e5e3dd; line-height:0; font-size:0;">&nbsp;</div>
            </td>
          </tr>
${footerBlock}
        </table>

        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px; max-width:560px;">
          <tr>
            <td align="center" style="padding: 24px 40px 8px 40px;">
              <p class="text-muted" style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:12px; line-height:1.6; color:#7c7d8d;">
                OpenClienting.org &mdash; the open platform for venture clienting.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 4px 40px 8px 40px;">
              <p class="text-muted" style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:12px; line-height:1.6; color:#7c7d8d;">
                <a href="${escapeHtml(SITE_URL)}" class="link-fallback" style="color:#7c7d8d; text-decoration:underline;">openclienting.org</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(SITE_URL)}/dashboard/account" class="link-fallback" style="color:#7c7d8d; text-decoration:underline;">Email settings</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(SITE_URL)}/privacy" class="link-fallback" style="color:#7c7d8d; text-decoration:underline;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderBrandedEmailText(opts: BrandedEmailOptions): string {
  const parts = [opts.title, "", opts.intro];
  if (opts.detail) {
    parts.push("", opts.detail);
  }
  parts.push("", `${opts.ctaText}: ${opts.ctaUrl}`);
  if (opts.footer) {
    parts.push("", opts.footer);
  }
  parts.push(
    "",
    "—",
    "OpenClienting.org — the open platform for venture clienting.",
    `Manage email preferences: ${SITE_URL}/dashboard/account`,
  );
  return parts.join("\n");
}

// ---- Brevo transport ---------------------------------------------

export interface SendBrandedEmailArgs extends BrandedEmailOptions {
  to: string;
  /** Optional override for subject (defaults to `title`). */
  subject?: string;
}

/**
 * Send a branded email via Brevo. No-op (returns false) if BREVO_API_KEY is
 * unset — callers should still create the in-app notification row either way.
 *
 * Never throws: logs failures to console. The edge function is fire-and-forget
 * and we'd rather swallow transport errors than 500 the webhook.
 */
export async function sendBrandedEmail(
  args: SendBrandedEmailArgs,
): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  const subject = args.subject ?? args.title;
  const htmlContent = renderBrandedEmailHtml(args);
  const textContent = renderBrandedEmailText(args);

  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "OpenClienting", email: "noreply@openclienting.org" },
        to: [{ email: args.to }],
        subject,
        htmlContent,
        textContent,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error(`Brevo send failed (${resp.status}): ${text}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Brevo send threw:", err);
    return false;
  }
}

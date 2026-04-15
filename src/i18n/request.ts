import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { defaultLocale, locales } from "./config";

// Static import of English chrome — guaranteed to exist and used as the
// fallback bundle for every locale that doesn't ship its own messages
// file. Keeping this a static import means the fallback path has no
// dynamic-import cost on every request.
import enMessages from "../messages/en.json";

type Messages = typeof enMessages;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  // Try the locale's own chrome bundle first. If it doesn't exist on disk
  // (we only ship en/de today but 30 locales resolve in the router), fall
  // back to English chrome. User-generated content is still rendered in
  // the target language via content_translations — only the site chrome
  // is fallback-English.
  let messages: Messages = enMessages;
  if (locale !== "en") {
    try {
      messages = (await import(`../messages/${locale}.json`)).default;
    } catch {
      messages = enMessages;
    }
  }

  return {
    locale,
    messages,
    // Render missing keys as the dotted key path instead of crashing in prod.
    onError(error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[i18n]", error.message);
      }
    },
    getMessageFallback({ key, namespace }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});

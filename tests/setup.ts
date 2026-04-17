import "@testing-library/jest-dom/vitest";
import enMessages from "../src/messages/en.json";

// Make English messages available globally so components that call
// useTranslations() can resolve strings in tests without the full
// next-intl provider tree.
(globalThis as Record<string, unknown>).__NEXT_INTL_MESSAGES__ = enMessages;

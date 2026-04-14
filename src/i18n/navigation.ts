import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware Link / useRouter / usePathname / redirect helpers.
// Always import navigation from here, not from "next/link" or "next/navigation".
export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation(routing);

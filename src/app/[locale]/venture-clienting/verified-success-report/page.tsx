import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  SpokePage,
  buildSpokeMetadata,
} from "@/components/venture-clienting/spoke-page";
import { getSpokeById } from "@/lib/venture-clienting-cluster/config";

const spoke = getSpokeById("verifiedSuccessReport");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSpokeMetadata({ locale, spoke });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SpokePage locale={locale} spoke={spoke} />;
}

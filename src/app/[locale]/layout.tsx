import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Header locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

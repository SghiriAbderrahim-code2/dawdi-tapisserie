import type { Metadata } from "next";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales, type Locale } from "@/i18n/routing";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "../globals.css";

// خط عربي واضح ومريح للقراءة
const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const tNav = await getTranslations({ locale: lang, namespace: "Nav" });
  const tFooter = await getTranslations({ locale: lang, namespace: "Footer" });

  return {
    title: {
      default: tNav("siteName"),
      template: `%s | ${tNav("siteName")}`,
    },
    description: tFooter("tagline"),
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;

  if (!locales.includes(lang as Locale)) {
    notFound();
  }

  setRequestLocale(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${cairo.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900">
        <NextIntlClientProvider locale={lang}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

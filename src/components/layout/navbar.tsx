"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

const links = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  { href: "/customize", key: "orderNow" },
  { href: "/contact", key: "contact" },
] as const;

export function Navbar() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-zinc-900"
          onClick={() => setOpen(false)}
        >
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-lg bg-amber-800 text-lg font-bold text-white"
          >
            7
          </span>
          <span className="text-base sm:text-lg">{t("siteName")}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
          <LanguageSwitcher />
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-lg text-zinc-700 hover:bg-zinc-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="text-xl leading-none">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="flex flex-col gap-1 border-t border-zinc-200 px-4 py-3 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="rounded-lg px-3 py-3 text-base font-medium text-zinc-800 hover:bg-zinc-100"
              onClick={() => setOpen(false)}
            >
              {t(link.key)}
            </Link>
          ))}
          <div className="mt-2 border-t border-zinc-200 pt-3">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}

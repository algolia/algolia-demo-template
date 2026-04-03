"use client";

import { useLanguage } from "@/components/language/language-context";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/demo-config/translations";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "ca", label: "CA" },
  { code: "es", label: "ES" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center border border-border rounded-md overflow-hidden">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold transition-colors",
            language === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

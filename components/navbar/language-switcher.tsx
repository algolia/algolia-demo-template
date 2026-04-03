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
    <div className="flex items-center gap-1">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={cn(
            "px-2 py-1 text-sm font-medium transition-colors",
            language === code
              ? "text-gray-900 underline underline-offset-4 decoration-2 decoration-primary"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

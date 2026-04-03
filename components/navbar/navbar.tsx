"use client";

import Link from "next/link";
import { useSearchBox } from "react-instantsearch";
import { BrainIcon, Search, User, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import SidepanelExperience from "@/components/sidepanel-agent-studio/components/sidepanel-agent";
import { UserSelector } from "./user-selector";
import { LanguageSwitcher } from "./language-switcher";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { useSelection } from "@/components/selection/selection-context";
import { useLanguage } from "@/components/language/language-context";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

export function NavBar() {
  const { refine } = useSearchBox();
  const { openSidepanel } = useSidepanel();
  const { selectionCount } = useSelection();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      {/* Layer 1: Top bar — gray background */}
      <div className="bg-[#f5f5f5] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10 text-sm">
          <div className="flex items-center gap-0">
            <span className="font-medium text-gray-900 border-b-2 border-primary px-3 py-2">
              Ciutadania
            </span>
            <span className="text-gray-500 px-3 py-2">La Generalitat</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="hidden sm:inline hover:text-gray-900 cursor-default underline underline-offset-4">
              Seu electr&ograve;nica
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="hidden sm:inline hover:text-gray-900 cursor-default underline underline-offset-4">
              T&apos;atenem
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Layer 2: Main bar — logo + actions */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="shrink-0"
              onClick={() => refine("")}
            >
              <Logo />
            </Link>
            <span className="text-gray-300 text-2xl font-light">|</span>
            <span className="text-gray-700 text-lg">Ciutadania</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search icon — scrolls to search bar on page */}
            <button
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              onClick={() => {
                const el = document.querySelector<HTMLInputElement>("[data-gencat-search]");
                if (el) { el.scrollIntoView({ behavior: "smooth" }); el.focus(); }
              }}
            >
              <Search className="h-5 w-5" />
              <span className="text-base font-medium hidden sm:inline">Cerca</span>
            </button>

            {/* User selector styled as "Àrea privada" */}
            <UserSelector />

            {/* AI Assistant */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openSidepanel()}
              className="hover:bg-muted [&>svg]:hover:stroke-[2.5] relative"
              aria-label={t("navbar.openAssistant")}
            >
              <BrainIcon className="size-6" />
              {selectionCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-medium">
                  {selectionCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Layer 3: Navigation bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-12 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-primary" onClick={() => refine("")}>
            Inici
          </Link>
          <span className="flex items-center gap-1 hover:text-primary cursor-default">
            Serveis i tr&agrave;mits <ChevronDown className="h-3.5 w-3.5" />
          </span>
          <span className="flex items-center gap-1 hover:text-primary cursor-default">
            Actualitat <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <SidepanelExperience
        applicationId={ALGOLIA_CONFIG.APP_ID}
        apiKey={ALGOLIA_CONFIG.SEARCH_API_KEY}
        agentId={ALGOLIA_CONFIG.AGENT_ID}
        variant="inline"
        placeholder={t("navbar.askAnything")}
        showTrigger={false}
      />
    </header>
  );
}

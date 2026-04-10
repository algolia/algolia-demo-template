"use client";

import Link from "next/link";
import { useSearchBox } from "react-instantsearch";
import { Sparkles, MapPin } from "lucide-react";
import { CategoriesSheet } from "./categories-sheet";
import { ClickCollectSelector } from "@/components/click-collect/click-collect-selector";
import { CartSheet } from "./cart-sheet";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import SidepanelExperience from "@/components/sidepanel-agent-studio/components/sidepanel-agent";
import { LiveSearchBar } from "./live-search-bar";
import { UserSelector } from "./user-selector";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { useSelection } from "@/components/selection/selection-context";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

export function NavBar() {
  const { refine } = useSearchBox();
  const { openSidepanel } = useSidepanel();
  const { selectionCount } = useSelection();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background backdrop-blur pb-4 pt-4">
      <div className="flex flex-col md:flex-row md:h-16 md:items-center gap-3 px-4 py-3 md:py-0">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center w-full gap-4">
          {/* Left section: Category button */}
          <div className="shrink-0">
            <CategoriesSheet />
          </div>

          {/* Center section: Logo + Search + AI button */}
          <div className="flex-1 flex items-center gap-3">
            <Link
              href="/"
              className="shrink-0"
              onClick={() => {
                refine("");
              }}
            >
              <Logo />
            </Link>
            <div className="flex-1 max-w-2xl flex items-center gap-2">
              <div className="flex-1">
                <LiveSearchBar />
              </div>
              <Button
                variant="default"
                size="icon"
                onClick={() => openSidepanel()}
                className="shrink-0 relative rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-sm"
                aria-label="Open AI Assistant"
              >
                <Sparkles className="size-4" />
                {selectionCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-medium">
                    {selectionCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Right section: User, Click & Collect, Cart */}
          <div className="shrink-0 flex items-center gap-6">
            <UserSelector />
            <Link
              href="/stores"
              className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Stores
            </Link>
            <ClickCollectSelector />
            <CartSheet />
          </div>
        </div>

        {/* Mobile layout — 2 rows */}
        <div className="md:hidden flex flex-col gap-2 w-full">
          {/* Row 1: Logo + Search + AI */}
          <div className="flex items-center gap-2 w-full">
            <Link
              href="/"
              className="shrink-0"
              onClick={() => { refine(""); }}
            >
              <Logo />
            </Link>
            <div className="flex-1">
              <LiveSearchBar />
            </div>
            <Button
              variant="default"
              size="icon"
              onClick={() => openSidepanel()}
              className="shrink-0 relative rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-sm"
              aria-label="Open AI Assistant"
            >
              <Sparkles className="size-4" />
              {selectionCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-medium">
                  {selectionCount}
                </span>
              )}
            </Button>
          </div>
          {/* Row 2: Categories + User/Cart */}
          <div className="flex items-center justify-between w-full">
            <CategoriesSheet />
            <div className="flex items-center gap-1">
              <UserSelector />
              <ClickCollectSelector />
              <CartSheet />
            </div>
          </div>
        </div>
      </div>

      {/* Single AI Sidepanel instance (shared between mobile and desktop) */}
      <SidepanelExperience
        applicationId={ALGOLIA_CONFIG.APP_ID}
        apiKey={ALGOLIA_CONFIG.SEARCH_API_KEY}
        agentId={ALGOLIA_CONFIG.AGENT_ID}
        variant="inline"
        placeholder="Ask AI anything..."
        showTrigger={false}
      />
    </header>
  );
}

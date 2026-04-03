"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSearchBox } from "react-instantsearch";
import { SearchIcon, MicIcon, MicOffIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language/language-context";

export function LiveSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language, t } = useLanguage();

  // Sync input value with InstantSearch query
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Navigate to home page if not already there when user starts typing
  const navigateToHomeIfNeeded = useCallback(() => {
    if (pathname !== "/") {
      router.push("/");
    }
  }, [pathname, router]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      navigateToHomeIfNeeded();
      refine(value);
    },
    [navigateToHomeIfNeeded, refine]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue("");
    refine("");
    inputRef.current?.focus();
  }, [refine]);

  // Handle form submit (Enter key)
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      navigateToHomeIfNeeded();
      // Dispatch custom event so InlineAISummary can trigger
      window.dispatchEvent(new CustomEvent("search-submit"));
      inputRef.current?.blur();
    },
    [navigateToHomeIfNeeded]
  );

  // Voice search callback
  const handleVoiceTranscriptEnd = useCallback(
    (transcript: string) => {
      if (transcript) {
        setInputValue(transcript);
        navigateToHomeIfNeeded();
        refine(transcript);
      }
    },
    [navigateToHomeIfNeeded, refine]
  );

  // Voice search hook
  const {
    supported: voiceSupported,
    listening,
    transcript,
    toggle: toggleVoice,
  } = useSpeechRecognition({
    lang: language === "ca" ? "ca-ES" : "es-ES",
    onTranscriptEnd: handleVoiceTranscriptEnd,
    silenceTimeout: 1500,
  });

  // Update input during voice recognition
  useEffect(() => {
    if (listening && transcript) {
      setInputValue(transcript);
      navigateToHomeIfNeeded();
      refine(transcript);
    }
  }, [listening, transcript, navigateToHomeIfNeeded, refine]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t("search.placeholder")}
          className={cn(
            "pl-9 pr-20 h-10 w-full",
            listening && "ring-2 ring-red-500 ring-offset-1"
          )}
          aria-label="Search"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
          {voiceSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                listening && "text-red-500 animate-pulse"
              )}
              onClick={toggleVoice}
              aria-label={listening ? "Stop voice search" : "Start voice search"}
            >
              {listening ? (
                <MicOffIcon className="h-4 w-4" />
              ) : (
                <MicIcon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

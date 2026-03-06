import { useState, useCallback } from "react";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";

export function useCollapsibleFilters() {
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const { isSidepanelOpen } = useSidepanel();

  // Derive filter visibility: user's manual choice takes priority, otherwise auto-collapse when sidepanel is open
  const filtersOpen = userChoice ?? !isSidepanelOpen;

  const toggleFilters = useCallback(() => {
    setUserChoice((prev) => !(prev ?? !isSidepanelOpen));
  }, [isSidepanelOpen]);

  return { filtersOpen, toggleFilters };
}

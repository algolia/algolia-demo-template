import { useState, useEffect, useRef } from "react";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";

export function useCollapsibleFilters() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const { isSidepanelOpen } = useSidepanel();
  const userToggledRef = useRef(false);

  // Auto-collapse filters when sidepanel opens, restore when it closes
  useEffect(() => {
    if (isSidepanelOpen) {
      setFiltersOpen(false);
    } else if (!userToggledRef.current) {
      setFiltersOpen(true);
    }
  }, [isSidepanelOpen]);

  const toggleFilters = () => {
    userToggledRef.current = true;
    setFiltersOpen((prev) => !prev);
  };

  return { filtersOpen, toggleFilters };
}

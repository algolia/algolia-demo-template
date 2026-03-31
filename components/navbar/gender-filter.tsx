"use client";

import { useGenderFilter } from "@/components/gender-filter-context";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = ["Men", "Women", "Kids"] as const;
type GenderOption = (typeof GENDER_OPTIONS)[number];

export function GenderFilter() {
  const { selectedGender, setSelectedGender } = useGenderFilter();

  const handleClick = (gender: GenderOption) => {
    setSelectedGender(selectedGender === gender ? null : gender);
  };

  return (
    <div className="flex items-center justify-center gap-2 px-4 pb-2">
      {GENDER_OPTIONS.map((gender) => (
        <button
          key={gender}
          onClick={() => handleClick(gender)}
          className={cn(
            "px-4 py-1 text-sm font-medium rounded-full border transition-colors",
            selectedGender === gender
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:border-primary hover:bg-muted"
          )}
        >
          {gender}
        </button>
      ))}
    </div>
  );
}

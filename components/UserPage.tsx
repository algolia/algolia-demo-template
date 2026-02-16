"use client";

import { useMemo } from "react";
import { Info, Tag, Calendar, Target, Package, Layers } from "lucide-react";
import { User, PreferenceKey } from "@/lib/types/user";
import { PREFERENCE_METADATA } from "@/lib/demo-config/users";

interface AffinityItem {
  label: string;
  score: number;
}

function AffinityCard({
  title,
  items,
  icon: Icon,
  emptyMessage = "No affinities available.",
}: {
  title: string;
  items: AffinityItem[];
  icon?: React.ComponentType<{ className?: string }>;
  emptyMessage?: string;
}) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.score - a.score);
  }, [items]);

  return (
    <div className="w-full rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-gray-500" />}
          <h3 className="text-xl font-semibold">{title}</h3>
          <span className="text-sm text-gray-500">{sortedItems.length}</span>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_200px] px-6 py-3 text-sm text-gray-500">
        <div>Value</div>
        <div className="flex items-center justify-end gap-2">
          <span>Score (out of 20)</span>
          <Info className="h-4 w-4" />
        </div>
      </div>
      <div>
        {sortedItems.length === 0 ? (
          <div className="px-6 py-6 text-sm text-gray-500">{emptyMessage}</div>
        ) : (
          sortedItems.map((row, index) => {
            const percentage = (row.score / 20) * 100;
            return (
              <div
                key={`${row.label}-${index}`}
                className="grid grid-cols-[1fr_200px] items-center px-6 py-4 border-t first:border-t-0 gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="w-5 text-gray-400">{index + 1}</span>
                  <span className="text-base">{row.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress Bar */}
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {/* Score Number */}
                  <span className="text-base font-medium w-8 text-right">
                    {row.score}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper to convert preference object to AffinityItem array
function preferencesToItems(preferences?: {
  [key: string]: number;
}): AffinityItem[] {
  if (!preferences) return [];
  return Object.entries(preferences).map(([label, score]) => ({
    label,
    score,
  }));
}

// Map icon strings to icon components
const iconMap = {
  layers: Layers,
  tag: Tag,
  calendar: Calendar,
  target: Target,
  package: Package,
} as const;

export default function UserPage({ user }: { user: User }) {
  if (!user) return <div>User not found</div>;

  const { preferences } = user;

  // Prepare affinity cards data
  const affinityCards = useMemo(() => {
    const cards: { title: string; items: { label: string; score: number }[]; icon: React.ComponentType<{ className?: string }> }[] = [];

    // Iterate through each preference key and create cards
    (Object.keys(preferences) as PreferenceKey[]).forEach((key) => {
      const preferenceData = preferences[key];

      if (preferenceData && Object.keys(preferenceData).length > 0) {
        const metadata = PREFERENCE_METADATA[key];

        if (metadata) {
          cards.push({
            title: metadata.title,
            items: preferencesToItems(preferenceData),
            icon: iconMap[metadata.icon],
          });
        }
      }
    });

    return cards;
  }, [preferences]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-4xl font-bold">{user.description}</h1>
        <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm font-medium">
          Historical profile
        </span>
      </div>

      {/* User ID */}
      <div className="mb-8">
        <span className="text-sm text-gray-500">User ID:</span>
        <span className="ml-2 text-sm font-mono text-gray-700">{user.id}</span>
      </div>

      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-3xl font-semibold">Your affinities</h2>
        <span className="flex items-center gap-2 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-sm font-medium">
          For you
        </span>
      </div>

      {/* Affinity Cards Grid */}
      {affinityCards.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {affinityCards.map((card, index) => (
            <AffinityCard
              key={`${card.title}-${index}`}
              title={card.title}
              items={card.items}
              icon={card.icon}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No affinities available for this user.
        </div>
      )}
    </div>
  );
}

// components/navbar/user-selector.tsx
"use client";
import { useRouter } from "next/navigation";
import { UserIcon, ExternalLink, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { users } from "@/lib/demo-config/users";
import { useUser } from "@/components/user/user-context";

export function UserSelector() {
  const router = useRouter();
  const { selectUserById, currentUser, setUser } = useUser();

  const handleSelectUser = (userId: string) => {
    selectUserById(userId);
  };

  const handleClearUser = () => {
    setUser(null);
  };

  const handleNavigateToUser = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={currentUser ? "default" : "icon"}
          aria-label={currentUser ? `Selected: ${currentUser.description}` : "Select user profile"}
        >
          {currentUser ? (
            <span className="flex items-center gap-2">
              <UserIcon className="size-4" />
              <span className="hidden sm:inline">{currentUser.description}</span>
            </span>
          ) : (
            <UserIcon className="size-8" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
        <DropdownMenuLabel>Select Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currentUser && (
          <>
            <DropdownMenuItem
              onClick={handleClearUser}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span>Clear selection</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => handleSelectUser(user.id)}
            className="flex items-center justify-between gap-2 text-nowrap"
          >
            <span>{user.description}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToUser(user.id);
              }}
              aria-label={`Navigate to ${user.description} profile`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

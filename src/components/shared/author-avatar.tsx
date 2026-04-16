import Image from "next/image";
import { cn } from "@/lib/utils";

// Small circular avatar rendered alongside author attribution. Accepts a
// raw Supabase public URL (including the ?v= cache-buster appended by
// uploadAvatar) or null for the initial fallback. Used in every list
// component that shows an author name so avatars roll out evenly.

interface AuthorAvatarProps {
  avatarUrl: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  className?: string;
}

export function AuthorAvatar({
  avatarUrl,
  name,
  size = 24,
  className,
}: AuthorAvatarProps) {
  const initial = ((name ?? "").trim().charAt(0) || "?").toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn(
          "rounded-full object-cover border border-border/50 shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-medium uppercase shrink-0",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initial}
    </span>
  );
}

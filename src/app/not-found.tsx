import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/en"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Go Home
        </Link>
        <Link
          href="/en/problems"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Browse Problems
        </Link>
      </div>
    </div>
  );
}

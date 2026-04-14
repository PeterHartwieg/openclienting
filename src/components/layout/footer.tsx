import Link from "next/link";
import { CookieSettingsButton } from "./cookie-settings-button";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand — full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold tracking-tight text-primary">
              OpenClienting
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Open-source venture clienting knowledge base. Crowdsourced by the
              community, for the community.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href="/en/problems"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Problems
              </Link>
              <Link
                href="/en/submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Submit a Problem
              </Link>
              <Link
                href="/en/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold">Community</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <a
                href="https://github.com/PeterHartwieg/openclienting"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/PeterHartwieg/openclienting/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contributing
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href="/en/impressum"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Impressum
              </Link>
              <Link
                href="/en/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/en/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <CookieSettingsButton />
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            OpenClienting.org &mdash; Open source &middot; Community driven
          </p>
        </div>
      </div>
    </footer>
  );
}

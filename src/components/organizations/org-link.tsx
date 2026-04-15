import Link from "next/link";

/**
 * Renders an organization name as a link to its public profile IF and only if
 * the organization is verified. Unverified orgs render as plain text — their
 * profile pages are not publicly reachable and would 404.
 *
 * Accepts an already-resolved name so the caller can pass whatever label the
 * surrounding attribution logic already decided on (which may be a translated
 * "Anonymous" placeholder if the row hides the org entirely; in that case the
 * caller should simply not render this component at all).
 */
export function OrgLink({
  name,
  slug,
  verificationStatus,
  locale,
  className,
}: {
  name: string;
  slug: string | null | undefined;
  verificationStatus: string | null | undefined;
  locale: string;
  className?: string;
}) {
  if (slug && verificationStatus === "verified") {
    return (
      <Link
        href={`/${locale}/organizations/${slug}`}
        className={className ?? "hover:underline"}
      >
        {name}
      </Link>
    );
  }
  return <span className={className}>{name}</span>;
}

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getTagsGroupedByCategory } from "@/lib/queries/tags";
import { TagManager } from "@/components/moderate/tag-manager";

export default async function TagManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  try {
    await requireRole("moderator");
  } catch {
    redirect(`/${locale}`);
  }

  const tagsByCategory = await getTagsGroupedByCategory(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Manage Tags</h1>
      <p className="mt-2 text-muted-foreground">
        Add, edit, or remove tags used for categorizing problems.
      </p>
      <div className="mt-8">
        <TagManager tagsByCategory={tagsByCategory} />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getProblemById } from "@/lib/queries/problems";
import { getUserVerifiedMemberships } from "@/lib/queries/organizations";
import { createClient } from "@/lib/supabase/server";
import { TagBadge } from "@/components/shared/tag-badge";
import { SolutionStatusBadge } from "@/components/shared/solution-status-badge";
import { RequirementList } from "@/components/problems/requirement-list";
import { PilotFrameworkList } from "@/components/problems/pilot-framework-list";
import { AddRequirementForm } from "@/components/problems/add-requirement-form";
import { AddPilotFrameworkForm } from "@/components/problems/add-pilot-framework-form";
import { SolutionApproachList } from "@/components/problems/solution-approach-list";
import { AddSolutionApproachForm } from "@/components/problems/add-solution-approach-form";
import { CommentThread } from "@/components/comments/comment-thread";
import { CommentForm } from "@/components/comments/comment-form";
import { EditProblemForm } from "@/components/problems/edit-problem-form";
import { SuggestEditForm } from "@/components/problems/suggest-edit-form";
import { Separator } from "@/components/ui/separator";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  let problem;
  try {
    problem = await getProblemById(id);
  } catch {
    notFound();
  }

  if (!problem) notFound();

  // Get current user's votes for this problem's content
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVotedRequirements = new Set<string>();
  let userVotedFrameworks = new Set<string>();
  let userVotedApproaches = new Set<string>();
  let verifiedOrgs: { membershipId: string; role: string; orgId: string; orgName: string }[] = [];

  if (user) {
    verifiedOrgs = await getUserVerifiedMemberships(user.id);
    const reqIds = (problem.requirements ?? []).map((r: { id: string }) => r.id);
    const fwIds = (problem.pilot_frameworks ?? []).map((f: { id: string }) => f.id);
    const saIds = (problem.solution_approaches ?? []).map((s: { id: string }) => s.id);

    if (reqIds.length > 0) {
      const { data: reqVotes } = await supabase
        .from("votes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "requirement")
        .in("target_id", reqIds);
      userVotedRequirements = new Set(reqVotes?.map((v) => v.target_id) ?? []);
    }

    if (fwIds.length > 0) {
      const { data: fwVotes } = await supabase
        .from("votes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "pilot_framework")
        .in("target_id", fwIds);
      userVotedFrameworks = new Set(fwVotes?.map((v) => v.target_id) ?? []);
    }

    if (saIds.length > 0) {
      const { data: saVotes } = await supabase
        .from("votes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "solution_approach")
        .in("target_id", saIds);
      userVotedApproaches = new Set(saVotes?.map((v) => v.target_id) ?? []);
    }
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, is_publicly_anonymous, parent_comment_id, created_at, profiles!comments_author_id_fkey(display_name)")
    .eq("target_type", "problem_template")
    .eq("target_id", id)
    .order("created_at", { ascending: true });

  const tags = (problem.problem_tags ?? [])
    .map((pt: { tags: { id: string; name: string; slug: string; category: string } | null }) => pt.tags)
    .filter(Boolean);

  const publishedRequirements = (problem.requirements ?? [])
    .filter((r: { status: string }) => r.status === "published")
    .sort((a: { upvote_count: number }, b: { upvote_count: number }) => b.upvote_count - a.upvote_count);

  const publishedFrameworks = (problem.pilot_frameworks ?? [])
    .filter((f: { status: string }) => f.status === "published")
    .sort((a: { upvote_count: number }, b: { upvote_count: number }) => b.upvote_count - a.upvote_count);

  const publishedApproaches = (problem.solution_approaches ?? [])
    .filter((s: { status: string }) => s.status === "published")
    .sort((a: { upvote_count: number }, b: { upvote_count: number }) => b.upvote_count - a.upvote_count);

  // Normalize comments for the thread component
  const normalizedComments = (comments ?? []).map((c) => ({
    ...c,
    profiles: c.profiles as unknown as { display_name: string | null } | null,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>
          <SolutionStatusBadge status={problem.solution_status ?? "unsolved"} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Submitted by{" "}
          {problem.is_publicly_anonymous
            ? "Anonymous"
            : problem.profiles?.display_name ?? "Unknown"}
          {" · "}
          {new Date(problem.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag: { id: string; name: string; category: string }) => (
              <TagBadge key={tag.id} name={tag.name} category={tag.category} />
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Description */}
      <section>
        <h2 className="text-xl font-semibold">Description</h2>
        <div className="mt-4">
          <p className="whitespace-pre-wrap text-sm">{problem.description}</p>
        </div>
        {user && user.id === problem.author_id && problem.status === "published" && (
          <div className="mt-4">
            <EditProblemForm
              problemId={problem.id}
              currentTitle={problem.title}
              currentDescription={problem.description}
            />
          </div>
        )}
        {user && user.id !== problem.author_id && problem.status === "published" && (
          <div className="mt-4">
            <SuggestEditForm
              targetType="problem_template"
              targetId={problem.id}
              fields={[
                { key: "title", label: "Title", value: problem.title },
                { key: "description", label: "Description", value: problem.description, multiline: true },
              ]}
            />
          </div>
        )}
      </section>

      <Separator className="my-8" />

      {/* Requirements */}
      <section>
        <h2 className="text-xl font-semibold">
          Requirements ({publishedRequirements.length})
        </h2>
        <div className="mt-4">
          <RequirementList
            requirements={publishedRequirements}
            userVotes={userVotedRequirements}
            currentUserId={user?.id}
          />
        </div>
        {user && (
          <div className="mt-4">
            <AddRequirementForm problemId={problem.id} />
          </div>
        )}
      </section>

      <Separator className="my-8" />

      {/* Pilot Frameworks */}
      <section>
        <h2 className="text-xl font-semibold">
          Pilot Frameworks ({publishedFrameworks.length})
        </h2>
        <div className="mt-4">
          <PilotFrameworkList
            frameworks={publishedFrameworks}
            userVotes={userVotedFrameworks}
            currentUserId={user?.id}
          />
        </div>
        {user && (
          <div className="mt-4">
            <AddPilotFrameworkForm problemId={problem.id} />
          </div>
        )}
      </section>

      <Separator className="my-8" />

      {/* Solution Approaches */}
      <section>
        <h2 className="text-xl font-semibold">
          Solution Approaches ({publishedApproaches.length})
        </h2>
        <div className="mt-4">
          <SolutionApproachList
            approaches={publishedApproaches}
            userVotes={userVotedApproaches}
            isAuthenticated={!!user}
            currentUserId={user?.id}
            verifiedOrgs={verifiedOrgs}
          />
        </div>
        {user && (
          <div className="mt-4">
            <AddSolutionApproachForm problemId={problem.id} />
          </div>
        )}
      </section>

      <Separator className="my-8" />

      {/* Discussion */}
      <section>
        <h2 className="text-xl font-semibold">
          Discussion ({normalizedComments.filter((c) => !c.parent_comment_id).length})
        </h2>
        <div className="mt-4">
          <CommentThread comments={normalizedComments} />
        </div>
        {user && (
          <div className="mt-4">
            <CommentForm targetId={problem.id} />
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { proposeKnowledgeArticle } from "@/lib/actions/knowledge-articles";
import type { KnowledgeArticleFaqItem } from "@/lib/types/database";

/**
 * Full structured propose-article form. Mirrors the spoke row shape in
 * `knowledge_articles` — slug + locale + title + lede + SEO metadata +
 * the tldr / detail / faq triplets + tags. Submits as `status='submitted'`
 * via `proposeKnowledgeArticle`; moderator approval happens in the
 * moderation queue.
 *
 * The form is deliberately plain HTML-array style: TL;DR / detail bullets
 * come in as newline-separated textareas, FAQ uses `Q: ... / A: ...`
 * lines. This keeps Phase 1 lightweight — a richer nested editor can
 * replace this later without changing the server action contract.
 */

interface ProposeArticleFormProps {
  locale: string;
}

function parseFaq(raw: string): KnowledgeArticleFaqItem[] {
  // Accept blocks like:
  //   Q: What is X?
  //   A: X is ...
  // separated by blank lines. Unparseable blocks are dropped silently —
  // the server action also filters empties, so we don't need to be strict.
  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const items: KnowledgeArticleFaqItem[] = [];
  for (const block of blocks) {
    const qMatch = block.match(/^Q:\s*(.+?)(?:\n|$)/);
    const aMatch = block.match(/\nA:\s*([\s\S]+)$/);
    if (qMatch && aMatch) {
      items.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
    }
  }
  return items;
}

export function ProposeArticleForm({ locale }: ProposeArticleFormProps) {
  const router = useRouter();
  const ka = useTranslations("knowledgeArticle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [shortLabel, setShortLabel] = useState("");
  const [lede, setLede] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [tldrTitle, setTldrTitle] = useState("TL;DR");
  const [tldrRaw, setTldrRaw] = useState("");
  const [detailTitle, setDetailTitle] = useState("");
  const [detailIntro, setDetailIntro] = useState("");
  const [detailBulletsRaw, setDetailBulletsRaw] = useState("");
  const [faqTitle, setFaqTitle] = useState("FAQ");
  const [faqRaw, setFaqRaw] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const tldr = tldrRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    const detailBullets = detailBulletsRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const faq = parseFaq(faqRaw);
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

    startTransition(async () => {
      const result = await proposeKnowledgeArticle({
        slug,
        locale,
        title,
        shortLabel,
        lede,
        metaTitle,
        metaDescription,
        tldrTitle,
        tldr,
        detailTitle,
        detailIntro,
        detailBullets,
        faqTitle,
        faq,
        tags,
      });
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? "Unknown error");
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-sm">
        {ka("proposeSuccess")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="slug">{ka("fieldSlug")}</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-new-article"
          required
        />
        <p className="text-xs text-muted-foreground">{ka("fieldSlugHelp")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{ka("fieldTitle")}</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortLabel">{ka("fieldShortLabel")}</Label>
        <Input
          id="shortLabel"
          value={shortLabel}
          onChange={(e) => setShortLabel(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lede">{ka("fieldLede")}</Label>
        <Textarea id="lede" value={lede} onChange={(e) => setLede(e.target.value)} rows={3} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaTitle">{ka("fieldMetaTitle")}</Label>
        <Input
          id="metaTitle"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaDescription">{ka("fieldMetaDescription")}</Label>
        <Textarea
          id="metaDescription"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tldrTitle">{ka("fieldTldrTitle")}</Label>
        <Input
          id="tldrTitle"
          value={tldrTitle}
          onChange={(e) => setTldrTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tldr">{ka("fieldTldr")}</Label>
        <Textarea
          id="tldr"
          value={tldrRaw}
          onChange={(e) => setTldrRaw(e.target.value)}
          rows={5}
          placeholder="First bullet\nSecond bullet\nThird bullet"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detailTitle">{ka("fieldDetailTitle")}</Label>
        <Input
          id="detailTitle"
          value={detailTitle}
          onChange={(e) => setDetailTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detailIntro">{ka("fieldDetailIntro")}</Label>
        <Textarea
          id="detailIntro"
          value={detailIntro}
          onChange={(e) => setDetailIntro(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detailBullets">{ka("fieldDetailBullets")}</Label>
        <Textarea
          id="detailBullets"
          value={detailBulletsRaw}
          onChange={(e) => setDetailBulletsRaw(e.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="faqTitle">{ka("fieldFaqTitle")}</Label>
        <Input
          id="faqTitle"
          value={faqTitle}
          onChange={(e) => setFaqTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="faq">{ka("fieldFaq")}</Label>
        <Textarea
          id="faq"
          value={faqRaw}
          onChange={(e) => setFaqRaw(e.target.value)}
          rows={8}
          placeholder={"Q: What is X?\nA: X is the thing that...\n\nQ: Why does X matter?\nA: Because..."}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">{ka("fieldTags")}</Label>
        <Input
          id="tags"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="venture-clienting, fundamentals, pilot"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? ka("proposeSubmitting") : ka("proposeSubmit")}
        </Button>
      </div>
    </form>
  );
}

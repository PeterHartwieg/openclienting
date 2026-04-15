-- ============================================================
-- Seed knowledge_articles from the existing i18n content
-- ============================================================
--
-- Seeds the 7 venture-clienting pages that previously lived in
-- `src/messages/en.json` + `de.json` as i18n keys:
--
--   • hub (`/[locale]/venture-clienting`) — seeded EN + DE (hub was
--     fully translated to German in the i18n files)
--   • 6 spokes — seeded EN only. The existing DE spoke rows in
--     de.json were English mirrors flagged as PENDING translation, so
--     we do not duplicate them here. The query layer falls back to
--     the `en` row when the requested locale is absent, preserving
--     today's behavior for German visitors on spoke pages while
--     leaving a clean seam for crowd-sourced German translations
--     (users will propose them via the same new-article flow and
--     moderators approve them through the existing mod queue).
--
-- All seeded rows have `author_id = NULL` (system-seeded, no human)
-- and `status = 'published'`. Migrations run with RLS bypassed so the
-- "authors can only insert as themselves into 'submitted'" policy in
-- migration 021 is not an obstacle here.
--
-- Tags drive sibling auto-pick (the "Related in this cluster" block).
-- The seeded tag sets are chosen so every spoke shares at least one
-- tag with two other spokes, recreating the hand-curated sibling
-- pairings that used to live in `SPOKES` in
-- `src/lib/venture-clienting-cluster/config.ts`.

-- -----------------------------------------------------------------
-- Hub: English
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  sections, tags, sort_order, status
) values (
  'index', 'en', 'hub',
  $$What is venture clienting?$$,
  $$What is venture clienting?$$,
  $$Venture clienting is how established companies work with top startups — by becoming their paying client. Not their investor, not their first-ever customer. The startup already has a working solution; the company adopts it through a normal vendor engagement. OpenClienting is the open, crowdsourced knowledge base behind it.$$,
  $$What is venture clienting? — OpenClienting$$,
  $$Venture clienting is how companies become clients of top startups that already solve their problem — without taking equity. OpenClienting is the open, crowdsourced knowledge base for it.$$,
  jsonb_build_array(
    jsonb_build_object(
      'title', $$The idea in one paragraph$$,
      'body',  $$A company publishes a problem. Top startups that already have a solution propose how they'd pilot it. The best fit runs a short, structured pilot with clear success criteria. When it works, the company scales it up as a normal vendor engagement — a paying client relationship, not an equity stake and not a speculative first-customer experiment. No cap table, no board seat, no multi-year negotiation.$$
    ),
    jsonb_build_object(
      'title', $$How is it different from corporate venture capital?$$,
      'body',  $$Corporate VC buys equity and hopes for a financial return years later. Venture clienting buys a solution — the company becomes a paying client of a startup whose technology already works. It's faster, cheaper, and outcome-oriented: a normal vendor relationship around a specific problem, not a speculative bet on an unproven team.$$
    ),
    jsonb_build_object(
      'title', $$What companies get out of it$$,
      'body',  $$A published problem is a filter. Instead of fielding 50 cold pitches a month, you see the startups whose solutions already match your explicit requirements. Reuse peer-validated problem templates, KPIs, and pilot frameworks from companies who've already been stuck on the same thing — and publish anonymously if the pain is sensitive.$$
    ),
    jsonb_build_object(
      'title', $$What startups get out of it$$,
      'body',  $$Every problem on the site is a real company actively sourcing a proven solution — not a VC pitch, not an accelerator application. Propose a pilot against explicit requirements and, when it lands, enter a normal paying client engagement plus a verified success badge that follows your solution across the platform.$$
    ),
    jsonb_build_object(
      'title', $$Why an open knowledge base$$,
      'body',  $$Most venture clienting programs today are closed inside big-company innovation teams. The problem templates, requirements, and pilot playbooks they build get locked behind NDAs and never benefit anyone else. OpenClienting is the opposite bet: make the knowledge base open, let smaller SMEs tap into proven startup solutions, and let top startups be discovered by the companies that actually need them.$$
    )
  ),
  array['venture-clienting', 'fundamentals']::text[],
  0,
  'published'
);

-- -----------------------------------------------------------------
-- Hub: German (fully translated in de.json)
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  sections, tags, sort_order, status
) values (
  'index', 'de', 'hub',
  $$Was ist Venture Clienting?$$,
  $$Was ist Venture Clienting?$$,
  $$Venture Clienting ist der Weg, wie etablierte Unternehmen mit Top-Startups zusammenarbeiten — als zahlender Kunde. Nicht als Investor, nicht als deren allererster Kunde. Das Startup hat bereits eine funktionierende Lösung; das Unternehmen führt sie über ein ganz normales Anbieter-Engagement ein. OpenClienting ist die offene, crowdgesourcte Wissensdatenbank dahinter.$$,
  $$Was ist Venture Clienting? — OpenClienting$$,
  $$Venture Clienting ist der Weg, Kunde von Top-Startups zu werden, die dein Problem bereits lösen — ohne Equity zu nehmen. OpenClienting ist die offene, crowdgesourcte Wissensdatenbank dafür.$$,
  jsonb_build_array(
    jsonb_build_object(
      'title', $$Die Idee in einem Absatz$$,
      'body',  $$Ein Unternehmen veröffentlicht ein Problem. Top-Startups, die bereits eine Lösung haben, schlagen vor, wie sie es pilotieren würden. Die beste Option läuft als kurzer, strukturierter Pilot mit klaren Erfolgskriterien. Wenn es funktioniert, skaliert das Unternehmen es als reguläres Anbieter-Engagement — ein zahlendes Kundenverhältnis, kein Equity-Stake und kein spekulatives Erstkunden-Experiment. Kein Cap Table, kein Board-Sitz, keine mehrjährigen Verhandlungen.$$
    ),
    jsonb_build_object(
      'title', $$Wie unterscheidet es sich von Corporate Venture Capital?$$,
      'body',  $$Corporate VC kauft Equity und hofft Jahre später auf finanzielle Rendite. Venture Clienting kauft eine Lösung — das Unternehmen wird zahlender Kunde eines Startups, dessen Technologie bereits funktioniert. Es ist schneller, günstiger und ergebnisorientiert: ein reguläres Anbieter-Verhältnis rund um ein konkretes Problem, keine spekulative Wette auf ein unerprobtes Team.$$
    ),
    jsonb_build_object(
      'title', $$Was Unternehmen davon haben$$,
      'body',  $$Ein veröffentlichtes Problem ist ein Filter. Statt 50 Cold-Pitches pro Monat siehst du die Startups, deren Lösungen bereits zu deinen expliziten Anforderungen passen. Verwende peer-validierte Problemvorlagen, KPIs und Pilot-Frameworks von Unternehmen, die schon dasselbe Problem hatten — und veröffentliche anonym, wenn der Schmerz sensibel ist.$$
    ),
    jsonb_build_object(
      'title', $$Was Startups davon haben$$,
      'body',  $$Jedes Problem auf der Seite stammt von einem echten Unternehmen, das aktiv eine bewährte Lösung sucht — kein VC-Pitch, keine Accelerator-Bewerbung. Schlage einen Piloten gegen explizite Anforderungen vor und lande, wenn er erfolgreich ist, ein reguläres zahlendes Kundenverhältnis plus ein verifiziertes Success-Badge, das deiner Lösung auf der gesamten Plattform folgt.$$
    ),
    jsonb_build_object(
      'title', $$Warum eine offene Wissensdatenbank$$,
      'body',  $$Die meisten Venture-Clienting-Programme heute sind in Innovationsabteilungen großer Konzerne eingeschlossen. Die Problemvorlagen, Anforderungen und Pilot-Playbooks, die sie erarbeiten, landen hinter NDAs und nützen sonst niemandem. OpenClienting setzt auf das Gegenteil: die Wissensdatenbank öffnen, kleineren KMU den Zugang zu bewährten Startup-Lösungen ermöglichen — und Top-Startups von den Unternehmen entdecken lassen, die sie tatsächlich brauchen.$$
    )
  ),
  array['venture-clienting', 'fundamentals']::text[],
  0,
  'published'
);

-- -----------------------------------------------------------------
-- Spoke 1: what-is-venture-clienting (EN)
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  tldr_title, tldr, detail_title, detail_intro, detail_bullets, faq_title, faq,
  tags, sort_order, status
) values (
  'what-is-venture-clienting', 'en', 'spoke',
  $$What is venture clienting?$$,
  $$What is venture clienting?$$,
  $$Venture clienting is the practice of an established company becoming a paying client of a startup whose solution already works — as a normal vendor, not an investor. No equity changes hands, no accelerator program is involved, and the startup is not the company's experimental first customer. The engagement is a real commercial contract around a specific problem.$$,
  $$What is venture clienting? Definition and how it works — OpenClienting$$,
  $$Venture clienting is a model where an established company becomes a paying client of a startup whose solution already works — no equity, no accelerator, just a normal vendor engagement around a specific problem.$$,
  $$In short$$,
  jsonb_build_array(
    $$A company publishes a real problem and signs a normal vendor contract with a startup whose technology already solves it — no equity, no board seat.$$,
    $$It is the opposite of corporate venture capital: the buyer pays for an outcome today, not a financial return years later.$$,
    $$Pilots are short, scoped, and measured against explicit success criteria the company defined up front.$$
  ),
  $$How a venture clienting engagement works$$,
  $$A venture clienting engagement follows the same four beats regardless of industry, company size, or technology. The point is that the startup's solution is already built — nothing here is speculative.$$,
  jsonb_build_array(
    $$Problem definition — the company articulates a specific problem with explicit requirements, KPIs, and success criteria, ideally reusing a peer-validated template.$$,
    $$Startup match — top startups whose solution already works propose how they would adopt it to the company's context, measured against those explicit requirements.$$,
    $$Structured pilot — a short, scoped pilot with a defined duration, budget, and success criteria runs inside the company. No open-ended exploration.$$,
    $$Commercial rollout — when the pilot hits its criteria, the startup enters a normal paying-client contract with the company. The relationship is a vendor engagement, not an investment.$$
  ),
  $$Frequently asked questions$$,
  jsonb_build_array(
    jsonb_build_object('question', $$Who invented venture clienting?$$,                                                                      'answer', $$The term was popularized by the venture clienting model adopted inside large corporate innovation teams in the 2010s, most visibly by BMW Startup Garage. OpenClienting's contribution is to open up the knowledge base of problem templates, pilot frameworks, and verified outcomes so smaller SMEs can run the same playbook.$$),
    jsonb_build_object('question', $$Is venture clienting only for large corporations?$$,                                                    'answer', $$No. The model works for any company that has a real problem and prefers paying for a working solution over building it in-house or taking an equity stake. SMEs often benefit more because they lack the budget to run a full CVC arm and cannot afford long-cycle bets.$$),
    jsonb_build_object('question', $$Does the company take equity in the startup?$$,                                                         'answer', $$No — that is the defining difference from corporate venture capital. The company pays for a solution, not a stake. The startup keeps its cap table clean and the company avoids governance entanglements.$$),
    jsonb_build_object('question', $$How long does a typical pilot run?$$,                                                                   'answer', $$Most pilots run between 6 and 12 weeks with a clear budget and a short list of pre-agreed success criteria. Longer pilots usually indicate unclear requirements, not technical complexity.$$)
  ),
  array['venture-clienting', 'fundamentals', 'definition']::text[],
  1,
  'published'
);

-- -----------------------------------------------------------------
-- Spoke 2: venture-clienting-vs-corporate-venture-capital (EN)
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  tldr_title, tldr, detail_title, detail_intro, detail_bullets, faq_title, faq,
  tags, sort_order, status
) values (
  'venture-clienting-vs-corporate-venture-capital', 'en', 'spoke',
  $$Venture clienting vs corporate venture capital$$,
  $$Venture clienting vs CVC$$,
  $$Venture clienting and corporate venture capital are often lumped together as ways for established companies to work with startups, but they are almost opposite strategies. Venture clienting buys a working solution through a normal vendor contract. CVC buys equity and waits for a financial return years later.$$,
  $$Venture clienting vs corporate venture capital — OpenClienting$$,
  $$Venture clienting buys a solution today through a normal vendor contract. Corporate venture capital buys equity and hopes for a financial return years later. Here is how the two compare in practice.$$,
  $$The short version$$,
  jsonb_build_array(
    $$Venture clienting pays the startup for a solution; CVC takes an equity stake and hopes for an exit.$$,
    $$Venture clienting closes in weeks or months; CVC closes over years.$$,
    $$Venture clienting is run by procurement, innovation, or a business unit owner; CVC is run by an investment team.$$
  ),
  $$Side-by-side differences$$,
  $$Both models involve a large established company working with a startup, but they diverge on almost every practical dimension that matters for day-to-day execution. The most important axes:$$,
  jsonb_build_array(
    $$What the company pays for — venture clienting pays for an outcome against a specific problem; CVC pays for equity and optionality on the startup's future.$$,
    $$Time horizon — venture clienting measures success against a pilot that ends in weeks; CVC measures success against an exit that may be 5–10 years away.$$,
    $$Risk model — venture clienting's downside is a failed pilot that cost one budget cycle; CVC's downside is illiquid capital tied to a startup that may never exit.$$,
    $$Who runs it internally — venture clienting is typically driven by a business unit that has the problem; CVC sits inside a separate investment arm with portfolio-level goals.$$
  ),
  $$Frequently asked questions$$,
  jsonb_build_array(
    jsonb_build_object('question', $$Can a company do both?$$,                            'answer', $$Yes, and many do. CVC handles the long-horizon strategic bets while venture clienting handles the near-term procurement-style engagements. They complement each other if the internal teams are kept separate and measured on different KPIs.$$),
    jsonb_build_object('question', $$Which is faster for the startup?$$,                 'answer', $$Venture clienting is nearly always faster for a startup that already has a working product. The sales cycle is a pilot contract, not equity due diligence, and revenue lands in weeks rather than quarters.$$),
    jsonb_build_object('question', $$Is venture clienting just dressed-up procurement?$$, 'answer', $$It is closer to procurement than to investment, yes — but with extra discipline around peer-validated problem templates and pilot frameworks. The difference from vanilla procurement is the structured matching of early-stage startups to real problems, and the reuse of success reports across companies.$$),
    jsonb_build_object('question', $$Do startups prefer one over the other?$$,            'answer', $$Most early-stage startups prefer venture clienting because revenue validates the solution and the cap table stays intact. Later-stage startups may take both if the CVC check also opens strategic doors inside the corporate.$$)
  ),
  array['venture-clienting', 'cvc', 'comparison']::text[],
  2,
  'published'
);

-- -----------------------------------------------------------------
-- Spoke 3: startup-pilot-framework (EN)
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  tldr_title, tldr, detail_title, detail_intro, detail_bullets, faq_title, faq,
  tags, sort_order, status
) values (
  'startup-pilot-framework', 'en', 'spoke',
  $$Startup pilot framework$$,
  $$Startup pilot framework$$,
  $$A startup pilot framework is the structured playbook a company uses to run a short, scoped evaluation of a startup's solution against explicit success criteria. A good framework turns a pilot from an open-ended experiment into a go/no-go decision in weeks.$$,
  $$Startup pilot framework — how to structure a venture clienting pilot — OpenClienting$$,
  $$A startup pilot framework is the structured playbook a company uses to evaluate a startup solution against explicit requirements. Here is the anatomy of a good one.$$,
  $$What a good framework includes$$,
  jsonb_build_array(
    $$A fixed duration and budget — no open-ended pilots.$$,
    $$Pre-agreed success criteria and KPIs, written down before the pilot starts.$$,
    $$A named internal owner on the company side and a go/no-go decision date.$$
  ),
  $$The five components of a pilot framework$$,
  $$Every well-run venture clienting pilot has the same structural pieces. Skip any of them and the pilot becomes an open-ended experiment that never converges on a decision.$$,
  jsonb_build_array(
    $$Scope — which parts of the company's workflow the pilot touches, and which it deliberately does not. Tight scopes finish on time.$$,
    $$Success criteria — a short, written list of measurable outcomes. Three to five is enough; ten is too many to act on.$$,
    $$Duration and budget — a fixed end date and a fixed spend, set before the pilot starts. If either slips, that is a signal the scope was wrong.$$,
    $$Owner and decision process — a named person inside the company owns the pilot, and the decision to scale or stop is scheduled on the calendar from day one.$$
  ),
  $$Frequently asked questions$$,
  jsonb_build_array(
    jsonb_build_object('question', $$How long should a pilot run?$$,                                                       'answer', $$Between 6 and 12 weeks for most business-software pilots. Hardware or regulated-industry pilots may run longer, but even then the scope should be tight enough to produce a decision within a single budget cycle.$$),
    jsonb_build_object('question', $$Who sets the success criteria — the company or the startup?$$,                        'answer', $$The company. The startup can propose KPIs that reflect what its solution actually does well, but the final success criteria must belong to the buyer. Otherwise the pilot measures whatever the startup is good at, not whether the problem is solved.$$),
    jsonb_build_object('question', $$What if the pilot technically succeeds but the company still doesn't roll out?$$,      'answer', $$That almost always means the success criteria missed something the buyer actually cared about. Common culprits: integration effort, total cost of ownership, or organizational readiness. Record what was missed so the next pilot template includes it.$$),
    jsonb_build_object('question', $$Can the same framework work across industries?$$,                                     'answer', $$The structural pieces (scope, KPIs, duration, owner, decision process) are industry-agnostic. The specific KPIs, acceptable durations, and required integrations vary a lot — which is why peer-validated templates by industry and function are useful starting points.$$)
  ),
  array['pilots', 'frameworks', 'venture-clienting']::text[],
  3,
  'published'
);

-- -----------------------------------------------------------------
-- Spoke 4: problem-template (EN)
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  tldr_title, tldr, detail_title, detail_intro, detail_bullets, faq_title, faq,
  tags, sort_order, status
) values (
  'problem-template', 'en', 'spoke',
  $$Open innovation problem template$$,
  $$Problem template$$,
  $$A problem template is a structured description of a real company problem — written so that top startups can respond with solutions that already work. The point of the template is to make the problem specific enough that the company is not drowned in off-topic pitches.$$,
  $$Open innovation problem template — how to publish a real company problem — OpenClienting$$,
  $$A problem template is a structured description of a real company problem that startups can respond to with proven solutions. Here is what a good one contains.$$,
  $$What belongs in a problem template$$,
  jsonb_build_array(
    $$A one-sentence statement of the problem and who it affects.$$,
    $$Explicit requirements and constraints the solution must meet.$$,
    $$Success criteria and KPIs the company will use to judge a pilot.$$
  ),
  $$The sections of a good problem template$$,
  $$On OpenClienting every published problem follows roughly the same shape, because peer-validated templates produce better-matched startup responses than free-form posts. A complete template has these sections:$$,
  jsonb_build_array(
    $$Description — a plain-language statement of the problem, what has been tried, and what success looks like. Written so a non-expert can follow it.$$,
    $$Requirements — peer-submitted, upvoted constraints the solution must satisfy (integrations, compliance, data residency, performance).$$,
    $$Pilot framework — the scope, duration, KPIs, and budget the company is willing to commit to a pilot.$$,
    $$Tags and context — industry, function, company size, and problem category so startups can filter for the problems they can actually solve.$$
  ),
  $$Frequently asked questions$$,
  jsonb_build_array(
    jsonb_build_object('question', $$Can I publish a problem anonymously?$$,           'answer', $$Yes. OpenClienting's per-submission anonymity toggle lets you publish a problem without exposing your company name. Your identity is stored server-side for moderation but not shown to other users or startups.$$),
    jsonb_build_object('question', $$How specific should the problem description be?$$, 'answer', $$Specific enough that an off-topic startup pitch is obviously a mismatch, but not so narrow that it rules out creative solutions. A good test: could two engineers from different companies read the description and agree on what counts as a successful pilot?$$),
    jsonb_build_object('question', $$Who writes the requirements?$$,                   'answer', $$Anyone on the platform can propose a requirement, and the community upvotes the ones that matter. The original author does not have to write every requirement — peer contributions usually surface constraints the author missed.$$),
    jsonb_build_object('question', $$Can I reuse someone else's template?$$,           'answer', $$That is the whole point of the knowledge base. Problems are published under an open license so you can fork the template, adapt it to your context, and publish your own version. Peer-validated templates beat drafting from scratch every time.$$)
  ),
  array['templates', 'problems', 'open-innovation']::text[],
  4,
  'published'
);

-- -----------------------------------------------------------------
-- Spoke 5: sme-open-innovation (EN)
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  tldr_title, tldr, detail_title, detail_intro, detail_bullets, faq_title, faq,
  tags, sort_order, status
) values (
  'sme-open-innovation', 'en', 'spoke',
  $$Open innovation for SMEs$$,
  $$Open innovation for SMEs$$,
  $$Open innovation is usually associated with large corporates who can afford a dedicated innovation team. But the underlying idea — tapping into proven external solutions instead of building everything in-house — works even better for small and mid-sized companies, because SMEs have leaner procurement and fewer internal legacy constraints.$$,
  $$Open innovation for SMEs — how smaller companies run venture clienting — OpenClienting$$,
  $$Open innovation is not just for corporates. SMEs can run venture clienting with peer-validated problem templates and proven startup solutions — without a dedicated innovation team.$$,
  $$Why SMEs benefit more, not less$$,
  jsonb_build_array(
    $$No legacy CVC arm to protect, no multi-year strategy committee to convince.$$,
    $$Peer-validated templates let one or two people run a rigorous pilot without a dedicated innovation department.$$,
    $$Paying for a working solution is cheaper and faster than building it in-house at SME scale.$$
  ),
  $$How an SME runs venture clienting in practice$$,
  $$An SME does not need an innovation team, a venture arm, or a dedicated budget line. What it needs is a defined problem, a short list of candidate startups, and a structured pilot. Specifically:$$,
  jsonb_build_array(
    $$One internal owner — usually the person who feels the problem most, not a dedicated innovation manager.$$,
    $$A peer-validated problem template — fork one that another SME in the same industry has already published.$$,
    $$A short pilot — 6 to 12 weeks, with a fixed budget and pre-agreed success criteria.$$,
    $$A go/no-go decision meeting — scheduled on the calendar before the pilot starts, not negotiated after.$$
  ),
  $$Frequently asked questions$$,
  jsonb_build_array(
    jsonb_build_object('question', $$Do SMEs have enough leverage to attract good startups?$$,               'answer', $$Yes — and often more than corporates, because SMEs close faster. A well-defined pilot with a real budget and a 4-week decision window is more attractive to an early-stage startup than a corporate procurement process that takes six months.$$),
    jsonb_build_object('question', $$How do SMEs find startups in the first place?$$,                        'answer', $$On OpenClienting, startups propose solution approaches directly on published problems. The company does not have to run its own scouting — the platform routes matched startups to matched problems.$$),
    jsonb_build_object('question', $$What about confidentiality — can SMEs publish without exposing themselves?$$, 'answer', $$Per-submission anonymity is built in. You can publish a sensitive internal problem without your company name being visible to other users or startups; identity is only stored server-side for moderation.$$),
    jsonb_build_object('question', $$Is this just outsourcing under a new name?$$,                           'answer', $$No — outsourcing hands a function to a service provider. Venture clienting adopts a specific product or technology from a startup, keeping the function internal. The distinction matters for cost, control, and how the contract is structured.$$)
  ),
  array['sme', 'open-innovation', 'venture-clienting']::text[],
  5,
  'published'
);

-- -----------------------------------------------------------------
-- Spoke 6: verified-success-report (EN)
-- -----------------------------------------------------------------
insert into public.knowledge_articles (
  slug, locale, kind, title, short_label, lede, meta_title, meta_description,
  tldr_title, tldr, detail_title, detail_intro, detail_bullets, faq_title, faq,
  tags, sort_order, status
) values (
  'verified-success-report', 'en', 'spoke',
  $$Verified success report$$,
  $$Verified success report$$,
  $$A verified success report is a moderated, publicly visible record that a specific startup's solution passed a specific pilot against a specific company's success criteria. Verification is the trust layer that turns OpenClienting from a directory of problems into a citation-ready knowledge base of proven outcomes.$$,
  $$Verified success report — how OpenClienting certifies pilot outcomes — OpenClienting$$,
  $$A verified success report is a moderated, attributed record that a specific startup solution passed a specific pilot at a specific company. Here is how verification works and why it matters.$$,
  $$What verification means$$,
  jsonb_build_array(
    $$Every success report is attributed to the company that ran the pilot — no anonymous testimonials.$$,
    $$A moderator reviews the evidence before the report is marked verified and becomes visible.$$,
    $$Verified reports follow the solution across the platform — future buyers see who else piloted it successfully.$$
  ),
  $$How verification works in practice$$,
  $$Every success report on OpenClienting goes through the same moderation lifecycle as other content, but with an extra evidence-review step. The key moments:$$,
  jsonb_build_array(
    $$Author submission — the company that ran the pilot files a report with the KPI results, pilot duration, and the success criteria that were met.$$,
    $$Moderator review — a platform moderator reviews the submitted evidence against the original problem's success criteria before marking the report verified.$$,
    $$Public visibility — once verified, the report is visible on the problem page, on the organization's profile, and on the startup's solution approach page.$$,
    $$Persistent badge — the verification badge is attached to the startup's solution approach and follows it to future buyers who view the same problem.$$
  ),
  $$Frequently asked questions$$,
  jsonb_build_array(
    jsonb_build_object('question', $$Is the company's identity visible on a verified report?$$, 'answer', $$By default, yes — verification implies attribution. The value of the report comes from a real company standing behind the outcome. If the company wants to stay anonymous, the author can mark the report as such, but unattributed reports carry less weight and are labeled accordingly.$$),
    jsonb_build_object('question', $$What counts as evidence?$$,                                 'answer', $$Anything that plausibly demonstrates the pilot met its pre-agreed success criteria: KPI measurements, before/after metrics, internal decision memos, or moderator-verified correspondence. Moderators do not publish the raw evidence — they certify that it was reviewed.$$),
    jsonb_build_object('question', $$Who can file a success report?$$,                           'answer', $$The company that ran the pilot, or a verified member of the company's organization on OpenClienting. Startups cannot file success reports about themselves — the report has to come from the buyer side.$$),
    jsonb_build_object('question', $$What happens if a verified report is later disputed?$$,     'answer', $$Moderators can re-open a report if new evidence emerges. The edit history is preserved (authored edits are unrestricted but logged, per the platform's moderation rules), and a disputed report can lose its verified status after review.$$)
  ),
  array['verification', 'success-reports', 'trust']::text[],
  6,
  'published'
);

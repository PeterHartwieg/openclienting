# OpenClienting.org

See `Design.md` for full spec.

## Architecture decisions

- All taxonomy is tag-based, moderator-managed — no hardcoded enums
- Universal lifecycle: `submitted → in_review → published | rejected` (+ optional `draft` for problems/solutions)
- Upvotes backed by VOTE table with unique constraint; counts are cached
- Suggested edits use JSON patch diffs (structured fields + text)
- Author edits unrestricted but logged in EDIT_HISTORY for moderator audit
- Success reports are moderated, visible, and attributed
- Per-submission anonymity toggle; identity always stored server-side
- Server Components by default, `"use client"` only when needed
- RLS on all tables — never bypass in application code
- `[locale]/` route prefix, English strings inline

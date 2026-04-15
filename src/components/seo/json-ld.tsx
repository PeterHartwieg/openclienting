/**
 * Renders JSON-LD as one or more <script type="application/ld+json"> tags.
 *
 * The schema payload MUST come from one of our builders in `src/lib/seo/schema.ts`
 * — never from user input — so JSON.stringify is safe here without additional
 * escaping.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}

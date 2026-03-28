interface EncyclopediaSectionProps {
  heading: string;
  body: string;
}

function renderParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function EncyclopediaSection({
  heading,
  body,
}: EncyclopediaSectionProps) {
  const paragraphs = renderParagraphs(body);

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
        {heading}
      </h2>

      <div className="space-y-4 text-base leading-7 text-neutral-700">
        {paragraphs.map((paragraph) => (
          <p key={`${heading}-${paragraph.slice(0, 32)}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

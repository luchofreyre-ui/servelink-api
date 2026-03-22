import { REVIEW_EXPECTATION_BLOCKS } from "../../content/reviews";

export function ReviewExpectationBlocks() {
  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold">What customers look for</h2>
      <div className="mt-4 space-y-4">
        {REVIEW_EXPECTATION_BLOCKS.map((block) => (
          <article key={block.id} className="rounded-xl border p-4">
            <h3 className="font-medium text-gray-900">{block.title}</h3>
            <p className="mt-2 text-gray-700">{block.body}</p>
            <p className="mt-2 text-sm text-gray-500">{block.contextLabel}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

import { SERVICE_COMPARISONS } from "../../content/comparisons";

export function ServiceComparisonSection() {
  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold">Service comparisons</h2>
      <p className="mt-1 text-gray-600">
        How our cleaning services differ so you can choose the right one.
      </p>
      <ul className="mt-4 space-y-6">
        {SERVICE_COMPARISONS.map((comp, i) => (
          <li key={i} className="rounded-xl border p-4">
            <h3 className="font-medium text-gray-900">{comp.title}</h3>
            <p className="mt-2 text-gray-700">{comp.description}</p>
            <p className="mt-3 flex flex-wrap gap-3 text-sm">
              <a href={`/${comp.serviceSlugA}`} className="text-blue-600 hover:underline">
                {comp.labelA}
              </a>
              <span className="text-gray-400">|</span>
              <a href={`/${comp.serviceSlugB}`} className="text-blue-600 hover:underline">
                {comp.labelB}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

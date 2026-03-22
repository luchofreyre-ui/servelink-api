type ServiceHeroProps = {
  title: string;
  subtitle: string;
  primaryCtaHref: string;
};

export function ServiceHero({ title, subtitle, primaryCtaHref }: ServiceHeroProps) {
  return (
    <section className="py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
      <a
        href={primaryCtaHref}
        className="mt-4 inline-block rounded-xl bg-gray-900 px-6 py-3 text-white no-underline hover:bg-gray-800"
      >
        Book now
      </a>
    </section>
  );
}

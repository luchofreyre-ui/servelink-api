type BookingCtaSectionProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export function BookingCtaSection({ title, description, href, label }: BookingCtaSectionProps) {
  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-gray-700">{description}</p>
      <a
        href={href}
        className="mt-4 inline-block rounded-xl bg-gray-900 px-6 py-3 text-white no-underline hover:bg-gray-800"
      >
        {label}
      </a>
    </section>
  );
}

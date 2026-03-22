type ServiceFaqProps = {
  faqs: { question: string; answer: string }[];
  heading?: string;
};

export function ServiceFaq({ faqs, heading = "Frequently asked questions" }: ServiceFaqProps) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <dl className="mt-3 space-y-4">
        {faqs.map((faq, i) => (
          <div key={i}>
            <dt className="font-medium text-gray-900">{faq.question}</dt>
            <dd className="mt-1 text-gray-700">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

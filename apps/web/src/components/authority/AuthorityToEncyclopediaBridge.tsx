type Props = {
  href: string;
  title: string;
};

export function AuthorityToEncyclopediaBridge({ href, title }: Props) {
  return (
    <div className="mt-8 rounded-lg border border-[#C9B27C]/30 bg-neutral-50 p-4">
      <p className="mb-2 text-sm font-medium text-[#0F172A]">Continue in Encyclopedia</p>
      <a href={href} className="text-blue-600 hover:underline">
        {title}
      </a>
    </div>
  );
}

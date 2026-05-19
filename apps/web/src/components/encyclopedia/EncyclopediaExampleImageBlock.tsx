import Image from "next/image";

type EncyclopediaExampleImageBlockProps = {
  src?: string | null;
  alt: string;
  eyebrow: string;
  caption: string;
};

export function EncyclopediaExampleImageBlock({
  src,
  alt,
  eyebrow,
  caption,
}: EncyclopediaExampleImageBlockProps) {
  if (!src) {
    return null;
  }

  return (
    <figure className="mt-8 overflow-hidden rounded-[28px] border border-[#C9B27C]/16 bg-[#FFFCF7] shadow-[0_22px_64px_-48px_rgba(15,23,42,0.38)]">
      <div className="relative aspect-[16/10] min-h-[220px] bg-[#F4EFE8] sm:min-h-[280px]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover object-center"
        />
      </div>
      <figcaption className="border-t border-[#E8DFD0]/85 bg-white/86 px-5 py-4 sm:px-6">
        <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
          {eyebrow}
        </p>
        <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
          {caption}
        </p>
      </figcaption>
    </figure>
  );
}

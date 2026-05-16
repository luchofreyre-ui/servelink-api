type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ProductSearchBar({ value, onChange }: Props) {
  return (
    <div className="w-full">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by product, brand, category, problem, or surface"
        className="w-full rounded-2xl border border-[#E8DFD0]/95 bg-white px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-0 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#94A3B8] focus:border-[#C9B27C]/55 focus:ring-2 focus:ring-[#C9B27C]/25"
      />
    </div>
  );
}

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
        className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#C9B27C]"
      />
    </div>
  );
}

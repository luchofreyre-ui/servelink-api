type FilterOption = {
  label: string;
  value: string;
};

type FilterGroup = {
  title: string;
  keyName: string;
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
};

export function ProductFilterSidebar({ groups }: { groups: FilterGroup[] }) {
  return (
    <aside className="rounded-[24px] border border-[#E8DFD0]/95 bg-white/90 p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.32)]">
      <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
        Guided filters
      </p>
      <h2 className="mt-2 font-[var(--font-poppins)] text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
        Refine by compatibility
      </h2>

      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <div key={group.keyName}>
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">{group.title}</p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => group.onSelect("")}
                className={`block w-full rounded-xl border px-3 py-2 text-left font-[var(--font-manrope)] text-sm transition-[border-color,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  group.selected === ""
                    ? "border-[#C9B27C]/35 bg-[#F5EFD9] text-[#0F172A]"
                    : "border-[#E8DFD0]/70 bg-[#FFFCF7]/75 text-[#475569] hover:border-[#C9B27C]/30 hover:bg-white"
                }`}
              >
                All
              </button>
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => group.onSelect(option.value)}
                className={`block w-full rounded-xl border px-3 py-2 text-left font-[var(--font-manrope)] text-sm transition-[border-color,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    group.selected === option.value
                    ? "border-[#C9B27C]/35 bg-[#F5EFD9] text-[#0F172A]"
                    : "border-[#E8DFD0]/70 bg-[#FFFCF7]/75 text-[#475569] hover:border-[#C9B27C]/30 hover:bg-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

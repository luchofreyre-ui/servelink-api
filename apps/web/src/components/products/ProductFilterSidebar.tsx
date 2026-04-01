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
    <aside className="rounded-2xl border border-[#C9B27C] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>

      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <div key={group.keyName}>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">{group.title}</p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => group.onSelect("")}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                  group.selected === ""
                    ? "bg-[#F5EFD9] text-neutral-900"
                    : "bg-neutral-50 text-neutral-700"
                }`}
              >
                All
              </button>
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => group.onSelect(option.value)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                    group.selected === option.value
                      ? "bg-[#F5EFD9] text-neutral-900"
                      : "bg-neutral-50 text-neutral-700"
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

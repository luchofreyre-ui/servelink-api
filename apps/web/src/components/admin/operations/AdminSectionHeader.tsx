import type { ReactNode } from "react";

type AdminSectionHeaderProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
};

export function AdminSectionHeader({ title, description, aside }: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-white/65">{description}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

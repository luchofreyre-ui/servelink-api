import { PropsWithChildren } from "react";

type AdminPageHeaderProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}>;

export function AdminPageHeader({
  title,
  subtitle,
  actions,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b pb-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

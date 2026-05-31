import type { ReactNode } from "react";
import clsx from "clsx";

type AuthorityRightRailProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

export function AuthorityRightRail({
  children,
  label = "Authority page rail",
  className,
}: AuthorityRightRailProps) {
  return (
    <aside
      aria-label={label}
      className={clsx(
        "mt-5 space-y-4 lg:sticky lg:top-24 lg:mt-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1",
        className,
      )}
    >
      {children}
    </aside>
  );
}

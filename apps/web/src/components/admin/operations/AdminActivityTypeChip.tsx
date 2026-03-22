import clsx from "clsx";
import { labelActivityType } from "./adminOperationsLabels";

type AdminActivityTypeChipProps = {
  type: string;
  className?: string;
};

export function AdminActivityTypeChip({ type, className }: AdminActivityTypeChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-center rounded-full border border-violet-500/35 bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-100",
        className,
      )}
    >
      {labelActivityType(type)}
    </span>
  );
}

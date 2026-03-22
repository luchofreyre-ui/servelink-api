import { PropsWithChildren } from "react";

type AdminDrawerProps = PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>;

export function AdminDrawer({
  open,
  title,
  onClose,
  children,
}: AdminDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

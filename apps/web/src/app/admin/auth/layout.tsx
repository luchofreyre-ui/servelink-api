import { Suspense } from "react";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 p-8 text-white">
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

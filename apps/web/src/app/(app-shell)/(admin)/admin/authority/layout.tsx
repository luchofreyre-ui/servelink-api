import { AdminAuthoritySubnav } from "@/components/admin/AdminAuthoritySubnav";

export default function AdminAuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="border-b border-white/10 bg-neutral-950 px-6 pt-8">
        <div className="mx-auto max-w-6xl">
          <AdminAuthoritySubnav />
        </div>
      </div>
      {children}
    </>
  );
}

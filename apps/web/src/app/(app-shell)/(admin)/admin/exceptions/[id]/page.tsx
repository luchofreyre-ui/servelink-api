import { redirect } from "next/navigation";
import { buildDispatchExceptionKeyFromBookingId } from "@/types/dispatchExceptionActions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminDispatchExceptionLegacyDetailRedirectPage({
  params,
}: PageProps) {
  const { id } = await params;
  const raw = decodeURIComponent(id);
  const key = raw.startsWith("dex_v1_") ?
      raw
    : buildDispatchExceptionKeyFromBookingId(raw);
  redirect(`/admin/exceptions/actions/${encodeURIComponent(key)}`);
}

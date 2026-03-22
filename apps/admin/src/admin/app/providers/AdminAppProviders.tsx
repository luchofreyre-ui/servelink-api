import { PropsWithChildren } from "react";
import { AdminQueryProvider } from "./AdminQueryProvider";
import { AdminSessionProvider } from "./AdminSessionProvider";
import { AdminToastProvider } from "../components/feedback/AdminToastProvider";

export function AdminAppProviders({ children }: PropsWithChildren) {
  return (
    <AdminSessionProvider>
      <AdminQueryProvider>
        <AdminToastProvider>{children}</AdminToastProvider>
      </AdminQueryProvider>
    </AdminSessionProvider>
  );
}

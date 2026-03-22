import "../index.css";
import type { ReactNode } from "react";
import { ToastHost } from "@/components/shared/ToastHost";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <ToastHost />
      </body>
    </html>
  );
}

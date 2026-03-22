import type { ReactNode } from "react";
import { Manrope, Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${poppins.variable} ${manrope.variable} min-h-screen bg-[#FFF9F3] text-[#0F172A]`}>
      {children}
    </div>
  );
}

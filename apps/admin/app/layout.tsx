import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@elewate/ui-components";

import "./globals.css";

export const metadata: Metadata = {
  title: "Elewate GrowthOS — Admin",
  description: "Elewate GrowthOS — internal super-admin console.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { inter, workSans, dmMono } from "./fonts";
import { THEME_INIT_SCRIPT } from "@app/ui/theme";
import { ThemeDecorations } from "@app/ui/theme-decorations";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrowAnt",
  description: "Productos digitales especializados en un solo ecosistema.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${workSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeDecorations />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { inter, workSans, dmMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrowAnt",
  description: "Productos digitales especializados en un solo ecosistema.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||!t||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${workSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
